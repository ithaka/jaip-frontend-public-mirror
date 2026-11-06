<script setup lang="ts">
import PDFViewer from '@/components/Viewer/PDFViewer.vue'
import PageViewer from '@/components/Viewer/PageViewer.vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import SearchResult from '@/components/results/SearchResult.vue'
import BackLink from '@/components/BackLink.vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { ViewerType } from '@/interfaces/Viewer'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'
import { useLogger } from '@/composables/logging/useLogger'
import { useBackToResults } from '@/composables/useBackToResults'
import { v4 as uuidv4 } from 'uuid'

const route = useRoute()
const router = useRouter()
const isPageViewer = computed(() => route.name === 'Page Viewer')
const activeViewer = computed<ViewerType>(() => (isPageViewer.value ? 'page' : 'pdf'))
const initialPage = computed(() => {
  const page = isPageViewer.value
    ? Number(route.params.pid) + 1
    : Number(route.query.viewerPage || 1)
  return Number.isInteger(page) && page > 0 ? page : 1
})
const currentPage = ref(1)
const alternateViewer = computed(() => {
  const query = { ...route.query }
  delete query.viewerPage
  return {
    name: isPageViewer.value ? 'PDF Viewer' : 'Page Viewer',
    params: isPageViewer.value
      ? { iid: iid.value }
      : { iid: iid.value, pid: currentPage.value - 1 },
    query: isPageViewer.value ? { ...query, viewerPage: currentPage.value } : query,
  }
})
const coreStore = useCoreStore()
const doc = ref({} as MediaRecord)
/** Active document ID stays reactive when Vue Router reuses this view for another PDF. */
const iid = computed(() => route.params.iid as string)
watch([iid, isPageViewer], () => (currentPage.value = initialPage.value), { immediate: true })
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
const viewingSessionId = ref(uuidv4())
let viewingSessionStarted = false
let viewingSessionLogs = logs.getPageViewerLogs({
  iid: iid.value,
  eventUUID: viewingSessionId.value,
  viewerType: () => activeViewer.value,
})
const pdfViewer = ref<InstanceType<typeof PDFViewer> | null>(null)
const { viewerModeSwitchLog } = logs.getViewerNavigationLogs({
  iid,
  eventUUID: viewingSessionId,
})

const startViewingSession = () => {
  if (viewingSessionStarted) return
  viewingSessionStarted = true
  void handleWithLog(viewingSessionLogs.startPageViewingSessionLog)
}

const endViewingSession = () => {
  if (!viewingSessionStarted) return
  viewingSessionStarted = false
  void handleWithLog(viewingSessionLogs.endPageViewingSessionLog)
}

watch(iid, () => {
  endViewingSession()
  viewingSessionId.value = uuidv4()
  viewingSessionLogs = logs.getPageViewerLogs({
    iid: iid.value,
    eventUUID: viewingSessionId.value,
    viewerType: () => activeViewer.value,
  })
})
onBeforeUnmount(endViewingSession)

const navigateToAlternateViewer = () => {
  const target = alternateViewer.value
  const destination = router.resolve(target).path
  const from = activeViewer.value
  const to = from === 'page' ? 'pdf' : 'page'
  // Captured before navigating, since the PDF viewer unmounts once the route changes.
  const snapshot = pdfViewer.value?.getSessionSnapshot()
  return handleWithLog(viewerModeSwitchLog({ destination, from, to, snapshot }), () =>
    router.push(target),
  )
}

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
      label="Back"
      :href="resultsHref"
      data-cy="back-link"
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
    <nav
      v-if="featureDetails['view_pdf']?.enabled"
      class="cols-12 mb-3 viewer-options"
      aria-label="Viewer options"
    >
      <pep-pharos-link
        :href="router.resolve(alternateViewer).href"
        data-cy="alternate-viewer-link"
        @click.prevent="navigateToAlternateViewer"
      >
        {{ isPageViewer ? 'Return to PDF viewer' : 'Not working? Try alternate viewer' }}
      </pep-pharos-link>
    </nav>
    <PageViewer
      v-if="isPageViewer && featureDetails['view_pdf']?.enabled"
      :key="`page-${iid}`"
      class="cols-12"
      :iid="iid"
      :doc="doc"
      :viewing-session-id="viewingSessionId"
      @viewing-started="startViewingSession"
      @page-change="currentPage = $event"
    />
    <PDFViewer
      v-else-if="featureDetails['view_pdf']?.enabled"
      :key="`pdf-${iid}`"
      ref="pdfViewer"
      tabindex="-1"
      class="cols-12"
      :iid="iid"
      :enable-viewer="featureDetails['view_pdf']?.enabled || false"
      :doc="doc"
      :initial-page="initialPage"
      :viewing-session-id="viewingSessionId"
      @viewing-started="startViewingSession"
      @page-change="currentPage = $event"
    />
  </pep-pharos-layout>
</template>

<style lang="scss" scoped>
.viewer-options {
  display: flex;
  justify-content: flex-end;
}
</style>
