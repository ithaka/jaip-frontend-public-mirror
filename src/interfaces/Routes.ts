import type { RouteRecordNormalized } from 'vue-router'
export interface RoutesObject {
  grouped: {
    [key: string]: RouteRecordNormalized[]
  }
  ungrouped: RouteRecordNormalized[]
}
