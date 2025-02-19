import { defineStore } from 'pinia'
import type { Group } from '@/interfaces/Group'
import { useCoreStore } from './core'
import { removeCookie } from 'typescript-cookie'
import { useFeaturesStore } from './features'
import type { UngroupedFeatureDetails, FeatureBoolean, FeatureDetails } from '@/interfaces/Features'
import type { Subdomain } from '@/interfaces/Subdomains'

const hasAdminFeatures = (group: Group) => {
  const features = useFeaturesStore()
  for (const name in group.features) {
    if (group.features[name] && (features.featuresObject[name] || {}).is_admin_only) {
      return true
    }
  }
  return false
}
const sortUngroupedFeatures = (
  ungroupedFeatures: UngroupedFeatureDetails,
): { [key: string]: UngroupedFeatureDetails } => {
  const sorted = {} as { [key: string]: UngroupedFeatureDetails }
  for (const key in ungroupedFeatures) {
    const feature = ungroupedFeatures[key]
    if (!sorted[feature.category]) {
      sorted[feature.category] = {}
    }
    sorted[feature.category][key] = { ...feature }
  }
  return sorted
}

const getEnabledFeatures = (features: UngroupedFeatureDetails): UngroupedFeatureDetails => {
  return Object.keys(features).reduce((obj, key) => {
    if (features[key].enabled) {
      obj[key] = features[key]
    }
    return obj
  }, {} as UngroupedFeatureDetails)
}

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      id: 0,
      entityName: '',
      groups: [] as Group[],
      type: '',
      gettingUser: false,
      selectedGroups: {} as { [key: string]: number[] },
      ungroupedFeatures: {} as UngroupedFeatureDetails,
      availableSubdomains: [] as Subdomain[],
      gettingSubdomains: false,
      // This is the number of groups that a user must have before the group selection dropdown switches
      // from a dropdown button to a select element
      groupThreshold: 5,

      // In some cases, a user may have a valid JSTOR account, but not have admin access to the site. If they attempt to log in, we'll
      // indicate which email they used and that they don't have access to the site.
      invalidUserEmail: '',
    }
  },
  actions: {
    $reset() {
      this.entityName = ''
      this.groups = []
      this.type = ''
      removeCookie('uuid')
    },
    async getCurrentUser() {
      this.gettingUser = true
      const core = useCoreStore()
      const { data } = await core.$api.auth.session()
      this.groups = data.groups
      this.type = data.type
      this.entityName = data.name
      this.ungroupedFeatures = data.ungrouped_features
      this.gettingUser = false
    },
    groupsWithFeature(groups: Array<Group>, feature: string): Array<Group> {
      const withFeature = []
      for (const i in groups) {
        if (groups[i].features[feature]) {
          withFeature.push(groups[i])
        }
      }
      return withFeature
    },
    groupIDsWithFeature(groups: Array<Group>, feature: string): Array<number> {
      return this.groupsWithFeature(groups, feature).map((grp: Group) => grp.id)
    },
    isSingleGroupFeature(feature: string): boolean {
      const foundGroups = []
      for (let i = 0; i < this.groups.length; i++) {
        if ((this.groups[i].features || {})[feature]) {
          foundGroups.push(this.groups[i].id)
        }
      }
      return foundGroups.length == 1
    },
    hasFeatureInGroups(groups: Array<number>, feature: string): boolean {
      const foundGroups = []
      for (let i = 0; i < this.groups.length; i++) {
        if (groups.includes(this.groups[i].id) && (this.groups[i].features || {})[feature]) {
          foundGroups.push(this.groups[i].id)
        }
      }
      return groups.length > 0 && groups.length === foundGroups.length
    },
    sortUngroupedFeatures(ungroupedFeatures: UngroupedFeatureDetails): {
      [key: string]: UngroupedFeatureDetails
    } {
      return sortUngroupedFeatures(ungroupedFeatures)
    },
    getEnabledFeatures(features: UngroupedFeatureDetails): UngroupedFeatureDetails {
      return getEnabledFeatures(features)
    },
  },
  getters: {
    groupMap(): Map<number, Group> {
      return this.groups.reduce((map, group) => {
        map.set(group.id, group)
        return map
      }, new Map<number, Group>())
    },
    isAdmin(): boolean {
      // If the user has access to admin-only features, then the user is an admin
      return this.groups.some((group) => hasAdminFeatures(group))
    },
    adminGroups(): Array<Group> {
      // Returns an array including only those groups with admin-only features
      return this.groups.filter((group) => hasAdminFeatures(group))
    },
    isSingleGroupAdmin(): boolean {
      return this.adminGroups.length === 1
    },
    groupIDs(): Array<number> {
      return this.groups.map((group) => group.id)
    },
    isAuthenticated(): boolean {
      return !!this.entityName
    },
    isAuthenticatedStudent(): boolean {
      const core = useCoreStore()
      return core.hasValidStudentSubdomain && this.isAuthenticated
    },
    isAuthenticatedAdmin(): boolean {
      const core = useCoreStore()
      const correctSubdomain = core.adminSubdomain === core.subdomain
      return correctSubdomain && this.isAdmin
    },
    isUnauthenticated(): boolean {
      return !this.gettingUser && !this.isAuthenticatedStudent && !this.isAuthenticatedAdmin
    },
    features(): FeatureBoolean {
      const features: FeatureBoolean = {}
      this.groups.forEach((group) => {
        for (const key in group.features) {
          if (group.features[key]) {
            features[key] = true
          }
        }
      })
      return features
    },
    featureDetails(): FeatureDetails {
      const features: FeatureDetails = {}
      this.groups.forEach((group) => {
        for (const key in group.features) {
          if (!features[key]) {
            features[key] = {
              enabled: false,
              groups: [],
              disabled_groups: [],
            }
          }
          if (group.features[key]) {
            features[key].enabled = true
            features[key].groups.push(group.id)
          } else {
            features[key].disabled_groups.push(group.id)
          }
        }
      })
      return features
    },
    sortedUngroupedFeatures(): { [key: string]: UngroupedFeatureDetails } {
      return sortUngroupedFeatures(this.ungroupedFeatures)
    },
    enabledUngroupedFeatures(): UngroupedFeatureDetails {
      return getEnabledFeatures(this.ungroupedFeatures)
    },
    sortedEnabledUngroupedFeatures(): { [key: string]: UngroupedFeatureDetails } {
      return sortUngroupedFeatures(this.enabledUngroupedFeatures)
    },
  },
})
