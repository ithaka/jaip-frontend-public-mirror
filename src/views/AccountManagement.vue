<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import GroupsManager from '@/components/groups/GroupsManager.vue'
import UsersManager from '@/components/users/UsersManager.vue'
import SubdomainManager from '@/components/subdomains/SubdomainManager.vue'
import FeatureManager from '@/components/features/FeatureManager.vue'
import type { UngroupedFeatureDetails } from '@/interfaces/Features'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const userStore = useUserStore()
const { sortedUngroupedFeatures } = storeToRefs(userStore)
const categories = ['Groups', 'Users', 'Subdomains', 'Ungrouped Features', 'Features']
const hasCategories =
  categories.filter((value) => Object.keys(sortedUngroupedFeatures.value).includes(value)).length >
  0
const filteredCategories = ref({} as { [key: string]: UngroupedFeatureDetails })
for (const key in sortedUngroupedFeatures.value) {
  if (categories.includes(key) && sortedUngroupedFeatures.value[key]) {
    filteredCategories.value[key] = sortedUngroupedFeatures.value[key]
  }
}
const filteredOrderedCategories = categories.filter((value) =>
  Object.keys(filteredCategories.value).includes(value),
)

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <div v-if="hasCategories" class="management page">
    <pep-pharos-layout row-gap="0">
      <pep-pharos-tabs class="cols-12">
        <pep-pharos-tab
          v-for="(key, index) in filteredOrderedCategories"
          :id="`group-tab-${index}`"
          :key="`group-tab-${index}`"
          :data-panel-id="`group-panel-${index}`"
        >
          <pep-pharos-heading :level="1" preset="1--bold">
            {{ key }}
          </pep-pharos-heading>
        </pep-pharos-tab>
        <pep-pharos-tab-panel
          v-for="(key, index) in filteredOrderedCategories"
          :id="`group-panel-${index}`"
          :key="`group-panel-${index}`"
          slot="panel"
        >
          <GroupsManager v-if="key === 'Groups'" />
          <UsersManager v-else-if="key === 'Users'" />
          <SubdomainManager v-else-if="key === 'Subdomains'" />
          <FeatureManager v-else-if="key === 'Ungrouped Features'" ungrouped />
          <FeatureManager v-else-if="key === 'Features'" />
        </pep-pharos-tab-panel>
      </pep-pharos-tabs>
    </pep-pharos-layout>
  </div>
  <div v-else>No management features are currently available.</div>
</template>
