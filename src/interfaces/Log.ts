import type { RouteRecordNameGeneric } from 'vue-router'
import type { Collections } from './Collections'
import type { Ref } from 'vue'
import type { Entity } from './Entities'
import type { Subdomain } from './Subdomains'
import type { ViewerError } from './Viewer'

// These LogEvent enum values define the different types of log events. These are deliberately
// fairly broad to allow for flexibility in logging various user interactions and ease of aggregation.
// For more specific actions, additional fields in the log can be used, such as 'action' and 'event_description'.
// NOTE: Any log event added here must also be added to the LOG_EVENTS array in the backend to ensure it is
// accepted by the logging API.
export enum LogEvent {
  button_click = 'button_click',
  dropdown_open = 'dropdown_open',
  dropdown_select = 'dropdown_select',
  checkbox_toggle = 'checkbox_toggle',
  modal_close = 'modal_close',
  modal_open = 'modal_open',
  link_click = 'link_click',
  radio_select = 'radio_select',
  form_submit = 'form_submit',
  error = 'error',
  page_landing = 'page_landing',
  page_exit = 'page_exit',
  route_change = 'route_change',
  start_viewing_session = 'start_viewing_session',
  end_viewing_session = 'end_viewing_session',
  viewer_control = 'viewer_control',
}

export type EventType = `pep_fe_${LogEvent}`

// BaseLog contains all the optional and common fields for logs.
// It should not be exported or used directly. Use WorkingLog or FinalLog instead.
interface BaseLog {
  // Event description provides a human-readable description of the event.
  event_description: string
  // Action is a short string identifying the action taken by the user. This is intended for disaggregating
  // events of the same type.
  action?: string
  itemid?: string
  group_id?: number
  frontend_error?: string
  comments?: string
  reason?: string
  dois?: string[]
  groups?: number[]
  journals?: string[]
  disciplines?: string[]
  code?: string
  page_index?: number
  collection?: Collections
  filename?: string
  feature_id?: number
  feature_name?: string
  entity_id?: number
  entity_type?: string
  search_query?: Ref<string> | string
  page?: number
  new_value?: string | number | boolean | null
  destination?: string | null
  is_new?: boolean
  group_name?: string
  results_type?: string
  checkbox_label?: string
  value?: string | number | boolean
  values?: string[] | number[] | boolean[]
  entity?: Entity
  is_global?: boolean
  subdomain_id?: Subdomain['id']
  subdomain_name?: Subdomain['subdomain']
  user_id?: number
  user_name?: string
  user_contact?: string
  source?: string
  event_uuid?: string
  origin_page?: string
  is_reentry_content?: boolean
  total_pages?: number
  current_page?: number
  previous_page?: number
  viewer_error?: ViewerError
}

// WorkingLog is the log structure used within the application before being
// enhanced with additional context to create a FinalLog.
export interface WorkingLog extends BaseLog {
  eventtype: LogEvent
}

// FinalLog is the log structure sent to the logging API, with additional context
// information included.
export interface FinalLog extends BaseLog {
  eventtype: EventType
  route_name: RouteRecordNameGeneric
  path: string
  full_path: string
  query_params: string | undefined
  component: string
  parents: string[]
  timestamp: Date
  window_dimensions?: { width: number; height: number }
  document_dimensions?: { width: number; height: number }
  is_dark_mode: boolean
}

// TODO: This is being kept temporarily to avoid breaking changes. It should be removed
// when all uses of Log have been replaced with WorkingLog.
export interface Log extends BaseLog {
  eventtype: string
}
