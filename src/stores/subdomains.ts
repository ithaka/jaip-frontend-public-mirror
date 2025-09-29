import { defineStore } from 'pinia'
import type { Subdomain, SubdomainRequest } from '@/interfaces/Subdomains'
import { useCoreStore } from './core'

export const useSubdomainStore = defineStore('subdomains', {
  state: () => {
    return {
      subdomains: [] as Subdomain[],
      gettingSubdomains: false,
    }
  },
  actions: {
    async getAllSubdomains() {
      const args = {
        is_active: true,
        name: '',
      }
      this.getSubdomains(args)
    },
    async getSubdomains(args: SubdomainRequest) {
      const core = useCoreStore()
      core.isSpinning = true
      try {
        const { data } = await core.$api.auth.subdomains.get(args)
        this.subdomains = data.subdomains
      } catch (error) {
        console.error('Error fetching subdomains:', error)
      } finally {
        core.isSpinning = false
      }
    },
  },
})
