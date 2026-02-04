export enum ViewerControls {
  toggle_menu = 'toggle-menu',
  rotate_right = 'rotate-right',
  rotate_left = 'rotate-left',
  zoom_in = 'zoom-in',
  zoom_out = 'zoom-out',
  fit_view = 'fit-view',
  update_page = 'update-page',
  scroll_to_page = 'scroll-to-page',
  toggle_fullscreen = 'toggle-fullscreen',
}
export type ViewerControlOptions = `${ViewerControls}`

export interface ViewerError {
  message: string
  code?: number
  status: boolean
}
