export interface Log {
  eventtype: string
  event_description: string
  itemid?: string
  frontend_error?: string
  comments?: string
  reason?: string
  dois?: string[]
  groups?: number[]
  journals?: string[]
  disciplines?: string[]
  code?: string
  page_index?: number
}
