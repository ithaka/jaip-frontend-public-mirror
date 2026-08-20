import { defineStore } from 'pinia'
import { useCoreStore } from './core'
import type { CitationsResponse } from '@/interfaces/Citations'

export const useCitationsStore = defineStore('citations', {
  state: () => {
    return {
      citations: {} as Record<string, CitationsResponse>,
      gettingCitations: {} as Record<string, boolean>,
    }
  },
  actions: {
    async getCitations(iid: string) {
      const core = useCoreStore()
      this.gettingCitations[iid] = true
      try {
        const { data } = await core.$api.citations.get(iid)
        this.citations[iid] = data
      } catch (error) {
        console.error('Error fetching citations:', error)
        this.citations[iid] = {
          has_error: true,
          error_message: 'Failed to fetch citations.',
          apa: '',
          chicago: '',
          mla: '',
        }
      } finally {
        this.gettingCitations[iid] = false
      }
    },
  },
})
