<script setup lang="ts">
import { useRouter } from 'vue-router'
import { capitalize, changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import type { RoutesObject } from '@/interfaces/Routes'
defineProps({
  loginUrl: {
    type: String,
    default: '',
  },
  showLogin: {
    type: Boolean,
    default: false,
  },
  sidenav: {
    type: Boolean,
    default: false,
  },
})

const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const getRoutesObject = (): RoutesObject => {
  // This will group routes based on the meta.group property,
  // leaving ungrouped routes in a separate category
  const routes = router.getRoutes()
  return routes.reduce(
    (obj: RoutesObject, route) => {
      if (route.meta!.group) {
        if (!obj.grouped[route.meta!.group]) {
          obj.grouped[route.meta!.group] = []
        }
        obj.grouped[route.meta!.group].push(route)
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
const r = getRoutesObject()
const ungroupedRoutes = r.ungrouped
const groupedRoutes = r.grouped
const emit = defineEmits(['close'])
</script>

<template>
  <div>
    <div>
      <!-- Start with an routes that don't have a dropdown (possibly just "Home") 
      Grouping routes keeps the header narrow, which means we don't need an drawer
      until things get relatively narrow. -->
      <pep-pharos-sidenav-link
        v-for="route in ungroupedRoutes"
        :key="`route_${String(route.name)}`"
        bold
        href
        flex
        @click.prevent.stop="
          changeRoute(router, emit, route.path, searchTerms, pageNo, undefined, undefined)
        "
      >
        <span class="text-weight-regular text-capitalize pt-1 ml-1">
          {{ String(route.name) }}
        </span>
      </pep-pharos-sidenav-link>
    </div>
    <!-- It's not really necessary to cast name as a string (it is a string, it's the key of the groupedRoutes object),
    but TypeScript is confused about that and thinks it's an index number. -->
    <pep-pharos-sidenav-menu
      v-for="(route_groups, name) in groupedRoutes"
      :id="`${name}_menu`"
      :key="`group_menu_${name}`"
      :label="capitalize(String(name))"
      :a11y-label="capitalize(String(name))"
    >
      <div>
        <!-- Each group will have one or more members, which will appear in the dropdown -->
        <pep-pharos-sidenav-link
          v-for="(route_group, index) in route_groups"
          :key="`group_${index}`"
          href=""
          @click.prevent.stop="
            changeRoute(router, emit, route_group.path, searchTerms, pageNo, undefined, undefined)
          "
        >
          <span class="text-capitalize">
            {{ route_group.name }}
          </span>
        </pep-pharos-sidenav-link>
      </div>
    </pep-pharos-sidenav-menu>

    <!-- If the user is on the admin site and not authenticated, include the login button. -->
    <div v-if="showLogin">
      <pep-pharos-sidenav-link bold :href="loginUrl" flex>
        <span class="text-capitalize pt-1 ml-1"> Log In </span>
      </pep-pharos-sidenav-link>
    </div>
  </div>
</template>
