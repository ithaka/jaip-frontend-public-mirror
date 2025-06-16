<script setup lang="ts">
import { ref, toRaw, onBeforeUnmount } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import * as viewer from 'pdfjs-dist/web/pdf_viewer.mjs'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { Log } from '@/interfaces/Log'
import { useCoreStore } from '@/stores/core'

const props = defineProps({
  iid: {
    type: String,
    required: true,
  },
  enableViewer: {
    type: Boolean,
    required: true,
  },
})

const coreStore = useCoreStore()
const logEvent: Log = {
  eventtype: 'pep_pdf_viewer_access_attempt',
  event_description: 'A user attempted to access the PDF viewer, but an error occurred.',
  itemid: props.iid,
}

const CMAP_URL = 'pdfjs-dist/cmaps/'
const CMAP_PACKED = true
const ENABLE_XFA = true
const SEARCH_FOR = '' // try "Mozilla";

const pdfDocument = ref()
const pdfView = ref()
const hasError = ref(false)
const handlePageSelection = (e: InputFileEvent) => {
  // We need to convert the proxy to a raw value in order to access the currentPageNumber property
  ;(toRaw(pdfView.value) || {}).currentPageNumber = +e.target.value
}
const createLoadingTask = (src: string) => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: src,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      enableXfa: ENABLE_XFA,
    }).promise
    return loadingTask
  } catch (err) {
    logEvent.frontend_error = `CREATE LOADING TASK: ${JSON.stringify(err)}`
    coreStore.$api.log(logEvent)
    hasError.value = true
  }
}

const createViewer = () => {
  try {
    const container = document.getElementById('viewerContainer') as HTMLDivElement
    const eventBus = new viewer.EventBus()

    const pdfViewer = new viewer.PDFViewer({
      container,
      eventBus,
    })

    eventBus.on('pagesinit', function () {
      pdfViewer.currentScaleValue = 'page-width'

      if (SEARCH_FOR) {
        eventBus.dispatch('find', { type: '', query: SEARCH_FOR })
      }
    })
    pdfView.value = pdfViewer
    return pdfViewer
  } catch (err) {
    logEvent.frontend_error = `CREATE VIEWER: ${JSON.stringify(err)}`
    coreStore.$api.log(logEvent)
    hasError.value = true
  }
}

const preparePage = async () => {
  try {
    const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
    const url = `/api/v2/page/${props.iid}`
    if (props.enableViewer) {
      const document = await createLoadingTask(url)
      const pdfViewer = createViewer()
      if (document && pdfViewer) {
        pdfDocument.value = document
        await pdfViewer.setDocument(document)
      }
    }
  } catch (err) {
    logEvent.frontend_error = `PREPARE PAGE: ${JSON.stringify(err)}`
    coreStore.$api.log(logEvent)
    hasError.value = true
  }
}

preparePage()

const interval = setInterval(() => {
  coreStore.$api.log({
    eventtype: 'pep_pdf_view',
    event_description: 'user is viewing the PDF',
    itemid: props.iid,
  })
}, 1000 * 60)

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>

<template>
  <div>
    <div v-if="hasError" class="mt-8 mb-10">
      <pep-pharos-heading :level="2" preset="5" class="error text-align-center">
        PDF Viewer Error
      </pep-pharos-heading>
      <p class="text-align-center">An error occurred while loading the PDF viewer.</p>
    </div>
    <div v-else>
      <pep-pharos-select
        v-if="(pdfDocument || {}).numPages > 1"
        loose-match
        :value="(pdfView || {}).currentPageNumber"
        class="page-select mb-3"
        @change="handlePageSelection"
      >
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <span slot="label"> Page </span>
        <option
          v-for="page in (pdfDocument || {}).numPages"
          :key="`journal_discipline_${page}`"
          :value="page"
          style="z-index: 1000"
        >
          {{ page }}
        </option>
      </pep-pharos-select>
      <div v-if="enableViewer" class="viewerPage">
        <div id="viewerContainer">
          <div id="viewer" class="pdfViewer" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import 'pdfjs-dist/web/pdf_viewer.css';
@import '@ithaka/pharos/lib/styles/variables.css';

.viewerPage {
  height: 100vh;
  width: 100%;
  position: relative;
}

#viewerContainer {
  overflow: auto;
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  height: 95vh;
  border: 1px solid black;
}
</style>
