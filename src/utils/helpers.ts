import type { FeatureDetails } from '@/interfaces/Features'
import type { BulkHistory, History } from '@/interfaces/MediaRecord'
import type { Router, RouteRecordNormalized } from 'vue-router'
import type { RoutesObject } from '@/interfaces/Routes'
import type { ComponentInternalInstance } from 'vue'

export const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value
  let stringified: string
  try {
    stringified = JSON.stringify(value)
  } catch {
    stringified = '[Unable to stringify the thrown value]'
  }

  const error = new Error(`This value was thrown as is, not through an Error: ${stringified}`)
  return error
}

export const makeGrammaticalList = (original: Array<string>) => {
  const arr = [...original]
  if (arr.length >= 2) {
    const last: string = `and ${arr.pop()}`
    arr.push(last)
  }
  let list: string
  if (arr.length >= 3) {
    list = arr.join(', ')
  } else {
    list = arr.join(' ')
  }
  return list
}

export const capitalize = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
    .join(' ')
}

export const hasStaticBlock = (): boolean => {
  let hsb = true
  try {
    new Function(
      "class ClassWithStaticInitializationBlock {static staticProperty1 = 'Property 1'; static staticProperty2; static { this.staticProperty2 = 'Property 2'; }}",
    )
  } catch {
    hsb = false
  }
  return hsb
}

export const getBulkApprovalStatus = (opts: History[] | BulkHistory[], groups: number[]) => {
  if (!opts) return false
  const numStatuses = Object.keys(opts).length
  if (!numStatuses) return false
  let hasApproved = false
  for (let i = 0; i < opts.length; i++) {
    if (opts[i]?.groupID && groups.includes(opts[i]!.groupID) && opts[i]!.status === 'Approved') {
      hasApproved = true
    }
  }
  return hasApproved
}

export const getStatus = (opts: { [key: string]: History }, groups: number[]): string => {
  if (!Object.keys(opts || {}).length) return ''
  let status = ''
  if (groups[0] && opts[groups[0]]) {
    status = opts[groups[0]]!.status || ''
  }
  const returnStatus =
    status == 'Approved by Discipline' || status == 'Approved by Journal' ? 'Approved' : status
  return returnStatus.toLowerCase()
}

// Parses a groups query parameter which can be either a JSON array string or a comma-separated list of group IDs,
// and returns an array of valid integer group IDs. This function is necessary to handle arrays in query parameters,
// which don't always handle brackets nicely. Having brackets in the url can cause issues with encoding that break the
// login process.
export const parseGroupsQueryParam = (groupsParam: string | null | undefined): number[] => {
  const rawGroups = groupsParam?.trim()
  if (!rawGroups) {
    return []
  }

  try {
    if (rawGroups.startsWith('[')) {
      return JSON.parse(rawGroups)
        .map((groupId: unknown) => Number(groupId))
        .filter((groupId: number) => Number.isInteger(groupId))
    }
  } catch {
    // It's fine if this fails, we'll just try parsing it as a comma-separated list below
  }

  return rawGroups
    .split(',')
    .map((groupId) => Number(groupId.trim()))
    .filter((groupId) => Number.isInteger(groupId))
}

export const serializeGroupsQueryParam = (groups: number[] | undefined): string | undefined => {
  if (!groups?.length) {
    return undefined
  }

  return groups.join(',')
}

export const changeRoute = (
  router: Router,
  emit: ((event: 'close', ...args: unknown[]) => void) | undefined,
  path: string,
  term: string,
  page: number,
  groups: number[] | undefined,
  statusQuery: string | undefined,
  options: {
    includeSearchQuery?: boolean
    closeOnNavigate?: boolean
  } = {},
) => {
  const includeSearchQuery = options.includeSearchQuery ?? true
  const closeOnNavigate = options.closeOnNavigate ?? true

  const route = router.getRoutes().find((r) => r.path === path)
  if (route?.redirect) {
    window.open(route.redirect as string, '_blank')
    return
  }
  if (router.currentRoute.value.path !== path) {
    page = 1
  }

  if (includeSearchQuery) {
    const statusq = statusQuery
    router.push({
      path,
      query: {
        term,
        page,
        groups: serializeGroupsQueryParam(groups),
        statusq: statusq,
      },
    })
  } else {
    router.push({ path })
  }

  if (closeOnNavigate) {
    emit?.('close')
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const combineArrays = (array1: Array<any>, array2: Array<any>) => {
  return Array.from(new Set([...array1, ...array2]))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const arraysAreEqual = (array1: Array<any>, array2: Array<any>) => {
  if (array1.length === array2.length) {
    return array1.every((element: unknown) => {
      if (array2.includes(element)) {
        return true
      }
      return false
    })
  }

  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uniqueArray = (arr: Array<any>) => {
  const a = arr.concat()
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1)
    }
  }
  return a
}

export const getGroupsWithStatus = (
  statuses: { [key: string]: History },
  status: string,
): number[] => {
  if (!statuses) return []
  return Object.values(statuses)
    .filter((history: History) => {
      return history.status.toLowerCase() === status.toLowerCase()
    })
    .map((history: History) => {
      return history.groupID
    })
}

export const hideButton = (
  featureDetails: FeatureDetails,
  statuses: { [key: string]: History },
  status: string,
  fname: string,
): boolean => {
  const feature = featureDetails[fname]
  if (!feature?.enabled) {
    return true
  }
  const groupsWithStatus = getGroupsWithStatus(statuses, status)
  return !feature?.groups.some((id: number) => !groupsWithStatus.includes(id))
}

export const isEmail = (email: string): boolean => {
  const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

export const formatRouteName = (route: RouteRecordNormalized): string => {
  if (route.name) {
    return capitalize(String(route.name))
  }
  return ''
}

/**
 * Compares two routes alphabetically by their name for sorting.
 * @param a - First route to compare
 * @param b - Second route to compare
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export const compareRoutesByName = (a: RouteRecordNormalized, b: RouteRecordNormalized): number => {
  const aName = String(a.name || '').toLowerCase()
  const bName = String(b.name || '').toLowerCase()
  return aName.localeCompare(bName)
}

/**
 * Collects and organizes routes into home, ungrouped, and grouped categories.
 * @param routes - Array of routes to organize
 * @param filterFn - Filter function to determine which routes to include
 * @returns Object containing homeRoute, ungrouped array, and grouped object
 */
export const collectOrganizedRoutes = (
  routes: RouteRecordNormalized[],
  filterFn: (route: RouteRecordNormalized) => boolean,
): {
  homeRoute: RouteRecordNormalized | null
  ungrouped: RouteRecordNormalized[]
  grouped: { [key: string]: RouteRecordNormalized[] }
} => {
  let homeRoute: RouteRecordNormalized | null = null
  const ungrouped: RouteRecordNormalized[] = []
  const grouped: { [key: string]: RouteRecordNormalized[] } = {}

  routes.forEach((route) => {
    if (filterFn(route)) {
      if (route.name === 'home') {
        homeRoute = route
      } else if (route.meta?.group) {
        if (!grouped[route.meta.group]) {
          grouped[route.meta.group] = []
        }
        grouped[route.meta.group].push(route)
      } else {
        ungrouped.push(route)
      }
    }
  })

  return { homeRoute, ungrouped, grouped }
}

/**
 * Organizes routes into grouped and ungrouped categories, excluding hidden routes.
 * Home is always first in the ungrouped list, followed by other ungrouped routes
 * sorted alphabetically by route name. Routes with a meta.group are organized by group.
 * @param router - The Vue Router instance containing the application's routes.
 * @returns An object with grouped and ungrouped routes sorted for menu navigation.
 */
export const getOrganizedRoutes = (router: Router): RoutesObject => {
  const routes = router.getRoutes()
  const { homeRoute, ungrouped, grouped } = collectOrganizedRoutes(
    routes,
    (route) => !route.meta.hidden,
  )

  ungrouped.sort(compareRoutesByName)

  const result: RoutesObject = { grouped, ungrouped: [] }
  if (homeRoute) {
    result.ungrouped.push(homeRoute)
  }
  result.ungrouped.push(...ungrouped)

  return result
}

export const getAncestorComponentNames = (
  component: ComponentInternalInstance | null,
  ancestors: string[] = [],
): string[] => {
  const parent = component?.parent
  if (parent) {
    ancestors.push(parent.type.__name || 'AnonymousComponent')
    return getAncestorComponentNames(parent, ancestors)
  }
  return ancestors
}

/**
 * Creates an async promisified version of setTimeout
 * @param ms - The number of milliseconds to wait
 * @returns A promise that resolves after the specified delay
 */
export const setAsyncTimeout = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/** Capitalizes the first character of a string.
 * @param str - The string to capitalize
 * @returns The input string with the first character capitalized
 */
export const capitalizeFirstLetter = (str: string) => {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}
