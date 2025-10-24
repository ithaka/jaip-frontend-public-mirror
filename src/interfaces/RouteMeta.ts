export {}

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // Must be the name of a Pharos icon.
    icon?: string
    // Routes will be grouped into dropdowns with this name as the header.
    // If no group is provided, the route will be a regular link.
    group?: string
    // Determines whether to show a search bar in the center slot of the header.
    showSearch?: boolean
    // A route with this property will only be available if the user has at
    // least one of the features included in this array.
    requiresAny?: string[]
    // A route with this property will only be available if the user has
    // all of the features included in this array.
    requiresAll?: string[]
    // A route with this property will only be available if the user has
    // at least of the ungrouped features included in this array.
    requiresAnyUngrouped?: string[]
    // A route with this property will only be available if the user has
    // all of the ungrouped features included in this array.
    requiresAllUngrouped?: string[]
    // If true, the route will not be shown in navigation menus.
    hidden?: boolean
    // If true, the route will be shown in the footer.
    showInFooter?: boolean
    // Label to use in navigation menus instead of the route name.
    label: string
  }
}
