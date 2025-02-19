import { defineStore } from 'pinia'
import type { Feature, FeatureObject, CategorizedFeatures } from '@/interfaces/Features'
import type { Group } from '@/interfaces/Group'

export const useFeaturesStore = defineStore('features', {
  state: () => {
    return {
      features: [] as Feature[],
    }
  },
  actions: {
    categorizedFeatures(group: Group | undefined, entity: string, includeAll: boolean) {
      if (!group) {
        return {}
      }
      const categories: CategorizedFeatures = {}
      this.features
        .filter((f: Feature) => {
          const hasFeatureInGroup = group.features[f.name]
          const isFacility = entity === 'facilities'
          const isAdminOnly = f.is_admin_only
          return hasFeatureInGroup || !isAdminOnly || !isFacility
        })
        .forEach((feature: Feature) => {
          if (feature.category) {
            if (!categories[feature.category]) {
              categories[feature.category] = []
            }
            if (group.features[feature.name] || includeAll) {
              categories[feature.category].push(feature)
            }
          }
        })
      return categories
    },
  },
  getters: {
    featuresObject() {
      const features: FeatureObject = {}
      this.features.forEach((feature: Feature) => {
        features[feature.name] = {
          display_name: feature.display_name,
          name: feature.name,
          category: feature.category,
          description: feature.description,
          is_admin_only: feature.is_admin_only,
        }
      })
      return features
    },
  },
})
