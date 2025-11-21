<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCoreStore } from '@/stores/core'
import { computed, onMounted, ref } from 'vue'
import SearchResult from '@/components/results/SearchResult.vue'
import type { Cedar } from '@/interfaces/Metadata'
import PageViewer from '@/components/pages/PageViewer.vue'
import { requestFullscreen, exitFullscreen } from '@/utils/viewers.ts'
import type { MediaRecord } from '@/interfaces/MediaRecord'

const route = useRoute()
const coreStore = useCoreStore()
const doc = ref({} as MediaRecord)
const iid = (route.params || {}).iid as string
const page_index = (route.params || {}).pid as string
let initial_page_index = parseInt(page_index, 10)

if (isNaN(initial_page_index) || initial_page_index < 0) {
  initial_page_index = 0
}

const gettingDocument = ref(false)
const pdfData = ref('')
const metadata = ref({ id: iid } as Cedar)
const error = ref({
  message: '',
  status: false,
  code: 0,
})

const updateKey = ref(0)
/**
 * Fetches document data and optional metadata based on the provided `iid` and `page_index`.
 *
 * - Initiates a search API call to retrieve the document.
 * - If `page_index` is provided, also fetches document metadata.
 * - Handles API errors, setting appropriate error states for 403 (Unauthorized), 404 (Not Found), and other server errors.
 * - Updates `doc`, `metadata`, and error state variables accordingly.
 * - Ensures UI state is updated via `updateKey` and `gettingDocument`.
 *
 * @async
 * @throws Sets error state on API failure.
 */
const getDocument = async () => {
  try {
    const args = {
      pageNo: 1,
      limit: 1,
      sort: 'rel',
      facets: ['contentType', 'disciplines'],
      filters: [],
      query: `id:${iid}`,
    }
    gettingDocument.value = true

    const apiCalls = [coreStore.$api.search.basic(args)]
    if (page_index) {
      apiCalls.push(coreStore.$api.documents.metadata(iid))
    }
    const results = await Promise.allSettled(apiCalls)
    if (results[0]) {
      if (results[0].status === 'rejected') {
        throw results[0].reason
      } else {
        const search = results[0].value
        if (((search.data || {}).docs || []).length) {
          doc.value = search.data.docs[0]!
        }
      }
    }

    if (results[1]) {
      if (results[1]?.status === 'rejected') {
        throw results[1].reason
      } else {
        if (page_index) {
          metadata.value = {
            ...metadata.value,
            ...results[1].value.data,
          }
          if (metadata.value.pageCount && initial_page_index >= metadata.value.pageCount) {
            initial_page_index = metadata.value.pageCount - 1
          }
        }
      }
    }
  } catch (err: unknown) {
    const errorResponse = err as { response: { status: number } }
    if (errorResponse.response.status === 403) {
      error.value.status = true
      error.value.message = 'Unauthorized'
      error.value.code = 403
    } else if (errorResponse.response.status === 404) {
      error.value.status = true
      error.value.message = 'Not Found'
      error.value.code = 404
    } else {
      error.value.status = true
      metadata.value.status = errorResponse.response.status || 500
      error.value.message = 'Server Error'
      error.value.code = errorResponse.response.status || 500
    }
  } finally {
    updateKey.value++
    gettingDocument.value = false
  }
}

/**
 * @vue Lifecycle hook: mounted
 * @description
 * Executes when the component is mounted.
 * - If a valid `iid` (document ID) exists, invokes `getDocument()` to retrieve document data.
 * - If `iid` is absent or invalid, updates the error state with status, message, and error code (400).
 */
onMounted(() => {
  if (iid) {
    getDocument()
  } else {
    error.value.status = true
    error.value.message = 'Invalid Document ID'
    error.value.code = 400
  }
})

const iiifViewerController = ref(null)
const isInFullscreen = ref(false)
const handleFullscreenToggle = () => {
  if (isInFullscreen.value) {
    exitFullscreen()
    isInFullscreen.value = false
  } else {
    requestFullscreen(iiifViewerController.value, () => {
      isInFullscreen.value = true
    })
  }
}

coreStore.$api.log({
  eventtype: 'pep_landing_pages_view',
  event_description: 'User has landed on the page view.',
})

const showDocument = computed(() => {
  return page_index && !pdfData.value && !error.value.status
})

const accessDenied = computed(() => {
  return !page_index || pdfData.value
})
</script>

<template>
  <pep-pharos-layout row-gap="0">
    <Teleport to="body">
      <pep-pharos-loading-spinner v-if="gettingDocument" class="position-fixed" />
    </Teleport>
    <div v-if="doc" class="cols-12 mt-5 mb-7">
      <SearchResult
        :key="updateKey"
        :doc="doc"
        hide-details
        hide-requests
        pdf-view
        :include-pdf="!!page_index"
        @approval-submitted="getDocument"
        @denial-submitted="getDocument"
        @restrict-submitted="getDocument"
      />
    </div>
    <div
      v-if="error.status && error.message"
      class="cols-12"
      :class="[{ 'mt-10': error.code !== 403 }]"
    >
      <pep-pharos-heading class="mb-2 mb-4 pb-0" preset="5--bold" :level="1">
        {{ error.message }}
      </pep-pharos-heading>
      <p v-if="accessDenied">You do not have access to this document.</p>
    </div>
    <div v-if="showDocument" ref="iiifViewerController" class="cols-12">
      <PageViewer
        :metadata="metadata"
        :initial-page-index="initial_page_index"
        :is-in-fullscreen="isInFullscreen"
        :fullscreen-toggled-callback="handleFullscreenToggle"
        :show-navigator-in-fullscreen="true"
        :is-primary="true"
        :has-multiple-viewers="false"
        :presentation-session="''"
        :viewer-closed-callback="undefined"
        :primary-page-changed-callback="undefined"
      />
    </div>
  </pep-pharos-layout>
</template>

<style lang="scss"></style>
