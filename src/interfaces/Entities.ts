import type { Group } from './Group'
import type { UngroupedFeatureDetails } from './Features'
export interface User {
  id?: number
  name: string
  type: string
  ungrouped_features: UngroupedFeatureDetails
  // This value is only used when adding or editing users
  email?: string
  groups: Array<Group>
}

export interface Entity {
  id?: number
  name?: string
  // This is the only necessary value when adding or editing
  type: string
  ungrouped_features?: UngroupedFeatureDetails
  // This value is only used when adding or editing
  contact?: string
  groups?: Array<Group>
  subdomain?: string
  primary_sitecode?: string
}
