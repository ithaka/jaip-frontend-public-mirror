<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useSearchStore } from '@/stores/search'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import SearchResults from '@/components/results/SearchResults.vue'
import { changeRoute } from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import type { Group } from '@/interfaces/Group'

const userStore = useUserStore()
const { isAuthenticatedAdmin, groupIDs, groupMap, selectedGroups } = storeToRefs(userStore)

const searchStore = useSearchStore()
const { reviewStatus, statusStartDate, statusEndDate, statusQuery } = storeToRefs(searchStore)

const presetRanges = ref([
  { label: 'Today', value: [new Date(), new Date()] },
  {
    label: 'Last 30 Days',
    value: [new Date().setDate(new Date().getDate() - 30), new Date()],
  },
  {
    label: 'Last 60 Days',
    value: [new Date().setDate(new Date().getDate() - 60), new Date()],
  },
  {
    label: 'Last 90 Days',
    value: [new Date().setDate(new Date().getDate() - 90), new Date()],
  },
  {
    label: 'All',
    value: [Date.parse('01 Jan 2022 00:00:00 GMT'), new Date()],
  },
])

const statusGroups = ref(groupIDs.value)
const sortedFullGroups = groupIDs.value.reduce((arr, id: number) => {
  const group = groupMap.value.get(id)
  if (group) {
    arr.push(group)
  }
  return arr
}, [] as Group[])
const params = new URLSearchParams(location.search || '')
const initialGroups = params.get('groups')
if (initialGroups) {
  statusGroups.value = JSON.parse(initialGroups)
}
selectedGroups.value['status_search'] = statusGroups.value

statusQuery.value = params.get('statusq') || ''

const updateStatusQuery = (val: string) => {
  statusQuery.value = val
}

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
}
const handleDateSelection = (dates: Array<Date>) => {
  statusStartDate.value = new Date(dates[0].setHours(0, 0, 0, 0))
  statusEndDate.value = new Date((dates[1] || dates[0]).setHours(23, 59, 59, 999))
  newSearch()
}
const dates = computed(() => {
  return [statusStartDate.value, statusEndDate.value]
})
const displayDates = computed(() => {
  const displayDates = [
    statusStartDate.value.toLocaleString('en', dateOptions),
    statusEndDate.value.toLocaleString('en', dateOptions),
  ]
  if (displayDates[0] === displayDates[1]) {
    return String(displayDates[0])
  }
  return `${displayDates[0]} - ${displayDates[1]}`
})

const statuses = [
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Denied', value: 'denied' },
  { label: 'Approved', value: 'approved' },
]
const handleStatusSelection = (status: string) => {
  reviewStatus.value = status
  newSearch()
}

const router = useRouter()
const emit = defineEmits(['close'])

const newSearch = () => {
  changeRoute(
    router,
    emit,
    '/requests',
    '',
    1,
    selectedGroups.value['status_search'],
    statusQuery.value,
  )
  searchStore.doSearch(reviewStatus.value, false)
}
</script>

<template>
  <main class="page">
    <pep-pharos-layout row-gap="0">
      <pep-pharos-heading class="text-capitalize cols-12" :level="1" preset="5--bold">
        {{ reviewStatus }} Requests
      </pep-pharos-heading>

      <div
        v-if="isAuthenticatedAdmin && groupIDs.length > 1"
        class="cols-12 mb-3 mt-3 groups-selection"
      >
        <GroupSelector
          :groups="sortedFullGroups"
          :feature-name="`status_search`"
          :start-full="true"
          multiple
          is-status-search
          @change="newSearch"
        />
      </div>

      <div class="cols-md-8 cols-6">
        <VueDatePicker
          :value="dates"
          :enable-time-picker="false"
          range
          :text-input="true"
          :max-date="new Date()"
          :preset-dates="presetRanges"
          @update:model-value="handleDateSelection"
        >
          <template #trigger>
            <pep-pharos-heading class="mb-2 pb-0" preset="legend" :level="2">
              Status Date
            </pep-pharos-heading>
            <pep-pharos-button
              id="datepicker-button"
              variant="secondary"
              full-width
              icon-left="calendar"
            >
              {{ displayDates }}
            </pep-pharos-button>
          </template>
          <template #action-row="{ internalModelValue, selectDate, disabled, closePicker }">
            <div class="action-row justify-self-end">
              <div class="">
                <pep-pharos-button variant="secondary" class="mr-2" @click="closePicker">
                  Cancel
                </pep-pharos-button>
                <pep-pharos-button
                  :disabled="disabled || (internalModelValue || []).length < 1"
                  @click="selectDate"
                >
                  Select
                </pep-pharos-button>
              </div>
            </div>
          </template>
        </VueDatePicker>
      </div>
      <div class="cols-md-8 cols-6 md-ml-0 ml-13" style="width: 100%">
        <pep-pharos-heading class="mb-2 pb-0" preset="legend" :level="2">
          Status
        </pep-pharos-heading>
        <div>
          <pep-pharos-button
            variant="secondary"
            icon-right="chevron-down"
            data-dropdown-menu-id="status-drop"
            full-width
          >
            Status: {{ (statuses.find((opt) => opt.value === reviewStatus) || {}).label }}
          </pep-pharos-button>
          <pep-pharos-dropdown-menu id="status-drop" full-width>
            <pep-pharos-dropdown-menu-item
              v-for="status in statuses"
              :key="status.value"
              @click="handleStatusSelection(status.value)"
            >
              {{ status.label }}
            </pep-pharos-dropdown-menu-item>
          </pep-pharos-dropdown-menu>
        </div>
      </div>
      <div class="cols-12">
        <form @submit.prevent.stop="newSearch">
          <pep-pharos-input-group
            v-if="isAuthenticatedAdmin"
            id="request_query"
            placeholder="Greendale"
            name="request_query"
            class="mt-4"
            :value="statusQuery"
            @input="updateStatusQuery($event.target.value)"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <span slot="label" class="display-flex align-items-center">
              <span>Search</span>
            </span>
            <pep-pharos-button
              name="search-button"
              icon="search"
              variant="subtle"
              label="search"
              a11y-label="Search"
              type="submit"
            />
          </pep-pharos-input-group>
        </form>
      </div>
      <div class="mb-12 cols-12">
        <SearchResults requests-page />
      </div>
    </pep-pharos-layout>
  </main>
</template>

<style>
.dp__action_row {
  justify-content: end;
}
</style>
