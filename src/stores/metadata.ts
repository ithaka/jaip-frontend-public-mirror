import { defineStore } from 'pinia'
import { useCoreStore } from './core'
import type { Collections, CollectionMetadata } from '@/interfaces/Collections'

export const useMetadataStore = defineStore('metadata', {
  state: () => {
    return {
      metadata: {} as Record<Collections, CollectionMetadata[] | undefined>,
      gettingMetadata: false,
    }
  },
  actions: {
    async getMetadata(collection: Collections) {
      try {
        this.gettingMetadata = true
        const coreStore = useCoreStore()
        const response = await coreStore.$api.collections.metadata(collection)
        if (!response?.data) {
          throw new Error('No data received from metadata API')
        } else if (!Array.isArray(response.data)) {
          throw new Error('Invalid data format received from metadata API')
        }
        this.metadata[collection] = response.data
      } catch (error) {
        console.error('Error fetching metadata:', error)
      } finally {
        this.gettingMetadata = false
      }
    },
  },
  getters: {
    metadataByFilename(): Record<Collections, Record<string, CollectionMetadata>> {
      return Object.keys(this.metadata).reduce(
        (acc, collection) => {
          const collectionKey = collection as Collections
          const items = this.metadata[collectionKey] || []
          acc[collectionKey] = items.reduce(
            (itemAcc, item) => {
              itemAcc[item.filename] = item
              return itemAcc
            },
            {} as Record<string, CollectionMetadata>,
          )
          return acc
        },
        {} as Record<Collections, Record<string, CollectionMetadata>>,
      )
    },
  },
})
