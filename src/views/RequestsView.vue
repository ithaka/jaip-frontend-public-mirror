<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useSearchStore } from '@/stores/search'
import { useCoreStore } from '@/stores/core'
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import DatePicker from '@/components/DatePicker.vue'
import SearchResults from '@/components/results/SearchResults.vue'
import { changeRoute, makeGrammaticalList, parseGroupsQueryParam } from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import { DatePickerRangeDirection } from '@/interfaces/DatePicker'
import { REQUEST_STATUSES } from '@/consts/RequestStatuses'
import { RequestStatus } from '@/interfaces/RequestStatus'
import type { Group } from '@/interfaces/Group'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const coreStore = useCoreStore()
const userStore = useUserStore()
const {
  isAuthenticatedAdmin,
  canEditFacilities,
  canManageFacilities,
  groupIDs,
  groupMap,
  selectedGroups,
  ungroupedFeatures,
  canViewRestrictedList,
} = storeToRefs(userStore)

const facilitiesWithRequestsPaused = computed(
  () =>
    userStore
      .facilitiesWithRequestsPaused()
      .filter((facility) =>
        facility.groups?.some((group) => selectedGroups.value['status_search']?.includes(group.id)),
      )
      .map((facility) => {
        return {
          name: facility.name,
          start_date: facility.request_permissions!.start_date,
          end_date: facility.request_permissions!.end_date,
        }
      })
      .filter((facility) => !!facility.name) as {
      name: string
      start_date: Date
      end_date: Date
    }[],
)

const facilitiesWithRequestsOff = computed(
  () =>
    userStore
      .facilitiesWithRequestsOff()
      .filter((facility) =>
        facility.groups?.some((group) => selectedGroups.value['status_search']?.includes(group.id)),
      )
      .map((facility) => facility.name)
      .filter((name) => !!name) as string[],
)

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

const statuses = REQUEST_STATUSES.filter(
  (status) => status.value !== RequestStatus.Restricted || canViewRestrictedList.value,
)

const handleStatusSelection = (status: RequestStatus) => {
  reviewStatus.value = status
  if (status === RequestStatus.Restricted) {
    coreStore.$api.global_restricts.last_updated.get().then((response) => {
      searchStore.restrictedListLastUpdated = response.data.last_updated
    })
  }
  newSearch()
}

const router = useRouter()
const emit = defineEmits(['close'])

const handleRequestSettings = () => {
  changeRoute(router, {
    emit,
    path: '/account/facilities',
    term: '',
    page: 1,
    includeSearchQuery: false,
  })
}

const newSearch = () => {
  changeRoute(router, {
    emit,
    path: '/requests',
    term: '',
    page: 1,
    groups: selectedGroups.value['status_search'],
    statusQuery: statusQuery.value,
    status: reviewStatus.value || undefined,
  })
  searchStore.doSearch(reviewStatus.value, false)
}

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main class="requests-view">
    <pep-pharos-layout row-gap="0">
      <pep-pharos-alert
        v-if="facilitiesWithRequestsPaused.length > 0"
        status="warning"
        class="requests-view__alert"
      >
        Requests are paused at
        {{ makeGrammaticalList(facilitiesWithRequestsPaused.map((facility) => facility.name)) }}.
        Users aren’t able to make new requests.
        <pep-pharos-link
          v-if="canEditFacilities || canManageFacilities"
          href="/account/facilities"
          @click.prevent="handleRequestSettings"
        >
          Requests settings
        </pep-pharos-link>
      </pep-pharos-alert>
      <pep-pharos-alert
        v-if="facilitiesWithRequestsOff.length > 0"
        status="warning"
        class="requests-view__alert"
      >
        Requests are turned off at {{ makeGrammaticalList(facilitiesWithRequestsOff) }}. Users are
        unable to make new requests.
        <pep-pharos-link
          v-if="canEditFacilities || canManageFacilities"
          href="/account/facilities"
          @click.prevent="handleRequestSettings"
        >
          Requests settings
        </pep-pharos-link>
      </pep-pharos-alert>
      <header class="requests-view__header">
        <pep-pharos-heading no-margin class="requests-view__title" :level="1" preset="5--bold">
          <span v-if="reviewStatus === 'restricted'">{{ reviewStatus }} Items</span>
          <span v-else>{{ reviewStatus }} Requests</span>
        </pep-pharos-heading>
      </header>
      <div
        v-if="ungroupedFeatures['manage_restricted_list']?.enabled && reviewStatus === 'restricted'"
        class="requests-view__notice"
      >
        <pep-pharos-alert status="info">
          Users at participating facilities are unable to request these items. Administrators can
          opt-in from their account.
          <strong>Management of this list is for internal ITHAKA use only.</strong>
        </pep-pharos-alert>
      </div>
      <div v-if="isAuthenticatedAdmin && groupIDs.length > 1" class="requests-view__groups">
        <GroupSelector
          :groups="sortedFullGroups"
          :feature-name="`status_search`"
          :start-full="sortedFullGroups.length < 4"
          multiple
          is-status-search
          @change="newSearch"
        />
      </div>

      <div class="requests-view__date-filter">
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
      <div class="requests-view__status-filter">
        <pep-pharos-heading class="requests-view__filter-label" preset="legend" :level="2">
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
      <div class="requests-view__search">
        <form @submit.prevent.stop="newSearch">
          <pep-pharos-input-group
            v-if="isAuthenticatedAdmin"
            id="request_query"
            placeholder="Enter a term to search statuses and user comments"
            name="request_query"
            class="requests-view__search-input"
            :value="statusQuery"
            @input="updateStatusQuery($event.target.value)"
          >
            <span slot="label" class="requests-view__search-label">
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
      <div class="requests-view__results">
        <SearchResults requests-page />
      </div>
    </pep-pharos-layout>
  </main>
</template>

<style scoped lang="scss">
$pharos-breakpoint-medium: 48rem; // 768px

.requests-view {
  &__alert,
  &__header,
  &__groups,
  &__search,
  &__results {
    grid-column: 1 / -1;
    min-width: 0;
  }

  &__alert {
    margin-bottom: var(--pharos-spacing-1-x);
  }

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--pharos-spacing-one-half-x) var(--pharos-spacing-1-x);
    margin-bottom: var(--pharos-spacing-1-x);
    &--link {
      align-self: center;
    }
  }

  &__title {
    text-transform: capitalize;
    margin-bottom: 0;
  }

  &__notice {
    grid-column: span 7;
  }

  &__groups {
    margin-block: var(--pharos-spacing-one-half-x);
  }

  &__date-filter,
  &__status-filter {
    grid-column: span 6;
    min-width: 0;
  }

  &__filter-label {
    margin-bottom: var(--pharos-spacing-one-quarter-x);
    padding-bottom: 0;
  }

  &__search-input {
    margin-top: var(--pharos-spacing-three-quarters-x);
  }

  &__search-label {
    display: flex;
    align-items: center;
  }

  @media screen and (max-width: $pharos-breakpoint-medium) {
    &__notice,
    &__date-filter,
    &__status-filter {
      grid-column: 1 / -1;
    }
  }
}
</style>
