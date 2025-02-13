<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SearchResult from '@/components/results/SearchResult.vue'
import { makeGrammaticalList, changeRoute } from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'

import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { Discipline } from '@/interfaces/Discipline'
import type { Journal } from '@/interfaces/Journal'
import type { AxiosResponse } from 'axios'
import type { Group, GroupSelection } from '@/interfaces/Group'

const props = defineProps({
  requestsPage: {
    type: Boolean,
    default: false
  }
})

const userStore = useUserStore()
const { groupMap, featureDetails, selectedGroups, isAuthenticatedAdmin } = storeToRefs(userStore)

const searchStore = useSearchStore()
const {
  searchResults,
  searchTotal,
  sort,
  limit,
  pageNo,
  pubYearStart,
  pubYearEnd,
  searchTerms,
  secondarySearchResults,
  secondarySearchTotal,
  secondarySearching,
  secondaryLimit,
  secondaryPageNo,
  selectedDisciplines,
  disciplineList,
  selectedJournals,
  selectedJournalIDs,
  statusStartDate,
  statusEndDate,
  lastSearchTerms,
  reviewStatus,
  selectedContentTypes,
  pseudoDisciplines
} = storeToRefs(searchStore)

const coreStore = useCoreStore()
const { reqs } = storeToRefs(coreStore)

const getResultsCountLabel = (count: number) => {
  if (count === 0) {
    return 'No results'
  }
  if (count === 1) {
    return '1 result'
  }
  return `${count.toLocaleString()} results`
}

const showRequestsModal = ref(false)
const requestsUpdateKey = ref(0)
const openRequestsModal = () => {
  requestsUpdateKey.value++
  showRequestsModal.value = true
}

const sortOptions = computed(() => {
  const options = [
    {
      label: 'Newest',
      value: 'new'
    },
    {
      label: 'Oldest',
      value: 'old'
    }
  ]
  if (!props.requestsPage && searchTerms.value) {
    options.unshift({
      label: 'Relevance',
      value: 'rel'
    })
  }
  return options
})

const handleSortOrder = (val: string) => {
  sort.value = val
  searchStore.doSearch(reviewStatus.value, false)
}

const studentNotes = ref('')
const maxNoteLength = 3000
const invalidNotes = computed(() => studentNotes.value.length > maxNoteLength)
const submitRequests = async () => {
  if (invalidNotes.value || !reqs.value.length) {
    return
  }
  const args = {
    comments: studentNotes.value,
    dois: reqs.value.map((req: string) => JSON.parse(req)['_id']) as MediaRecord[]
  }

  try {
    await coreStore.$api.approvals.request(args)
    coreStore.saveReqs([])
    const msg =
      args.dois.length > 1 ? `Your requests have been submitted` : `Your request has been submitted`
    await searchStore.doSearch('', false)
    coreStore.toast(msg, 'success')
  } catch {
    const msg = `There was a server error and your ${args.dois.length ? 'requests were' : 'request was'} not submitted.`
    coreStore.toast(`Oops! ${msg}`, 'error')
  }
}

const statusQuery = computed(() => {
  const params = new URLSearchParams(location.search || '')
  return params.get('statusq') || undefined
})

const router = useRouter()
const changePage = (page: number) => {
  changeRoute(
    router,
    emit,
    router.currentRoute.value.path || '/search',
    searchTerms.value,
    page,
    props.requestsPage ? selectedGroups.value['status_search'] : undefined,
    statusQuery.value
  )
  if (resultsArea.value) {
    resultsArea!.value?.scrollIntoView({ behavior: 'smooth' })
  }
}
const changeSecondaryPage = (page: number) => {
  secondaryPageNo.value = page
  searchStore.doSearch('denied', true)
}

// Request approval
const currentUnapprovedRequests = computed(() => {
  const searchStatus = 'approved'
  return searchResults.value.filter((result: MediaRecord) => {
    return featureDetails.value['approve_requests'].groups.some((group: number) => {
      return ((result.mediaReviewStatuses[group] || {}).status || '').toLowerCase() !== searchStatus
    })
  })
})

const selectorApproveGroupOptions = ref(
  (featureDetails.value['approve_requests'] || {}).groups.reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[])
)
const selectorApproveGroupOptionIDs = computed(() => {
  return selectorApproveGroupOptions.value.map((group: Group) => group.id)
})

const selectorBulkApproveGroupOptions = ref(
  (featureDetails.value['bulk_approve'] || {}).groups.reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[])
)
const selectorBulkApproveGroupOptionIDs = computed(() => {
  return selectorBulkApproveGroupOptions.value.map((group: Group) => group.id)
})
selectedGroups.value['bulk_approve'] = selectorBulkApproveGroupOptionIDs.value

const showApproveRequestsButton = computed(() => {
  return (
    props.requestsPage &&
    !!searchTotal.value &&
    !!selectorApproveGroupOptions.value.length &&
    !!currentUnapprovedRequests.value.length
  )
})

const approveRequestsUpdateKey = ref(0)
const showApproveRequestsModal = ref(false)
const openApproveRequestsModal = () => {
  approveRequestsUpdateKey.value++
  statusStartDate.value = new Date('2022-01-01')
  statusEndDate.value = new Date(new Date().setUTCHours(23, 59, 59, 999))
  searchStore.doSearch('denied', true)
  showApproveRequestsModal.value = true
}
const closeApproveRequestsModal = () => {
  showApproveRequestsModal.value = false
  approveRequestsUpdateKey.value++
}

selectedGroups.value['approve_requests'] = selectorApproveGroupOptionIDs.value

const handleGroupSelection = (event: GroupSelection, action: string) => {
  // const hasGroup = selectedGroups.value['approve_requests'].includes(event.target)
  // const hasAny = event.groups.length
  selectedGroups.value[action] = event.groups
}

const currentDeniedRequests = computed(() => {
  const searchStatus = 'denied'
  return searchResults.value.filter((result: MediaRecord) => {
    return selectorApproveGroupOptionIDs.value.some((group: number) => {
      return ((result.mediaReviewStatuses[group] || {}).status || '').toLowerCase() === searchStatus
    })
  })
})

const requestApprovalReversals = ref([] as string[])
const handleRequestApprovalReversals = (e: InputFileEvent) => {
  if (!e.target.checked) {
    requestApprovalReversals.value.push(e.target.value)
  } else {
    requestApprovalReversals.value = requestApprovalReversals.value.filter(
      (id) => id !== e.target.value
    )
  }
}

const submitApproveRequests = async () => {
  const deniedRequests = currentDeniedRequests.value
    .map((denied: MediaRecord) => denied._id)
    .filter((denied: string) => !requestApprovalReversals.value.includes(denied))

  const docs = searchResults.value
    .filter((doc: MediaRecord) => {
      return !deniedRequests.includes(doc._id)
    })
    .map((doc: MediaRecord) => doc._id)

  const args = {
    groups: selectedGroups.value['approve_requests'],
    journals: [],
    disciplines: [],
    documents: docs
  }
  try {
    await coreStore.$api.approvals.bulk(args)
    const msg = 'Your approval has been submitted.'
    coreStore.toast(msg, 'success')
  } catch (err) {
    const msg = 'There was an error and your denial was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeApproveRequestsModal()
  }
  searchStore.doSearch(reviewStatus.value, false)
}

const emit = defineEmits(['close'])
const resultsArea = ref<HTMLInputElement | null>(null)
const hasOriginalDates = ref(
  pubYearStart.value === 1665 && pubYearEnd.value === new Date().getFullYear()
)
const showApproveAllButton = computed(() => {
  return (
    isAuthenticatedAdmin.value &&
    featureDetails.value['bulk_approve'].groups.length &&
    searchTotal.value > 0 &&
    hasOriginalDates.value &&
    !lastSearchTerms.value &&
    !props.requestsPage &&
    !selectedContentTypes.value.filter((type: string) => !pseudoDisciplines.value.includes(type))
      .length
  )
})

const approveAllUpdateKey = ref(0)
const showApproveAllModal = ref(false)
const openApproveAllModal = () => {
  statusStartDate.value = new Date('2022-01-01')
  statusEndDate.value = new Date(new Date().setUTCHours(23, 59, 59, 999))
  if (!(selectedGroups.value['status_search'] || []).length) {
    selectedGroups.value['status_search'] = featureDetails.value['bulk_approve'].groups
  }

  searchStore.doSearch('denied', true)

  approveAllUpdateKey.value++
  showApproveAllModal.value = true
}
const closeApproveAllModal = () => {
  showApproveAllModal.value = false
  approveAllUpdateKey.value++
}
const submitApproveAll = async () => {
  const disciplines = selectedDisciplines.value.length
    ? selectedDisciplines.value
    : selectedJournalIDs.value.length
      ? []
      : disciplineList.value.map((disc: Discipline) => disc.code)
  const args = {
    groups: selectedGroups.value['bulk_approve'],
    journals: selectedJournalIDs.value,
    disciplines: disciplines,
    documents: bulkApproveReversals.value
  }
  try {
    await coreStore.$api.approvals.bulk(args)
    const msg = 'Your approval has been submitted.'
    coreStore.toast(msg, 'success')
  } catch (err) {
    const msg = 'There was an error and your denial was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeApproveAllModal()
  }

  const resp: AxiosResponse = await coreStore.$api.disciplines()
  disciplineList.value = resp.data
  searchStore.doSearch('', false)
}
const bulkApproveReversals = ref([] as string[])
const handleBulkApproveReversals = (e: InputFileEvent) => {
  if (!e.target.checked) {
    bulkApproveReversals.value.push(e.target.value)
  } else {
    bulkApproveReversals.value = bulkApproveReversals.value.filter((id) => id !== e.target.value)
  }
}

const journalFilterDescription = computed(() => {
  if (selectedJournals.value.length > 3) {
    return `${selectedJournals.value.length} journals`
  } else if (selectedJournals.value.length === 0) {
    return 'all journals'
  } else {
    return makeGrammaticalList(selectedJournals.value.map((j: Journal) => j.head_title.title))
  }
})
const disciplineFilterDescription = computed(() => {
  if (
    selectedDisciplines.value.length === disciplineList.value.length ||
    selectedDisciplines.value.length === 0
  )
    return 'all subjects'
  const discLabel = selectedDisciplines.value.map(
    (disc: string) =>
      (disciplineList.value.find((d: Discipline) => d.code === disc) || {}).label || ''
  )
  return makeGrammaticalList(discLabel)
})

const pageLimit = ref(props.requestsPage ? secondaryLimit.value : limit.value)
</script>
<template>
  <div id="results" ref="resultsArea" class="search-results-area">
    <div class="my-5 py-5 search-results" :class="{ 'request-results': requestsPage }">
      <div
        class="search-results-header results-list mx-0"
        :class="{ 'search-results-header-margins': !requestsPage }"
      >
        <pep-pharos-heading preset="3--bold" :level="2">
          {{ getResultsCountLabel(searchTotal) }}
        </pep-pharos-heading>
        <div v-if="reqs.length" class="justify-self-end">
          <pep-pharos-button
            id="requests-button"
            icon-left="view-list"
            data-modal-id="requests-modal"
            size="large"
            @click="openRequestsModal"
          >
            {{ reqs.length > 1 ? `Your Requests (${reqs.length} items)` : 'Your Request' }}
          </pep-pharos-button>
          <Teleport to="body">
            <pep-pharos-modal
              id="requests-modal"
              :key="requestsUpdateKey"
              :header="
                reqs.length > 1
                  ? `Your reading requests (${reqs.length} items)`
                  : 'Your reading request'
              "
              :open="showRequestsModal"
            >
              <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
              <p slot="description">Enter your information to submit your reading requests.</p>

              <div class="modal-search-results">
                <ul>
                  <!-- Search Result for Student Requests -->
                  <li v-for="(article, index) in reqs" :key="`request_${index}`" class="pt-4">
                    <SearchResult
                      :doc="JSON.parse(article)"
                      :hide-details="true"
                      button-name="Remove"
                    />
                  </li>
                </ul>
              </div>
              <pep-pharos-textarea
                :rows="4"
                :value="studentNotes"
                :invalidated="invalidNotes"
                :message="invalidNotes ? 'Please leave a shorter note.' : ''"
                placeholder="Your institution may require specific information in order to process your request. If you're uncertain, ask an administrator for more information."
                @input="studentNotes = $event.target.value"
              >
                <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                <div slot="label">
                  <p>Notes</p>
                </div>
              </pep-pharos-textarea>
              <!-- eslint-disable-next-line -->
              <pep-pharos-button slot="footer" @click.prevent.stop="submitRequests">
                Submit
              </pep-pharos-button>
            </pep-pharos-modal>
          </Teleport>
        </div>
        <div v-else-if="showApproveRequestsButton" class="justify-self-end sm-justify-self-start">
          <pep-pharos-button
            icon-left="checkmark-inverse"
            data-modal-id="approve-requests-modal"
            @click="openApproveRequestsModal"
          >
            {{
              currentUnapprovedRequests.length > 1
                ? `Approve ${currentUnapprovedRequests.length} Items`
                : 'Approve Item'
            }}
          </pep-pharos-button>
          <Teleport to="body">
            <pep-pharos-modal
              id="approve-requests-modal-modal"
              :key="approveRequestsUpdateKey"
              :header="`Approve Material`"
              :open="showApproveRequestsModal"
              @pharos-modal-closed="showApproveRequestsModal = false"
            >
              <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
              <p slot="description" class="mb-3">
                <span
                  >This will approve all pending requests for
                  {{
                    makeGrammaticalList(
                      selectorApproveGroupOptions.map((group: Group) => group.name)
                    )
                  }}.</span
                >
                <span v-if="currentDeniedRequests.length"
                  >&nbsp;Articles that were previously denied may be approved now.</span
                >
              </p>

              <GroupSelector
                :groups="selectorApproveGroupOptions"
                :feature-name="`approve_requests`"
                :start-full="true"
                multiple
                @change="handleGroupSelection($event, 'approve_requests')"
              />
              <div v-if="currentDeniedRequests.length">
                <pep-pharos-checkbox-group
                  :value="requestApprovalReversals"
                  @input="handleRequestApprovalReversals"
                >
                  <ul>
                    <!-- Search Result for Bulk Approvals -->
                    <li
                      v-for="(doc, index) in currentDeniedRequests"
                      :key="doc.iid"
                      :class="{ 'pt-6': index > 0 }"
                    >
                      <div>
                        <div class="display-flex flex-direction-row">
                          <pep-pharos-icon
                            name="exclamation-inverse"
                            class="mr-3 mb-0 fill-coral-50"
                          />
                          <SearchResult
                            :doc="doc"
                            :hide-details="true"
                            :hide-buttons="true"
                            small
                          />
                        </div>
                        <div class="ml-7 mt-4">
                          <pep-pharos-checkbox
                            :checked="requestApprovalReversals.includes(doc._id)"
                            :value="doc._id"
                          >
                            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                            <span slot="label" class="display-flex"> Approve with the set? </span>
                          </pep-pharos-checkbox>
                        </div>
                      </div>
                    </li>
                  </ul>
                </pep-pharos-checkbox-group>
              </div>

              <!-- eslint-disable-next-line -->
              <pep-pharos-button
                slot="footer"
                variant="secondary"
                @click.prevent.stop="showApproveRequestsModal = false"
              >
                Cancel
              </pep-pharos-button>
              <!-- eslint-disable-next-line -->
              <pep-pharos-button
                slot="footer"
                :disabled="!selectedGroups['approve_requests'].length"
                @click.prevent.stop="submitApproveRequests"
              >
                Submit
              </pep-pharos-button>
            </pep-pharos-modal>
          </Teleport>
        </div>
        <div v-else-if="showApproveAllButton" class="justify-self-end sm-justify-self-start">
          <pep-pharos-button
            icon-left="checkmark-inverse"
            data-modal-id="approve-all-modal"
            @click="openApproveAllModal"
          >
            Approve All
          </pep-pharos-button>
          <pep-pharos-modal
            id="approve-all-modal"
            :key="approveAllUpdateKey"
            :header="`Approve Material`"
            :open="showApproveAllModal"
            size="large"
            @pharos-modal-closed="showApproveAllModal = false"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <p slot="description" class="mb-3">
              <span
                >This will add all material in {{ disciplineFilterDescription }} from
                {{ journalFilterDescription }}.</span
              >
              <span v-if="secondarySearchTotal && secondarySearchResults.length"
                >&nbsp;This includes articles that were previously denied.</span
              >
            </p>
            <pep-pharos-loading-spinner v-if="secondarySearching" />
            <div v-else>
              <div v-if="featureDetails['bulk_approve'].groups.length > 1" class="mb-3">
                <GroupSelector
                  :groups="selectorBulkApproveGroupOptions"
                  :feature-name="`bulk_approve`"
                  :start-full="true"
                  multiple
                  @change="handleGroupSelection($event, 'bulk_approve')"
                />
              </div>
              <pep-pharos-checkbox-group
                :value="bulkApproveReversals"
                @input="handleBulkApproveReversals"
              >
                <ul>
                  <!-- Search Result for Bulk Approvals -->
                  <li
                    v-for="(doc, index) in secondarySearchResults"
                    :key="doc.iid"
                    :class="{ 'pt-6': index > 0 }"
                  >
                    <div>
                      <div class="display-flex flex-direction-row">
                        <pep-pharos-icon
                          name="exclamation-inverse"
                          class="mr-3 mb-0 fill-coral-50"
                        />
                        <SearchResult :doc="doc" :hide-details="true" :hide-buttons="true" small />
                      </div>
                      <div class="ml-7 mt-4">
                        <pep-pharos-checkbox
                          :checked="bulkApproveReversals.includes(doc._id)"
                          :value="doc._id"
                        >
                          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                          <span slot="label" class="display-flex"> Approve with the set? </span>
                        </pep-pharos-checkbox>
                      </div>
                    </div>
                  </li>
                </ul>
              </pep-pharos-checkbox-group>
              <div class="display-grid">
                <pep-pharos-pagination
                  v-if="secondarySearchTotal > secondaryLimit"
                  class="justify-self-end"
                  :total-results="secondarySearchTotal"
                  :page-size="secondaryLimit"
                  :current-page="secondaryPageNo"
                  @prev-page="changeSecondaryPage(secondaryPageNo - 1)"
                  @next-page="changeSecondaryPage(secondaryPageNo + 1)"
                />
              </div>
            </div>

            <!-- eslint-disable-next-line -->
            <pep-pharos-button
              slot="footer"
              variant="secondary"
              @click.prevent.stop="showApproveAllModal = false"
            >
              Cancel
            </pep-pharos-button>
            <!-- eslint-disable-next-line -->
            <pep-pharos-button
              slot="footer"
              :disabled="secondarySearching || !selectedGroups['bulk_approve'].length"
              @click.prevent.stop="submitApproveAll"
            >
              Submit
            </pep-pharos-button>
          </pep-pharos-modal>
        </div>
      </div>
    </div>
    <div v-if="searchTotal" :class="{ 'search-results': !requestsPage }">
      <div class="results-list display-grid">
        <div>
          <pep-pharos-button
            variant="secondary"
            icon-right="chevron-down"
            data-dropdown-menu-id="sort-by-drop"
          >
            Sort By: {{ (sortOptions.find((opt) => opt.value === sort) || {}).label }}
          </pep-pharos-button>
          <pep-pharos-dropdown-menu id="sort-by-drop" full-width>
            <pep-pharos-dropdown-menu-item
              v-for="opt in sortOptions"
              :key="opt.value"
              @click="handleSortOrder(opt.value)"
            >
              {{ opt.label }}
            </pep-pharos-dropdown-menu-item>
          </pep-pharos-dropdown-menu>
        </div>
        <ol>
          <!-- Search Result -->
          <li v-for="doc in searchResults" :key="doc.iid" class="mt-7">
            <SearchResult
              :doc="doc"
              :hide-description="!userStore.features['view_book_description']"
              :hide-abstract="!userStore.features['view_abstract']"
              :hide-snippets="!userStore.features['view_snippet']"
            />
          </li>
        </ol>
        <pep-pharos-pagination
          v-if="searchTotal > pageLimit"
          class="justify-self-end"
          :total-results="searchTotal"
          :page-size="pageLimit"
          :current-page="pageNo"
          @prev-page="changePage(pageNo - 1)"
          @next-page="changePage(pageNo + 1)"
        />
      </div>
    </div>
  </div>
</template>
