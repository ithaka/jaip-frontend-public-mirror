<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { useRouter, type RouteRecordNormalized } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { formatRouteName, changeRoute, capitalize, getOrganizedRoutes } from '@/utils/helpers'
import { useLogger } from '@/composables/logging/useLogger'

const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const organizedRoutes = getOrganizedRoutes(router)

const screenWidth = ref(0)
const isMediumScreen = ref(false)

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth
  isMediumScreen.value = screenWidth.value >= 750 && screenWidth.value <= 950
}

const emit = defineEmits(['close'])

onBeforeMount(() => {
  screenWidth.value = window.innerWidth
  window.addEventListener('resize', updateScreenWidth)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScreenWidth)
})

const handleRouteName = (route: RouteRecordNormalized) => {
  // If the route has the name 'reentry guides', adjust based on screen width
  if (route.name && route.name === 'reentry guides' && isMediumScreen.value) {
    return 'Reentry'
  }
  return formatRouteName(route)
}

const { handleWithLog, logs } = useLogger()
const { changeRouteLog } = logs.getHeaderLogs()
</script>

<template>
  <pep-pharos-dropdown-menu-nav a11y-label="Main Navigation">
    <!-- Ungrouped routes (like home) come first -->
    <pep-pharos-dropdown-menu-nav-link
      v-for="route in organizedRoutes.ungrouped"
      :key="`route_${route.name as string}`"
      :data-cy="`nav-link-${route.name as string}`"
      class="nav-menu-item"
      flex
      bold
      href
      @click.prevent.stop="
        handleWithLog(changeRouteLog(route.path), () =>
          changeRoute(router, emit, route.path, searchTerms, pageNo, undefined, undefined),
        )
      "
    >
      {{ handleRouteName(route) }}
      <pep-pharos-pill
        v-if="route.meta.showAsNew && !isMediumScreen"
        size="small"
        preset="7"
        class="nav-link-pill"
      >
        NEW
      </pep-pharos-pill>
    </pep-pharos-dropdown-menu-nav-link>

    <!-- Grouped routes come next organized under category name -->
    <div v-for="(routes, group) in organizedRoutes.grouped" :key="group">
      <pep-pharos-dropdown-menu-nav-category
        :id="`${capitalize(String(group))}-category`"
        :data-cy="`nav-link-${String(group).toLowerCase()}`"
        :data-dropdown-menu-id="`${capitalize(String(group))}-menu`"
        class="nav-menu-item"
        data-dropdown-menu-hover=""
      >
        <span slot="category">{{ capitalize(String(group)) }}</span>
      </pep-pharos-dropdown-menu-nav-category>
      <pep-pharos-dropdown-menu
        :id="`${capitalize(String(group))}-menu`"
        :a11y-label="capitalize(String(group))"
        data-dropdown-menu-hover=""
      >
        <pep-pharos-dropdown-menu-item
          v-for="route in routes"
          :key="route.path"
          :data-cy="`nav-link-${route.name as string}`"
          class="nav-menu-item"
          href
          @click.prevent.stop="
            handleWithLog(changeRouteLog(route.path), () =>
              changeRoute(router, emit, route.path, searchTerms, pageNo, undefined, undefined),
            )
          "
        >
          {{ formatRouteName(route) }}
        </pep-pharos-dropdown-menu-item>
      </pep-pharos-dropdown-menu>
    </div>
  </pep-pharos-dropdown-menu-nav>
</template>

<style scoped lang="scss">
.nav-link-pill {
  margin-left: 0.5rem;
}
.nav-link-item {
  &--conditional {
    @media (min-width: 750px) and (max-width: 950px) {
      display: none;
    }
  }
}
</style>
