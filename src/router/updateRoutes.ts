import createRouter from '@/router/createRouter'
import type { Router } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { UngroupedFeatureDetails, FeatureBoolean } from '@/interfaces/Features'

export default (isStudent: boolean, isAdmin: boolean, currentRouter: Router) => {
  const currentRoutes = currentRouter.getRoutes()
  currentRoutes.forEach((route) => {
    currentRouter.removeRoute(route.name || '')
  })

  const userStore = useUserStore()
  const newRouter = createRouter(isStudent, isAdmin)
  const newRoutes = newRouter.getRoutes()
  const hasAny = (reqs: string[], features: FeatureBoolean): boolean => {
    return reqs.some((feature) => features[feature])
  }
  const hasAnyUngrouped = (reqs: string[], features: UngroupedFeatureDetails): boolean => {
    if (!features) return false
    return reqs.some((feature) => (features[feature] || {}).enabled)
  }
  const hasAll = (reqs: string[], features: FeatureBoolean): boolean => {
    return reqs.every((feature) => features[feature])
  }
  const hasAllUngrouped = (reqs: string[], features: UngroupedFeatureDetails): boolean => {
    if (!features) return false
    return reqs.every((feature) => (features[feature] || {}).enabled)
  }
  newRoutes.forEach((route) => {
    if (route.meta.requiresAny) {
      if (hasAny(route.meta.requiresAny || [], userStore.features)) {
        currentRouter.addRoute(route)
      }
    } else if (route.meta.requiresAll) {
      if (hasAll(route.meta.requiresAll || [], userStore.features)) {
        currentRouter.addRoute(route)
      }
    } else if (route.meta.requiresAnyUngrouped) {
      if (hasAnyUngrouped(route.meta.requiresAnyUngrouped || [], userStore.ungroupedFeatures)) {
        currentRouter.addRoute(route)
      }
    } else if (route.meta.requiresAllUngrouped) {
      if (hasAllUngrouped(route.meta.requiresAllUngrouped || [], userStore.ungroupedFeatures)) {
        currentRouter.addRoute(route)
      }
    } else {
      currentRouter.addRoute(route)
    }
  })
}
