import { defineStore } from 'pinia'
import type { Group } from '@/interfaces/Group'
import { useCoreStore } from './core'
import { useFeaturesStore } from './features'
import type { UngroupedFeatureDetails, FeatureBoolean, FeatureDetails } from '@/interfaces/Features'
import type { Subdomain } from '@/interfaces/Subdomains'
import { setCookie } from 'typescript-cookie'
import type { Entity } from '@/interfaces/Entities'

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
    if (feature?.category && !sorted[feature.category]) {
      sorted[feature.category] = {}
    }
    if (key && feature) {
      sorted[feature.category]![key] = { ...feature }
    }
  }
  return sorted
}

const getEnabledFeatures = (features: UngroupedFeatureDetails): UngroupedFeatureDetails => {
  return Object.keys(features).reduce((obj, key) => {
    if (features[key]?.enabled) {
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
      facilities: [] as Entity[],
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
      this.facilities = []
      // removeCookie('uuid')
    },
    async getCurrentUser() {
      this.gettingUser = true
      const core = useCoreStore()
      const { data } = await core.$api.auth.session()

      if (data?.uuid) {
        const inOneDay = new Date(new Date().getTime() + 24 * 3600 * 1000)
        setCookie('uuid', data.uuid, { expires: inOneDay, sameSite: 'None', secure: true })
      }

      this.groups = data.groups
      this.type = data.type
      this.entityName = data.name
      this.ungroupedFeatures = data.ungrouped_features
      this.facilities = data.facilities || []
      this.gettingUser = false
    },
    groupsWithFeature(groups: Array<Group>, feature: string): Array<Group> {
      const withFeature = []
      for (const i in groups) {
        if (groups[i]?.features[feature]) {
          withFeature.push(groups[i])
        }
      }
      return withFeature
    },
    groupIDsWithFeature(groups: Array<Group>, feature: string): Array<number> {
      return this.groupsWithFeature(groups, feature).map((grp: Group) => grp.id)
    },
    // Determines if a user has a given feature in only a single group.
    // This is useful for determining if the user can be treated as a single group user
    // for the purposes of that feature (e.g., do we need to show a group selector for denials)
    isSingleGroupFeature(feature: string): boolean {
      const foundGroups = []
      for (let i = 0; i < this.groups.length; i++) {
        if ((this.groups[i]?.features || {})[feature] && this.groups[i]?.id) {
          foundGroups.push(this.groups[i]!.id)
        }
      }
      return foundGroups.length == 1
    },
    hasFeatureInGroups(groups: Array<number>, feature: string): boolean {
      const foundGroups = []
      for (let i = 0; i < this.groups.length; i++) {
        if (
          this.groups[i]?.id &&
          groups.includes(this.groups[i]!.id) &&
          (this.groups[i]?.features || {})[feature]
        ) {
          foundGroups.push(this.groups[i]!.id)
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
      return core.isAdminSubdomain && this.isAdmin
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
    isRestrictedListSubscriber(): boolean {
      return this.groups.some((group) => {
        return group.features['restricted_items_subscription']
      })
    },
    canViewRestrictedListInGroups(): Array<number> {
      // If the user can manage the restricted list, then they can view it (this is the
      // ITHAKA-only permission)
      if (this.ungroupedFeatures['manage_restricted_list']?.enabled) {
        return this.groups.map((group) => group.id)
      }

      // If the user can do any media reviews or manage facilities then they can view the restricted list.
      return this.groups
        .filter((group) => {
          return (
            group.features['approve_requests'] ||
            group.features['deny_requests'] ||
            group.features['bulk_approve'] ||
            group.features['undo_bulk_approve'] ||
            group.features['edit_facilities'] ||
            group.features['manage_facilities'] ||
            group.features['add_or_edit_users'] ||
            group.features['remove_users']
          )
        })
        .map((group) => group.id)
    },
    // If any group has the privileges necessary to view the restricted list, then the user can view it.
    canViewRestrictedList(): boolean {
      return this.canViewRestrictedListInGroups.length > 0
    },
    canSubscribeToRestrictedList(): boolean {
      return this.groups.some((group) => {
        return group.features['edit_facilities'] || group.features['manage_facilities']
      })
    },
    // In general, it only matters if the user can view the list in any group, but when we're determining
    // if the user can subscribe to the restricted list, we need to get the facilities where the user would have
    // subscription privileges, which requires getting the facilities in groups where the user has the appropriate
    // permissions.
    canSubscribeToRestrictedListInGroups(): Array<number> {
      return this.groups
        .filter((group) => {
          return group.features['edit_facilities'] || group.features['manage_facilities']
        })
        .map((group) => group.id)
    },
    // Returns an array of facilities in the user's groups that do not subscribe to the restricted list.
    unsubscribedFacilities(): Array<Entity> {
      return this.facilities.filter((facility) => {
        // If we have groups and a facility id (which we should)
        if (facility.groups && facility.groups[0] && facility.id) {
          // Then we can check if the facility does not subscribe to the restricted list
          return !facility.groups[0].features['restricted_items_subscription']
        }
      })
    },
    // Returns true if the user has unsubscribed facilities
    hasUnsubscribedFacilities(): boolean {
      return this.unsubscribedFacilities.length > 0
    },
    // Returns an array of unsubscribed facilities that the user can subscribe to the restricted list in.
    possibleSubscriptionFacilities(): Array<Entity> {
      return this.unsubscribedFacilities.filter((facility) => {
        // We know that there is a group and that the facility has an ID because we check that in unsubscribedFacilities.
        // Now we just filter out those groups where the user does not have permission to subscribe to the restricted list.
        const facility_group = facility.groups![0]
        if (facility_group?.id) {
          return (
            !facility_group?.features['restricted_items_subscription'] &&
            this.canSubscribeToRestrictedListInGroups.includes(facility_group?.id)
          )
        }
        return false
      })
    },
    // Returns true if the user has any facilities that they can subscribe to the restricted list in.
    hasPossibleSubscriptionFacilities(): boolean {
      return this.possibleSubscriptionFacilities.length > 0
    },
    allFacilitiesAreRestricted(): boolean {
      return this.facilities.every((facility) => {
        return (
          facility.groups &&
          facility.groups[0] &&
          facility.groups[0].features['restricted_items_subscription']
        )
      })
    },
  },
})
