import { defineStore } from 'pinia'
import type ContentType from '@/interfaces/ContentType'
import type { Discipline, DisciplineObject } from '@/interfaces/Discipline'
import type { SortedJournals, Journal } from '@/interfaces/Journal'
import type { SearchResponse } from '@/interfaces/SearchResponse'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import type SearchArgs from '@/interfaces/SearchArgs'

const formatSearchString = (arr: string[]) => {
  arr = arr.map((item) => `"${item}"`)
  let str = ''
  if (arr.length > 1) {
    str = `(${arr.join(' OR ')})`
  } else {
    str = arr[0]
  }
  return str
}

export const useSearchStore = defineStore('search', {
  // arrow function recommended for full type inference
  state: () => {
    return {
      offset: 0,
      limit: 25,
      sort: 'new',
      searchTerms: '',
      lastSearchTerms: '',
      pseudoDisciplines: ['research_report'],
      contentTypes: [
        {
          value: 'journal',
          label: 'Journals',
        },
        {
          value: 'chapter',
          label: 'Book Chapters',
        },
        {
          value: 'research_report',
          label: 'Research Reports',
        },
      ],
      selectedContentTypes: [] as string[],
      contentTypeList: [] as ContentType[],
      researchReportCode: 'research_report',

      selectedDisciplines: [] as string[],
      disciplineList: [] as Discipline[],

      journals: '',
      selectedJournals: [] as Journal[],
      allJournals: {} as SortedJournals,

      selectedDocuments: [] as string[],

      pubYearStart: 1665,
      pubYearEnd: new Date().getFullYear(),

      reviewStatus: '' as string,
      statusStartDate: new Date(Date.parse('01 Jan 2022 00:00:00 GMT')),
      statusEndDate: new Date(new Date().setUTCHours(23, 59, 59, 999)),
      statusQuery: '' as string,
      newSearch: true,
      newSearchCounts: false,
      pageNo: 1,
      searchResp: {} as SearchResponse,
      secondarySearchResp: {} as SearchResponse,
      secondaryPageNo: 1,
      secondaryLimit: 10,

      searching: false,
      secondarySearching: false,

      searchResultsKey: 0,
    }
  },
  actions: {
    setSearchTerms(newSearchTerms: string, path: string) {
      if (path === '/requests') {
        this.sort = 'new'
      } else {
        this.searchTerms = newSearchTerms
        if (!newSearchTerms && this.sort === 'rel') {
          this.sort = 'new'
        }
        if (!this.lastSearchTerms && newSearchTerms) {
          this.sort = 'rel'
        }
      }
    },
    async doSearch(status: string, secondary: boolean) {
      this.searching = true
      const args: SearchArgs = {
        pageNo: this.pageNo,
        limit: status ? this.secondaryLimit : this.limit,
        sort: this.sort,
        facets: ['contentType', 'disciplines'],
        filters: [],
      }

      if (secondary) {
        args.pageNo = this.secondaryPageNo
      }
      if (status) {
        args.statusStartDate = this.statusStartDate
        args.statusEndDate = this.statusEndDate
        args.statusQuery = this.statusQuery
      } else {
        args.query = this.searchTerms
        args.filters = this.searchFilters
      }
      const userStore = useUserStore()
      if (userStore.isAuthenticatedAdmin && userStore.selectedGroups['status_search']) {
        args.groups = userStore.selectedGroups['status_search']
      } else if (userStore.isAuthenticatedStudent) {
        args.groups = userStore.groupIDs
      }

      try {
        const coreStore = useCoreStore()
        if (secondary) {
          this.secondarySearching = true
          args.filters = this.searchFilters
          const { data } = await coreStore.$api.search.status(args, status)
          this.secondarySearchResp = data
        } else {
          const { data } = status
            ? await coreStore.$api.search.status(args, status)
            : await coreStore.$api.search.basic(args)
          this.searchResp = data
          this.lastSearchTerms = this.searchTerms
          this.searchResultsKey++
        }
      } catch {
        const coreStore = useCoreStore()
        const msg = "An error occurred and your search results couldn't be retrieved."
        coreStore.toast(msg, 'error')
      }
      this.searching = false
      this.secondarySearching = false
    },
  },
  getters: {
    disciplineObject(): DisciplineObject {
      return this.disciplineList.reduce((obj, discipline) => {
        obj[discipline.code] = discipline
        return obj
      }, {} as DisciplineObject)
    },
    selectedJCodes(): string[] {
      const jcodes: string[] = []
      this.selectedJournals.forEach((journal) => {
        journal.all_titles.forEach((title) => {
          title.jcode.forEach((jc) => {
            if (!jcodes.includes(jc)) {
              jcodes.push(jc)
            }
          })
        })
      })
      return jcodes
    },
    selectedJournalIDs(): string[] {
      return this.selectedJournals.map((journal) => journal.headid)
    },
    dateFilter(): string {
      return `year: [${this.pubYearStart} TO ${this.pubYearEnd}]`
    },
    disciplineFilter(): string {
      return `disciplines: ${formatSearchString(this.filteredDisciplines)}`
    },
    filteredDisciplines(): string[] {
      return this.selectedDisciplines.filter((disc) => !this.pseudoDisciplines.includes(disc))
    },
    journalFilter(): string {
      return `jcode: ${formatSearchString(this.selectedJCodes)}`
    },
    contentTypeFilter(): string {
      return `contentType: ${formatSearchString(this.selectedContentTypes)}`
    },
    searchFilters(): string[] {
      const filters = [this.dateFilter]
      if (this.filteredDisciplines.length) {
        filters.push(this.disciplineFilter)
      }
      if (this.selectedJournals.length) {
        filters.push(this.journalFilter)
      }
      if (this.selectedContentTypes.length) {
        filters.push(this.contentTypeFilter)
      }
      return filters
    },
    searchResults(): MediaRecord[] {
      return this.searchResp.docs || []
    },
    searchTotal(): number {
      return this.searchResp.total || 0
    },

    secondarySearchResults(): MediaRecord[] {
      return this.secondarySearchResp.docs || []
    },
    secondarySearchTotal(): number {
      return this.secondarySearchResp.total || 0
    },
  },
})
