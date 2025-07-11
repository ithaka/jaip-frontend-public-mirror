<script setup lang="ts">
import type { MediaRecord } from '@/interfaces/MediaRecord'
import { useCoreStore } from '@/stores/core'
import SearchResult from '@/components/results/SearchResult.vue'
import { ref } from 'vue'

const coreStore = useCoreStore()
const docs = ref([] as MediaRecord[])
const total = ref(0)
const searching = ref(false)
const limit = 10
const page = ref(1)
const term = ref('')

const getBlockedItems = async () => {
  try {
    searching.value = true
    const resp = await coreStore.$api.global_blocks.get({
      term: term.value,
      page: page.value,
      limit: limit,
    })
    docs.value = resp.data.docs || []
    total.value = resp.data.total || 0
    searching.value = false
  } catch (error) {
    console.error('Error fetching blocked items:', error)
  } finally {
    searching.value = false
  }
}

const changePage = (newPage: number) => {
  page.value = newPage
  getBlockedItems()
}

getBlockedItems()

coreStore.$api.log({
  eventtype: 'pep_block_list_view',
  event_description: 'User has landed on the block list view.',
})
const getResultsCountLabel = (count: number) => {
  return count === 1 ? '1 blocked item' : `${count} blocked items`
}
</script>

<template>
  <div v-if="searching" class="position-relative mt-8 cols-12">
    <pep-pharos-loading-spinner />
  </div>
  <div v-else class="cols-12 mb-6">
    <div>
      <form @submit.prevent.stop="getBlockedItems">
        <pep-pharos-input-group
          id="block_list_query"
          placeholder="Enter a term to search reasons"
          name="block_list_query"
          class="mt-4 mb-7"
          :value="term"
          @input="term = $event.target.value"
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
    <div v-if="docs.length" class="mt-5">
      <pep-pharos-heading preset="3--bold" :level="2" class="mb-6">
        {{ getResultsCountLabel(total) }}
      </pep-pharos-heading>
      <div v-for="doc in docs" :key="doc.iid" class="mb-8">
        <SearchResult
          :key="doc.iid"
          :doc="doc"
          hide-statuses
          is-block-list
          @block-submitted="getBlockedItems"
        />
      </div>
    </div>
    <div v-else class="cols-12 mt-5 mb-7">
      <pep-pharos-heading preset="3--bold" :level="2"> No blocked items found. </pep-pharos-heading>
    </div>
    <pep-pharos-pagination
      v-if="!searching && total > docs.length"
      class="mt-8 cols-12 justify-self-end"
      :total-results="total"
      :page-size="limit"
      :current-page="page"
      @prev-page="changePage(page - 1)"
      @next-page="changePage(page + 1)"
    />
  </div>
</template>

<style></style>
