<script setup lang="ts">
import { ref } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import CheckboxGroup from '@/components/truncated/CheckboxGroup.vue'
import SearchResults from '@/components/results/SearchResults.vue'

import type { Journal } from '@/interfaces/Journal'
import type { Discipline } from '@/interfaces/Discipline'
import type CheckboxEvent from '@/interfaces/Events/Checkbox'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { AxiosResponse } from 'axios'

const coreStore = useCoreStore()
const searchStore = useSearchStore()
const {
  disciplineList,
  searchTerms,
  pubYearStart,
  pubYearEnd,
  allJournals,
  disciplineObject,
  selectedDisciplines,
  selectedJournals,
  contentTypes,
  selectedContentTypes,
  pseudoDisciplines,
} = storeToRefs(searchStore)

// Get Disciplines
const api = coreStore.$api
const gettingDisciplines = ref(true)
api.disciplines().then((resp: AxiosResponse) => {
  disciplineList.value = resp.data
})
gettingDisciplines.value = false

// Additional Terms
const additionalTerms = ref('')
const router = useRouter()
const handleAdditionalTerms = () => {
  if (!additionalTerms.value) return
  if (searchTerms.value) {
    // This regex will detect strings that include substrings wrapped in parentheses joined by the word "AND"
    // so if they're present, we can simply add another
    const regex = /\([^()]+\)(?:\s+AND\s+\([^()]+\))*/
    const hasTerms = regex.test(searchTerms.value)
    if (!hasTerms) {
      searchStore.setSearchTerms(`(${searchTerms.value})`, router.currentRoute.value.path)
    }
    searchStore.setSearchTerms(
      `${searchTerms.value} AND (${additionalTerms.value})`,
      router.currentRoute.value.path,
    )
  } else {
    searchStore.setSearchTerms(additionalTerms.value, router.currentRoute.value.path)
  }
  router.push({
    path: '/search',
    query: {
      term: searchTerms.value,
      page: 1,
    },
  })
  additionalTerms.value = ''
}

// Date
const startYear = ref(pubYearStart.value)
const endYear = ref(pubYearEnd.value)
const invalidatedStartYear = ref(false)
const invalidatedEndYear = ref(false)
const dateErrorMessage = ref('')
const handleDateSelection = () => {
  const start = startYear.value
  const end = endYear.value
  const numStart = +start
  if (!numStart) {
    invalidatedStartYear.value = true
    dateErrorMessage.value = 'Enter numeric values only.'
  }
  const numEnd = +end
  if (!numEnd) {
    invalidatedEndYear.value = true
    dateErrorMessage.value = 'Enter numeric values only.'
  }
  if (!numStart || !numEnd) {
    return
  }
  if (numStart > numEnd) {
    invalidatedStartYear.value = true
    invalidatedEndYear.value = true
    dateErrorMessage.value = 'Start date must come before end date.'
    return
  }
  if (numStart < 1665) {
    invalidatedStartYear.value = true
    dateErrorMessage.value = 'Start date must be 1665 or later.'
    return
  }
  if (numEnd > new Date().getFullYear()) {
    invalidatedEndYear.value = true
    dateErrorMessage.value = 'End date cannot be in the future.'
    return
  }
  invalidatedStartYear.value = false
  invalidatedEndYear.value = false
  dateErrorMessage.value = ''
  pubYearStart.value = startYear.value
  pubYearEnd.value = endYear.value
  searchStore.doSearch('', false)
}

// Discipline Checkboxes
const gettingJournals = ref(false)
const getJournals = async (code: string) => {
  if (code && !allJournals.value[code]) {
    gettingJournals.value = true
    const { data } = await api.journals(code)
    allJournals.value[code] = {}
    ;(data || []).forEach((journal: Journal) => {
      allJournals.value[code][journal.headid] = journal
    })
    gettingJournals.value = false
  }
}
const handleDisciplineSelection = (e: CheckboxEvent) => {
  if (e.newValue) {
    selectedDisciplines.value.push(e.newValue)
    // If a user clicks a discipline, we might as well grab the journals, since they've expressed
    // some interest. But that doesn't apply to pseudodisciplines, which have no journals. In that
    // case, we instead want to add the content type.
    if (!pseudoDisciplines.value.includes(e.newValue)) {
      getJournals(e.newValue)
    } else {
      selectedContentTypes.value.push(e.newValue)
    }
  } else {
    const selectedPseudoDisciplines = e.checkboxes.filter((disc) =>
      pseudoDisciplines.value.includes(disc),
    )

    pseudoDisciplines.value.forEach((pseudoDiscipline: string) => {
      if (
        selectedDisciplines.value.includes(pseudoDiscipline) &&
        !selectedPseudoDisciplines.includes(pseudoDiscipline)
      ) {
        selectedContentTypes.value = selectedContentTypes.value.filter(
          (disc) => disc !== pseudoDiscipline,
        )
      }
    })

    selectedDisciplines.value = [...e.checkboxes]
  }
  searchStore.doSearch('', false)
}
const clearDisciplines = () => {
  selectedDisciplines.value = []
  searchStore.doSearch('', false)
}

// Journals
// Journal Disciplines
const selectedJournalDisciplines: string[] = selectedJournals.value.reduce(
  (arr: string[], journal: Journal) => {
    if (journal.discipline && !arr.includes(journal.discipline)) {
      arr.push(journal.discipline)
    }
    return arr
  },
  [] as string[],
)
const visibleJournalDisciplines = ref(selectedJournalDisciplines)
const combobox = ref(null)
const handleJournalDisciplineSelection = async (e: InputFileEvent) => {
  await getJournals(e.target.value)
  if (e.target.value) {
    visibleJournalDisciplines.value.unshift(e.target.value)
    // This is an awkward solution, but the combobox doesn't appear to allow programmatic value
    // changes, and the input event doesn't fire, so this reaches into the component and clears the
    // value manually.
    // @ts-expect-error This is using a private method from the component
    ;(combobox.value || {})._handleInputClear()
  }
}
const removeJournalDiscipline = (i: number, disc: string) => {
  visibleJournalDisciplines.value.splice(i, 1)
  const newJournalsList = selectedJournals.value.filter((journal) => journal.discipline !== disc)
  if (newJournalsList.length !== selectedJournals.value.length) {
    selectedJournals.value = selectedJournals.value.filter((journal) => journal.discipline !== disc)
    searchStore.doSearch('', false)
  }
}

// Selected Journals
const handleJournalSelection = (e: CheckboxEvent, disc: string) => {
  if (e.newValue) {
    selectedJournals.value.push({
      ...allJournals.value[disc][e.newValue],
      discipline: disc,
    })
  } else {
    selectedJournals.value = selectedJournals.value.filter((journal) =>
      e.checkboxes.includes(journal.headid),
    )
  }
  searchStore.doSearch('', false)
}
const clearJournals = () => {
  selectedJournals.value = []
  searchStore.doSearch('', false)
}
const showSearchFilters = ref(false)

const handleContentTypeSelection = (e: InputFileEvent) => {
  if (selectedContentTypes.value.includes(e.target.value)) {
    selectedContentTypes.value = selectedContentTypes.value.filter(
      (type) => type !== e.target.value,
    )
    if (pseudoDisciplines.value.includes(e.target.value)) {
      selectedDisciplines.value = selectedDisciplines.value.filter(
        (disc) => disc !== e.target.value,
      )
    }
  } else {
    selectedContentTypes.value.push(e.target.value)
    if (pseudoDisciplines.value.includes(e.target.value)) {
      selectedDisciplines.value.push(e.target.value)
    }
  }
  searchStore.doSearch('', false)
}

api.log({
  eventtype: 'pep_landing_search_view',
  event_description: 'User has landed on the search view.',
})
</script>

<template>
  <main>
    <div class="search-view">
      <div>
        <div class="search-filters-container">
          <div class="search-filters">
            <div class="hidden display-grid-md">
              <div class="mx-5 px-2">
                <div class="mx-3 my-7">
                  <pep-pharos-button full-width @click="showSearchFilters = !showSearchFilters">
                    {{ showSearchFilters ? 'Hide Search Filters' : 'Show Search Filters' }}
                  </pep-pharos-button>
                </div>
              </div>
            </div>
            <div
              :class="{ 'hidden-md': !showSearchFilters }"
              class="md-mx-5 md-px-4 md-pb-8 background-color-gray-97"
            >
              <pep-pharos-heading class="pt-7 px-6 pb-5" preset="2" :level="2">
                Refine Results
              </pep-pharos-heading>
              <!-- Search within results -->
              <div>
                <!--Content Type -->
                <div>
                  <pep-pharos-heading class="pt-5 pb-3 px-6" preset="legend" :level="3">
                    CONTENT TYPE
                  </pep-pharos-heading>
                  <pep-pharos-checkbox-group class="px-6 ml-0">
                    <ul>
                      <li v-for="(type, i) in contentTypes" :key="`content_types_${i}`">
                        <pep-pharos-checkbox
                          :checked="selectedContentTypes.includes(type.value)"
                          :value="type.value"
                          @input="handleContentTypeSelection"
                        >
                          <span slot="label">
                            {{ type.label }}
                          </span>
                        </pep-pharos-checkbox>
                      </li>
                    </ul>
                  </pep-pharos-checkbox-group>
                </div>

                <!--Search Heading -->
                <pep-pharos-heading class="py-5 px-6" preset="legend" :level="3">
                  Search within results
                </pep-pharos-heading>
                <!-- Additional search terms form -->
                <form class="pt-0 px-6 pb-3" @submit.prevent.stop="handleAdditionalTerms">
                  <pep-pharos-input-group
                    :value="additionalTerms"
                    name="search-within"
                    hide-label
                    @input="additionalTerms = $event.target.value"
                  >
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

              <!-- Date Heading -->
              <div>
                <pep-pharos-heading class="py-5 px-6" preset="legend" :level="3">
                  <span class="display-flex align-items-center">
                    <span>Publication Year</span>
                    <pep-pharos-icon
                      data-tooltip-id="date-tooltip"
                      name="question-inverse"
                      class="mt-0 pl-3"
                      :a11y-title="'Publication Year Tooltip'"
                      aria-describedby="date-tooltip"
                    />
                    <pep-pharos-tooltip id="date-tooltip" placement="top">
                      <span class="text-none">Enter date as a four digit year (YYYY).</span>
                    </pep-pharos-tooltip>
                  </span>
                </pep-pharos-heading>
                <!-- Date Form -->
                <form
                  class="pt-0 px-6 pb-3 date-filters"
                  @submit.prevent.stop="handleDateSelection"
                >
                  <div>
                    <div class="display-flex flex-direction-row">
                      <pep-pharos-input-group
                        :value="startYear"
                        :invalidated="invalidatedStartYear"
                        name="search-within-min"
                        class="mr-3"
                        @input="startYear = $event.target.value"
                      >
                        <span slot="label" class="text-color-gray-20">from</span>
                      </pep-pharos-input-group>
                      <pep-pharos-input-group
                        :value="endYear"
                        :invalidated="invalidatedEndYear"
                        name="search-within-max"
                        @input="endYear = $event.target.value"
                      >
                        <span slot="label" class="text-color-gray-20">to</span>
                      </pep-pharos-input-group>
                    </div>
                    <span v-if="invalidatedStartYear || invalidatedEndYear" class="error">
                      {{ dateErrorMessage }}
                    </span>
                  </div>
                  <div class="display-flex justify-content-end">
                    <pep-pharos-button
                      name="search-button"
                      variant="primary"
                      label="Apply"
                      a11y-label="Apply"
                      type="submit"
                      class="mt-3"
                    >
                      Apply
                    </pep-pharos-button>
                  </div>
                </form>
              </div>

              <!-- Discipline -->
              <div>
                <!-- Discipline Heading -->
                <div class="display-flex flex-direction-row">
                  <pep-pharos-heading class="py-5 pl-6 pr-2" preset="legend" :level="3">
                    Subject
                  </pep-pharos-heading>
                  <pep-pharos-button
                    v-if="selectedDisciplines.length"
                    variant="subtle"
                    @click="clearDisciplines()"
                  >
                    <small class="text-weight-regular">clear</small>
                  </pep-pharos-button>
                </div>
                <!-- Discipline Checkbox Group -->
                <div v-if="disciplineList && !gettingDisciplines">
                  <CheckboxGroup
                    :source-list="disciplineList"
                    :initial-list-length="5"
                    :initial-selections="[...selectedDisciplines]"
                    :filter-function="
                      (disc: Discipline, term: string) =>
                        disc.label.includes(term) || disc.code.includes(term)
                    "
                    :get-value="(disc: Discipline) => disc.code"
                    :get-label="(disc: Discipline) => disc.label"
                    @input="handleDisciplineSelection"
                  />
                </div>
                <div v-else-if="gettingDisciplines" class="position-relative pt-6 pb-5">
                  <pep-pharos-loading-spinner />
                </div>
              </div>

              <!-- Journals -->
              <div>
                <!-- Journal Discipline Heading -->
                <div class="display-flex flex-direction-row">
                  <pep-pharos-heading class="py-5 pl-6 pr-2" preset="legend" :level="3">
                    <span class="display-flex align-items-center">
                      <span>Journal</span>
                      <pep-pharos-icon
                        data-tooltip-id="journal-discipline-tooltip"
                        name="question-inverse"
                        class="mt-0 pl-3"
                        :a11y-title="'Journal Tooltip'"
                        aria-describedby="journal-discipline-tooltip"
                      />
                      <pep-pharos-tooltip id="journal-discipline-tooltip" placement="top">
                        <span class="text-none"
                          >First select a subject, then select journals within that subject. You may
                          select multiple subjects.</span
                        >
                      </pep-pharos-tooltip>
                    </span>
                  </pep-pharos-heading>
                  <pep-pharos-button
                    v-if="selectedJournals.length"
                    variant="subtle"
                    @click="clearJournals()"
                  >
                    <small class="text-weight-regular">clear</small>
                  </pep-pharos-button>
                </div>
                <div class="journal-filter">
                  <!-- Journal Discipline Combobox -->
                  <div class="px-6">
                    <form @submit.prevent.stop>
                      <pep-pharos-combobox
                        ref="combobox"
                        placeholder="Select a subject"
                        loose-match
                        label="Journal Subject"
                        a11y-label="Journal Subject"
                        @change="handleJournalDisciplineSelection"
                      >
                        <option
                          v-for="(discipline, index) in disciplineList"
                          :key="`journal_discipline_${index}`"
                          :value="discipline.code"
                        >
                          {{ discipline.label }}
                        </option>
                      </pep-pharos-combobox>
                    </form>
                  </div>
                  <div v-if="gettingJournals" class="position-relative mt-3 pb-9">
                    <pep-pharos-loading-spinner />
                  </div>
                  <!-- Journal List (Grouped by Discipline) -->
                  <div v-if="visibleJournalDisciplines.length">
                    <div
                      v-for="(discipline, index) in visibleJournalDisciplines"
                      :key="`journal_discipline_${discipline}`"
                    >
                      <pep-pharos-heading class="mt-3 mb-1 pb-2 px-6" preset="legend" :level="4">
                        <span class="display-flex align-items-center">
                          <span>
                            {{ disciplineObject[discipline].label }}
                          </span>
                          <pep-pharos-button
                            name="journal-close-button"
                            icon="close"
                            variant="subtle"
                            label="remove subject"
                            a11y-label="remove subject"
                            type="submit"
                            @click="removeJournalDiscipline(index, discipline)"
                          />
                        </span>
                      </pep-pharos-heading>
                      <div v-if="Object.keys(allJournals[discipline] || []).length">
                        <!-- Journal Checkbox Group -->
                        <CheckboxGroup
                          :source-list="Object.values(allJournals[discipline])"
                          :initial-list-length="5"
                          :initial-selections="[
                            ...selectedJournals
                              .filter((j: Journal) => j.discipline === discipline)
                              .map((j) => j.headid),
                          ]"
                          :filter-function="
                            (j: Journal, term: string) =>
                              j.headTitle.title.toLowerCase().includes(term)
                          "
                          :get-value="(j: Journal) => j.headid"
                          :get-label="(j: Journal) => j.headTitle.title"
                          @input="handleJournalSelection($event, discipline)"
                        />
                      </div>
                      <div v-else class="pt-0 pb-3">No journals available</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SearchResults />
    </div>
  </main>
</template>

<style scoped lang="scss">
$pharos-breakpoint-medium: 48rem; // 768px
:deep(.highlight) {
  background-color: #ff6;
  color: #000;
  font-weight: 700;
}
:deep(.inline) {
  display: inline;
}
:deep(.inline *) {
  display: inline;
}
.search-view {
  display: grid;
  // The 272px comes from jstor.org
  grid-template-columns: 272px auto;
  // Negative margin is to account for the padding on the main container
  margin-top: calc(-1 * var(--pharos-spacing-2-x));
  margin-bottom: calc(-1 * var(--pharos-spacing-5-x));

  @media screen and (max-width: $pharos-breakpoint-medium) {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
