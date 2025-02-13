export interface EntitiesArgs {
  groups: Array<number>
  query: String
  limit: number
  page: number
}

export interface EntityOption {
  feature: string
  title: string
  titleSingular: string
  type: EntityTypes
  icon: string
}

export interface EntityObject {
  users?: EntityOption
  facilities?: EntityOption
}

export enum EntityTypes {
  Users = 'users',
  Facilities = 'facilities'
}

export enum EntityActions {
  Add = 'add',
  Edit = 'edit'
}
