<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useSearchStore } from '@/stores/search'
import { useCoreStore } from '@/stores/core'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import DatePicker from '@/components/DatePicker.vue'
import SearchResults from '@/components/results/SearchResults.vue'
import { changeRoute, parseGroupsQueryParam } from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import { DatePickerRangeDirection } from '@/interfaces/DatePicker'
import type { Group } from '@/interfaces/Group'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const coreStore = useCoreStore()
const userStore = useUserStore()
const {
  isAuthenticatedAdmin,
  groupIDs,
  groupMap,
  selectedGroups,
  ungroupedFeatures,
  canViewRestrictedList,
} = storeToRefs(userStore)

const searchStore = useSearchStore()
const { reviewStatus, statusStartDate, statusEndDate, statusQuery } = storeToRefs(searchStore)

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
  statusGroups.value = parseGroupsQueryParam(initialGroups)
}
selectedGroups.value['status_search'] = statusGroups.value

statusQuery.value = params.get('statusq') || ''

const updateStatusQuery = (val: string) => {
  statusQuery.value = val
}

const handleDateSelection = (dates: Array<Date>) => {
  statusStartDate.value = new Date(dates[0]!.setHours(0, 0, 0, 0))
  statusEndDate.value = new Date((dates[1] || dates[0])!.setHours(23, 59, 59, 999))
  newSearch()
}
const dates = computed(() => {
  return [statusStartDate.value, statusEndDate.value]
})

const statuses = [
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Denied', value: 'denied' },
  { label: 'Approved', value: 'approved' },
]

if (canViewRestrictedList.value) {
  statuses.push({ label: 'Restricted', value: 'restricted' })
}

const handleStatusSelection = (status: string) => {
  reviewStatus.value = status
  if (status === 'restricted') {
    coreStore.$api.global_restricts.last_updated.get().then((response) => {
      searchStore.restrictedListLastUpdated = response.data.last_updated
    })
  }
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

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main>
    <pep-pharos-layout row-gap="0">
      <pep-pharos-heading class="text-capitalize cols-12" :level="1" preset="5--bold">
        <span v-if="reviewStatus === 'restricted'">{{ reviewStatus }} Items</span>
        <span v-else>{{ reviewStatus }} Requests</span>
      </pep-pharos-heading>
      <div
        v-if="ungroupedFeatures['manage_restricted_list']?.enabled && reviewStatus === 'restricted'"
        class="cols-7"
      >
        <pep-pharos-alert status="info">
          Users at participating facilities are unable to request these items. Administrators can
          opt-in from their account.
          <strong>Management of this list is for internal ITHAKA use only.</strong>
        </pep-pharos-alert>
      </div>
      <div
        v-if="isAuthenticatedAdmin && groupIDs.length > 1"
        class="cols-12 mb-3 mt-3 groups-selection"
      >
        <GroupSelector
          :groups="sortedFullGroups"
          :feature-name="`status_search`"
          :start-full="sortedFullGroups.length < 4"
          multiple
          is-status-search
          @change="newSearch"
        />
      </div>

      <div class="cols-md-8 cols-6">
        <DatePicker
          :initial-dates="dates"
          label="Status Date"
          :range-direction="DatePickerRangeDirection.Past"
          trigger-id="datepicker-button"
          time-zone="UTC"
          :max-date="new Date()"
          @selected-dates="handleDateSelection"
        />
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
            placeholder="Enter a term to search statuses and user comments"
            name="request_query"
            class="mt-4"
            :value="statusQuery"
            @input="updateStatusQuery($event.target.value)"
          >
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
      <div class="cols-12">
        <SearchResults requests-page />
      </div>
    </pep-pharos-layout>
  </main>
</template>
