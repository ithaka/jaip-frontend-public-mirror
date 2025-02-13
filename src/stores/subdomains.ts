import { defineStore } from 'pinia'
import type { Subdomain } from '@/interfaces/Subdomains'

export const useSubdomainStore = defineStore('subdomains', {
  state: () => {
    return {
      subdomains: [] as Subdomain[],
      gettingSubdomains: false
    }
  }
})
