<script setup lang="ts">
import PDFViewer from '@/components/PDFViewer.vue'
import { useRoute } from 'vue-router'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import SearchResult from '@/components/results/SearchResult.vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { Cedar } from '@/interfaces/Metadata'

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
const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)

const updateKey = ref(0)
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

    const results = await Promise.all(apiCalls)
    const search = results[0]

    if (((search?.data || {}).docs || []).length) {
      doc.value = search!.data.docs[0]!
    }

    if (page_index) {
      metadata.value = {
        ...metadata.value,
        ...results[1]?.data,
      }
      if (metadata.value.pageCount && initial_page_index >= metadata.value.pageCount) {
        initial_page_index = metadata.value.pageCount - 1
      }
      if (metadata.value.status === 403) {
        error.value.status = true
        error.value.message = 'Unauthorized'
        error.value.code = 403
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

getDocument()
const hasStructuredClone = ref(typeof window.structuredClone === 'function')

coreStore.$api.log({
  eventtype: 'pep_landing_pdf_view',
  event_description: 'User has landed on the pdf view.',
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
      <p v-if="!page_index || pdfData">You do not have access to this document.</p>
    </div>
    <PDFViewer
      v-if="!page_index && !error.status && hasStructuredClone"
      class="cols-12"
      :iid="iid"
      :enable-viewer="featureDetails['view_pdf']?.enabled || false"
    />
  </pep-pharos-layout>
</template>

<style lang="scss"></style>

@/utils/viewers
