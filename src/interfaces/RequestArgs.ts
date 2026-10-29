export interface RequestArgs {
  name?: string
  comments: string
  dois: string
}

export interface RequestPermissionsArgs {
  facility_id: number
  start_date: string
  end_date: string | null
}
