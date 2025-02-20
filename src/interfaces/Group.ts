import type { FeatureBoolean } from './Features'
export interface Group {
  id: number
  name: string
  role?: string
  features: FeatureBoolean
}

export interface EditingGroup {
  id?: number
  name?: string
  is_active?: boolean
}

export interface GroupSelection {
  groups: number[]
  target: number
}

export interface GroupResponse {
  total: number
  groups: Group[]
}