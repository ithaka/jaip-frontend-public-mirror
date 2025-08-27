<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { formatRouteName, changeRoute, capitalize, getOrganizedRoutes } from '@/utils/helpers'

const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const organizedRoutes = getOrganizedRoutes(router)

const emit = defineEmits(['close'])
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
        changeRoute(router, emit, route.path, searchTerms, pageNo, undefined, undefined)
      "
    >
      {{ formatRouteName(route) }}
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
            changeRoute(router, emit, route.path, searchTerms, pageNo, undefined, undefined)
          "
        >
          {{ formatRouteName(route) }}
        </pep-pharos-dropdown-menu-item>
      </pep-pharos-dropdown-menu>
    </div>
  </pep-pharos-dropdown-menu-nav>
</template>
