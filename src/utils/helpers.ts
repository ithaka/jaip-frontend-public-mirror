import type { FeatureDetails } from '@/interfaces/Features'
import type { BulkHistory, History } from '@/interfaces/MediaRecord'
import type { Router, RouteRecordNormalized } from 'vue-router'
import type { RoutesObject } from '@/interfaces/Routes'

export const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value
  let stringified = '[Unable to stringify the thrown value]'
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
  let list: string = ''
  if (arr.length >= 3) {
    list = arr.join(', ')
  } else {
    list = arr.join(' ')
  }
  return list
}

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
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

export const changeRoute = (
  router: Router,
  emit: (event: 'close', ...args: unknown[]) => void,
  path: string,
  term: string,
  page: number,
  groups: number[] | undefined,
  statusQuery: string | undefined,
) => {
  if (router.currentRoute.value.path !== path) {
    page = 1
  }
  const statusq = statusQuery
  router.push({
    path,
    query: {
      term,
      page,
      groups: JSON.stringify(groups),
      statusq: statusq,
    },
  })
  emit('close')
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
 * Organizes routes into grouped and ungrouped categories based on their metadata.
 */
export const getOrganizedRoutes = (router: Router): RoutesObject => {
  const routes = router.getRoutes()
  return routes.reduce(
    (obj: RoutesObject, route) => {
      if (route.meta.hidden) {
        return obj
      }
      if (route.meta.group) {
        if (!obj.grouped[route.meta.group]) {
          obj.grouped[route.meta.group] = []
        }
        obj.grouped[route.meta.group]?.push(route)
      } else {
        obj.ungrouped.push(route)
      }
      return obj
    },
    {
      grouped: {},
      ungrouped: [],
    } as RoutesObject,
  )
}
