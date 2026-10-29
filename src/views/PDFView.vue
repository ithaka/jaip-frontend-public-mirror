<script setup lang="ts">
import PDFViewer from '@/components/Viewer/PDFViewer.vue'
import { useRoute } from 'vue-router'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import SearchResult from '@/components/results/SearchResult.vue'
import BackLink from '@/components/BackLink.vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'
import { useLogger } from '@/composables/logging/useLogger'
import { useBackToResults } from '@/composables/useBackToResults'

const route = useRoute()
const coreStore = useCoreStore()
const doc = ref({} as MediaRecord)
/** Active document ID stays reactive when Vue Router reuses this view for another PDF. */
const iid = computed(() => route.params.iid as string)
const gettingDocument = ref(false)
const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)

const updateKey = ref(0)
/** Invalidates older metadata requests after a newer request starts or the view unmounts. */
let requestGeneration = 0
onBeforeUnmount(() => requestGeneration++)

/** Loads metadata only while this request still belongs to the active route and view. */
const getDocument = async () => {
  /** Request identity is captured together so stale responses cannot update the next document. */
  const generation = ++requestGeneration
  const documentId = iid.value
  try {
    /** Search arguments fetch metadata for this request's captured document, not a later route. */
    const args = {
      pageNo: 1,
      limit: 1,
      sort: 'rel',
      facets: ['contentType', 'disciplines'],
      filters: [],
      query: `id:${documentId}`,
    }
    gettingDocument.value = true

    /** Only the current request may publish this response or clear the loading state. */
    const search = await coreStore.$api.search.basic(args)
    if (generation !== requestGeneration) return

    if (((search?.data || {}).docs || []).length) {
      doc.value = search!.data.docs[0]!
    }
  } catch (err: unknown) {
    if (generation !== requestGeneration) return
    const errorResponse = err as { response: { status: number } }
    console.log('Error fetching document:', errorResponse)
  } finally {
    if (generation === requestGeneration) {
      updateKey.value++
      gettingDocument.value = false
    }
  }
}

/** Reloads metadata immediately and whenever same-component navigation changes the document. */
watch(
  iid,
  () => {
    doc.value = {} as MediaRecord
    void getDocument()
  },
  { immediate: true },
)

const { resultsHref, goBackToResults } = useBackToResults()
const { handleWithLog, logs } = useLogger()
const { backToResultsLog } = logs.getBackLinkLogs()

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <pep-pharos-layout row-gap="0">
    <Teleport to="body">
      <pep-pharos-loading-spinner v-if="gettingDocument" class="position-fixed" />
    </Teleport>
    <BackLink
      v-if="resultsHref"
      class="cols-12 mt-5"
      label="Back to results"
      :href="resultsHref"
      data-cy="back-to-results-link"
      @click.prevent="handleWithLog(backToResultsLog, goBackToResults)"
    />
    <div
      v-if="doc && Object.keys(doc).length"
      class="cols-12 mb-7"
      :class="{ 'mt-5': !resultsHref }"
    >
      <SearchResult
        :key="updateKey"
        :doc="doc"
        hide-details
        hide-requests
        pdf-view
        @approval-submitted="getDocument"
        @denial-submitted="getDocument"
        @restrict-submitted="getDocument"
      />
    </div>
    <PDFViewer
      v-if="featureDetails['view_pdf']?.enabled"
      :key="iid"
      tabindex="-1"
      class="cols-12"
      :iid="iid"
      :enable-viewer="featureDetails['view_pdf']?.enabled || false"
      :doc="doc"
    />
  </pep-pharos-layout>
</template>

<style lang="scss"></style>
