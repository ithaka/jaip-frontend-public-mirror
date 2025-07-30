<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { capitalize, changeRoute } from '@/utils/helpers'
import type { RoutesObject } from '@/interfaces/Routes'

const props = defineProps({
  sidenav: {
    type: Boolean,
    default: false,
  },
})

const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const routesObject = (): RoutesObject => {
  // This will group routes based on the meta.group property,
  // leaving ungrouped routes in a separate category
  const routes = router.getRoutes()
  return routes.reduce(
    (obj: RoutesObject, route) => {
      if (route.meta.hidden) {
        return obj
      }
      if (route.meta.group) {
        if (!obj.grouped[route.meta.group]) {
          obj.grouped[route.meta.group] = []
        }
        obj.grouped[route.meta.group].push(route)
      } else {
        obj.ungrouped.push(route)
      }
      return obj
    },
    {
      grouped: {},
      ungrouped: [],
    } as RoutesObject,
  )
}
const r = routesObject()
const ungroupedRoutes = r.ungrouped
const groupedRoutes = r.grouped
// This is a little hacky. We have a div below that needs a v-for, but can't appear in the sidenav.
// If it's wrapped in a div, it ruins the positioning of the dropdown menu outside the sidenav. Using this lets us
// skirt the issue by using the v-for on an empty object.
const menuHeaders = props.sidenav ? {} : r.grouped
const emit = defineEmits(['close'])
</script>

<template>
  <component :is="sidenav ? 'div' : 'pep-pharos-dropdown-menu-nav'" id="nav">
    <div>
      <!-- Start with an routes that don't have a dropdown (possibly just "Home") 
      Grouping routes keeps the header narrow, which means we don't need an drawer
      until things get relatively narrow. -->
      <component
        :is="sidenav ? 'pep-pharos-sidenav-link' : 'pep-pharos-dropdown-menu-nav-link'"
        v-for="route in ungroupedRoutes"
        :key="`route_${String(route.name)}`"
        :bold="!sidenav"
        :flex="!sidenav"
        href
        @click.prevent.stop="
          changeRoute(router, emit, route.path, searchTerms, pageNo, undefined, undefined)
        "
      >
        <!-- Display any icon specififed in the route's meta.icon property. 
        NOTE: This keeps the menu options level with the dropdowns. -->
        <pep-pharos-icon
          v-if="route.meta.icon"
          :a11y-title="'Route Icon'"
          :name="route.meta.icon"
        />
        <span class="text-capitalize pt-1 ml-1">
          {{ String(route.name) }}
        </span>
      </component>
    </div>
    <!-- Routes that are in groups come next. They'll be in order based on the first member of each
    group in the routes arrray. -->
    <pep-pharos-dropdown-menu-nav-link
      v-for="(group, name) in menuHeaders"
      :key="`group_${name}`"
      :data-dropdown-menu-id="`${name}_menu`"
      data-dropdown-menu-hover=""
      flex
      href
      @click.prevent.stop
    >
      <span class="text-capitalize pt-1">{{ name }}</span>
    </pep-pharos-dropdown-menu-nav-link>
    <component
      :is="sidenav ? 'pep-pharos-sidenav-menu' : 'pep-pharos-dropdown-menu'"
      v-for="(route_groups, name) in groupedRoutes"
      :id="`${String(name)}_menu`"
      :key="`group_menu_${String(name)}`"
      :label="capitalize(String(name))"
      :a11y-label="capitalize(String(name))"
    >
      <!-- Each group will have one or more members, which will appear in the dropdown -->
      <component
        :is="sidenav ? 'pep-pharos-sidenav-link' : 'pep-pharos-dropdown-menu-item'"
        v-for="route_group in route_groups"
        :key="`group_${String(route_group.name)}`"
        href
        @click.prevent.stop="
          changeRoute(router, emit, route_group.path, searchTerms, pageNo, undefined, undefined)
        "
      >
        <component :is="sidenav ? 'span' : 'pep-pharos-dropdown-menu-nav-link'" subtle>
          <span class="text-capitalize">
            {{ String(route_group.name) }}
          </span>
        </component>
      </component>
    </component>
  </component>
</template>
