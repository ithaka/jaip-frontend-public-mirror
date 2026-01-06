<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/stores/search'
import { formatRouteName, changeRoute, capitalize, getOrganizedRoutes } from '@/utils/helpers'

import type { RouteRecordRaw } from 'vue-router'
import { useLogger } from '@/composables/logging/useLogger'

const emit = defineEmits(['close-sidenav', 'close'])

const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const organizedRoutes = getOrganizedRoutes(router)

/**
 * Closes the sidenav and changes the route.
 *
 * @param {RouteRecordRaw} route - Route type from vue-router
 * @returns {void}
 */
const changeRouteHandler = (route: RouteRecordRaw) => {
  changeRoute(router, emit, route.path, searchTerms.value, pageNo.value, undefined, undefined)
  emit('close-sidenav')
}
const { handleWithLog, logs } = useLogger()
const { changeRouteLog } = logs.getHeaderLogs()
</script>

<template>
  <pep-pharos-sidenav-section showDivider="true">
    <pep-pharos-sidenav-link
      v-for="route in organizedRoutes.ungrouped"
      :key="`route_${formatRouteName(route)}`"
      href="#"
      @click.prevent.stop="
        handleWithLog(changeRouteLog(route.path), () => changeRouteHandler(route))
      "
    >
      <!-- Include any icon specified in the meta.icon property-->
      <pep-pharos-icon
        v-if="route.meta.icon"
        :name="route.meta.icon"
        :a11y-title="route.meta.label || route.name"
        class="mr-1"
      />
      <!-- Include new pill for showAsNew meta-->
      <span v-if="route.meta.showAsNew">
        {{ formatRouteName(route) }}
        <pep-pharos-pill v-if="route.meta.showAsNew" size="small" preset="2" class="sidenav-pill">
          NEW</pep-pharos-pill
        >
      </span>
      <span v-else>
        {{ formatRouteName(route) }}
      </span>
    </pep-pharos-sidenav-link>

    <div v-for="(routes, group) in organizedRoutes.grouped" :key="group">
      <pep-pharos-sidenav-menu :label="capitalize(group as string)">
        <pep-pharos-sidenav-link
          v-for="route in routes"
          :key="route.path"
          href
          @click.prevent.stop="
            handleWithLog(changeRouteLog(route.path), () => changeRouteHandler(route))
          "
        >
          {{ formatRouteName(route) }}
        </pep-pharos-sidenav-link>
      </pep-pharos-sidenav-menu>
    </div>
  </pep-pharos-sidenav-section>
</template>
<style lang="scss" scoped>
.sidenav-pill {
  margin-left: var(--pharos-spacing-one-half-x);
}
</style>
