<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { type EntityOption, type EntityObject, EntityTypes } from '@/interfaces/AccountManagement'
import EntitySearch from '@/components/account/EntitySearch.vue'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const route = useRoute()
const tab = ref(route.params?.tab || 'users')

const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)

/**
 * The list of all possible entity options, including their associated features, titles, types, and icons.
 */
const entityOptions = ref([
  {
    feature: 'get_users',
    title: 'Users',
    titleSingular: 'User',
    type: 'users',
    icon: 'profile',
  },
  {
    feature: 'get_facilities',
    title: 'Facilities',
    titleSingular: 'Facility',
    type: 'facilities',
    icon: 'workspace',
  },
] as EntityOption[])

/**
 * Computes the list of available entity options based on the user's feature details.
 *
 * @returns {EntityOption[]} The list of available entity options based on the user's feature details.
 */
const availableEntities = computed(() => {
  return entityOptions.value.filter((entity: EntityOption) => {
    return (featureDetails.value[entity.feature] || {}).enabled
  }) as EntityOption[]
})

/**
 * Computes an object mapping entity types to their corresponding entity options.
 *
 * @returns {EntityObject} An object mapping entity types to their corresponding entity options.
 */
const entityObject = computed(() => {
  return entityOptions.value.reduce((obj, entity: EntityOption) => {
    obj[entity.type] = entity
    return obj
  }, {} as EntityObject) as EntityObject
})

/**
 * Determines the starting entity tab based on the current route and available features.
 *
 * @returns {EntityTypes} The starting entity tab based on the current route and available features.
 */
const startingEntity = computed(() => {
  const hasUsersFeature = featureDetails.value['get_users']?.enabled
  const hasFacilitiesFeature = featureDetails.value['get_facilities']?.enabled
  if (tab.value === 'users' && hasUsersFeature) {
    return EntityTypes.Users
  }
  if (tab.value === 'facilities' && hasFacilitiesFeature) {
    return EntityTypes.Facilities
  }
  return availableEntities.value[0]?.type || EntityTypes.Users
})

const visibleEntity: Ref<EntityTypes> = ref(startingEntity.value)

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main class="page">
    <pep-pharos-layout row-gap="0" preset="1-col">
      <pep-pharos-heading class="text-capitalize cols-8" :level="1" preset="5--bold">
        Account Management
      </pep-pharos-heading>
    </pep-pharos-layout>
    <pep-pharos-layout row-gap="0">
      <div class="cols-12">
        <pep-pharos-toggle-button-group
          v-if="availableEntities.length > 1"
          group-label="Account Options"
          class="pt-4 pb-5"
        >
          <pep-pharos-toggle-button
            v-for="entity in availableEntities"
            :id="`${entity.type}-button`"
            :key="`${entity.type}-button`"
            :icon-left="entity.icon"
            :selected="visibleEntity === entity.type"
            @click.prevent.stop="visibleEntity = entity.type"
          >
            {{ entity.title }}
          </pep-pharos-toggle-button>
        </pep-pharos-toggle-button-group>
      </div>
    </pep-pharos-layout>
    <div>
      <!-- We can safely assume that the entity object matching visibleEntity will exist because the value of visibleEntity can only
          be one of the available entity types -->
      <EntitySearch :key="`${visibleEntity}_search`" :entity="entityObject[visibleEntity]!" />
    </div>
  </main>
</template>

<style></style>
