// GENERIC LOGS
// These provide a baseline log structure for common actions that can be
// customized as needed.

import { LogEvent, type WorkingLog } from '@/interfaces/Log'
import type { PaginationDirections } from '@/interfaces/Queries'
import type { ViewerControlOptions } from '@/interfaces/Viewer'

export const generics = {
  error: (options: { message: string; code?: string }): WorkingLog => {
    return {
      eventtype: LogEvent.error,
      event_description: `Error occurred: ${options.message}`,
      action: 'error_occurred',
      reason: options.message,
      code: options.code,
    }
  },
  searchLog: (target: string): WorkingLog => {
    return {
      eventtype: LogEvent.form_submit,
      event_description: `Searched for ${target}`,
      action: `search_${target}`,
    }
  },
  changePage: (options: {
    direction: PaginationDirections
    results_type: string
    newPage: number
  }): WorkingLog => {
    return {
      eventtype: LogEvent.link_click,
      event_description: `Changed to ${options.direction} page in ${options.results_type} query results`,
      action: `${options.direction}_page`,
      results_type: options.results_type,
      page: options.newPage,
    }
  },
  openModal: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.button_click,
      event_description: `Opened ${type} modal`,
      action: `open_${type}_modal`,
    }
  },
  closeModal: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.modal_close,
      event_description: `Closed ${type} modal`,
      action: `close_${type}_modal`,
    }
  },
  dropdownOpen: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.dropdown_open,
      event_description: `Opened ${type} dropdown`,
      action: `open_${type}_dropdown`,
    }
  },
  dropdownSelect: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.dropdown_select,
      event_description: `Selected item from ${type} dropdown`,
      action: `select_${type}`,
    }
  },
  dropdownMultiselect: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.dropdown_select,
      event_description: `Selected values from ${type} dropdown`,
      action: `select_${type}`,
    }
  },
  dropdownMultiselectClear: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.dropdown_select,
      event_description: `Cleared selections from ${type} dropdown`,
      action: `clear_${type}_selections`,
    }
  },
  checkboxToggle: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.checkbox_toggle,
      event_description: `Toggled ${type}`,
      action: `toggle_${type}`,
    }
  },
  formSubmit: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.form_submit,
      event_description: `Submitted ${type}`,
      action: `submit_${type}`,
    }
  },
  buttonClick: (type: string): WorkingLog => {
    return {
      eventtype: LogEvent.button_click,
      event_description: `Clicked ${type} button`,
      action: `${type}_button_clicked`,
    }
  },
  linkClick: (destination: string, action = 'navigation'): WorkingLog => {
    return {
      eventtype: LogEvent.link_click,
      event_description: `${destination} link clicked`,
      action,
      destination,
    }
  },
  pageLanding: (): WorkingLog => {
    return {
      eventtype: LogEvent.page_landing,
      event_description: `Landed on page`,
      action: `landed_on_page`,
    }
  },
  pageExit: (): WorkingLog => {
    return {
      eventtype: LogEvent.page_exit,
      event_description: `Exited page`,
      action: `exited_page`,
    }
  },
  routeChange: (options: { to: string; from: string }): WorkingLog => {
    return {
      eventtype: LogEvent.route_change,
      event_description: `Navigated to ${options.to} from ${options.from}`,
      action: `navigated_to_${options.to.replace(/\//g, '_')}`,
      destination: options.to,
      origin_page: options.from,
    }
  },
  viewerControl: (options: { action: ViewerControlOptions; iid: string }): WorkingLog => {
    return {
      eventtype: LogEvent.viewer_control,
      event_description: `Used viewer control: ${options.action}`,
      action: `${options.action}`,
      itemid: options.iid,
    }
  },
  startViewingSession: (options: { iid: string }): WorkingLog => {
    return {
      eventtype: LogEvent.start_viewing_session,
      event_description: `Started viewing session`,
      action: `start_viewing_session`,
      itemid: options.iid,
    }
  },
  endViewingSession: (options: { iid: string }): WorkingLog => {
    return {
      eventtype: LogEvent.end_viewing_session,
      event_description: `Ended viewing session`,
      action: `end_viewing_session`,
      itemid: options.iid,
    }
  },
}
