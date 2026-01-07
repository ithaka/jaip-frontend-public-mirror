<script setup lang="ts">
import { ref, toRaw, onBeforeUnmount, useTemplateRef, type Ref, type PropType } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as viewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import type { Log } from '@/interfaces/Log'
import { useCoreStore } from '@/stores/core'
import ControlBar from './Controls/ControlBar.vue'
import {
  requestFullscreen,
  exitFullscreen,
  browserInFullscreen,
  setupFullscreenChangeListeners,
  removeFullscreenChangeListeners,
  canUseFullscreenAPI,
} from '@/utils/viewers.ts'
import { useValidDownloadURL } from '@/composables/urls'
import type { Collections } from '@/interfaces/Collections'

const props = defineProps({
  iid: {
    type: String as PropType<string | undefined>,
    required: false,
    default: undefined,
  },
  filename: {
    type: String as PropType<string | undefined>,
    required: false,
    default: undefined,
  },
  collection: {
    type: String as PropType<Collections | undefined>,
    required: false,
    default: undefined,
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
  itemid: props.iid || props.filename || 'unknown',
}

// PDFJS CONFIGURATION
const ENABLE_XFA = true
const DEFAULT_SCALE_DELTA = 1.1
const MIN_SCALE = 0.25
const MAX_SCALE = 10.0
// The wasm files are needed to process some images included in PDFs (jpx files specifically,
// though there may be others). Including the wasmUrl in the the loading task options allows
// pdfjs to render the images. Note that the trailing slash is important here.
const OPENJPEG_WASM_URL = `${import.meta.env.BASE_URL}scripts/pdfjs/wasm/`

// PDF VIEWER SETUP
const paginationKey = ref(0)
const pdfDocument = ref()
const pdfView = ref({}) as Ref<viewer.PDFViewer>
const hasError = ref(false)
const handlePageSelection = (page: number) => {
  if (page && page > 0 && page <= (pdfDocument.value || {}).numPages) {
    toRaw(pdfView.value).currentPageNumber = +page
  }
}

// PDF LOADING
const isLoading = ref(false)
const createLoadingTask = async (src: string) => {
  isLoading.value = true
  try {
    const loadingTask = await pdfjsLib.getDocument({
      url: src,
      enableXfa: ENABLE_XFA,
      withCredentials: true,
      wasmUrl: OPENJPEG_WASM_URL,
    }).promise
    return loadingTask
  } catch (err) {
    logEvent.frontend_error = `CREATE LOADING TASK: ${JSON.stringify(err)}`
    coreStore.$api.log(logEvent)
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

// PDF VIEWER CREATION
const createViewer = () => {
  try {
    const container = document.getElementById('viewer-container') as HTMLDivElement
    const eventBus = new viewer.EventBus()
    const pdfViewer = new viewer.PDFViewer({
      container,
      eventBus,
      annotationMode: pdfjsLib.AnnotationMode.DISABLE,
    })

    // In cases where the viewer size changes, the pdf needs to be re-fitted. We can use
    // the pdf.js event bus to listen for resize events and adjust the scale accordingly,
    // but we also need to dispatch resize events when the window is resized.
    const dispatchResizeEvent = () => {
      eventBus.dispatch('resize', {})
    }
    window.addEventListener('resize', dispatchResizeEvent)
    eventBus.on('resize', function () {
      pdfViewer.currentScaleValue = 'page-fit'
    })
    onBeforeUnmount(() => {
      window.removeEventListener('resize', dispatchResizeEvent)
    })

    // Set initial scale to fit page
    eventBus.on('pagesinit', function () {
      pdfViewer.currentScaleValue = 'page-fit'
      fitHeight.value = true
    })
    // Update pagination key on page change to force re-render of page number input
    eventBus.on('pagechanging', function () {
      paginationKey.value++
    })

    pdfView.value = pdfViewer
    return pdfViewer
  } catch (err) {
    logEvent.frontend_error = `CREATE VIEWER: ${JSON.stringify(err)}`

    coreStore.$api.log(logEvent)
    hasError.value = true
  }
}

// PDF PREPARATION
const preparePage = async () => {
  try {
    const workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

    const url = useValidDownloadURL(props.iid, props.collection, props.filename)
    if (!url) {
      logEvent.frontend_error = 'No valid URL for PDF document'
      coreStore.$api.log(logEvent)
      hasError.value = true
      return
    }
    if (props.enableViewer) {
      const doc = await createLoadingTask(url)
      const pdfViewer = createViewer() || ({} as viewer.PDFViewer)
      if (doc && pdfViewer) {
        pdfDocument.value = doc
        await pdfViewer.setDocument(doc)
      }
    }
  } catch (err) {
    logEvent.frontend_error = `PREPARE PAGE: ${JSON.stringify(err)}`
    coreStore.$api.log(logEvent)
    hasError.value = true
  }
}
preparePage()

// VIEWER CONTROLS
// References to viewer elements
const viewerWrapper = useTemplateRef('viewerWrapper')

// CONTROL MENU STATE
const isMenuOpen = ref(false)
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// ROTATION CONTROLS
const rotateClockwise = () => {
  toRaw(pdfView.value).pagesRotation = (toRaw(pdfView.value).pagesRotation + 90) % 360
  canFitHeight.value = pdfView.value.pagesRotation !== 90 && pdfView.value.pagesRotation !== 270
}
const rotateCounterClockwise = () => {
  toRaw(pdfView.value).pagesRotation = (toRaw(pdfView.value).pagesRotation - 90) % 360
  canFitHeight.value = pdfView.value.pagesRotation !== 90 && pdfView.value.pagesRotation !== 270
}

// ZOOM CONTROLS
const zoomIn = (ticks: number) => {
  let newScale = toRaw(pdfView.value).currentScale
  do {
    newScale = Number((newScale * DEFAULT_SCALE_DELTA).toFixed(2))
    newScale = Math.ceil(newScale * 10) / 10
    newScale = Math.min(MAX_SCALE, newScale)
  } while (ticks-- && newScale < MAX_SCALE)
  toRaw(pdfView.value).currentScale = newScale
  fitHeight.value = false
}
const zoomOut = (ticks: number) => {
  let newScale = (toRaw(pdfView.value) || {}).currentScale
  do {
    newScale = Number((newScale / DEFAULT_SCALE_DELTA).toFixed(2))
    newScale = Math.floor(newScale * 10) / 10
    newScale = Math.max(MIN_SCALE, newScale)
  } while (--ticks && newScale > MIN_SCALE)
  ;(toRaw(pdfView.value) || {}).currentScale = newScale
  fitHeight.value = false
}

// FULLSCREEN CONTROLS
const isInFullscreen = ref(false)
const handleFullscreenToggle = () => {
  // If the fullscreen API is not available, we handle the toggle with CSS only.
  if (!canUseFullscreenAPI()) {
    handleFullscreenCSSToggle()
    return
  }
  // When the fullscreen API is available
  if (isInFullscreen.value) {
    if (viewerWrapper.value) {
      viewerWrapper.value.style.position = 'relative'
      viewerWrapper.value.style.display = 'flex'
    }
    exitFullscreen()
    toRaw(pdfView.value).currentScaleValue = 'page-fit'
    isInFullscreen.value = false
  } else {
    requestFullscreen(viewerWrapper.value, () => {
      isInFullscreen.value = true
    })
  }
}
// This handles cases where fullscreen is toggled without the fullscreen API.
function handleFullscreenCSSToggle() {
  if (viewerWrapper.value) {
    if (isInFullscreen.value) {
      viewerWrapper.value.classList.remove('viewer-wrapper--full-screen')
      toRaw(pdfView.value).currentScaleValue = 'page-fit'
      isInFullscreen.value = false
    } else {
      viewerWrapper.value.classList.add('viewer-wrapper--full-screen')
      isInFullscreen.value = true
    }
  }
}
// This manages some properties when fullscreen state changes externally (e.g., user presses ESC or
// users some other browser or device controls to exit fullscreen).
const handleFullscreenChange = () => {
  if (viewerWrapper.value) {
    viewerWrapper.value.style.position = browserInFullscreen() ? 'fixed' : 'relative'
    viewerWrapper.value.style.display = 'flex'
  }

  if (!browserInFullscreen()) {
    isInFullscreen.value = false
  }
}
setupFullscreenChangeListeners(handleFullscreenChange)

// FIT HEIGHT CONTROLS
const canFitHeight = ref(true)
const fitHeight = ref(false)
const fitHeightToggle = () => {
  if (fitHeight.value) {
    toRaw(pdfView.value).currentScaleValue = 'page-width'
  } else {
    toRaw(pdfView.value).currentScaleValue = 'page-fit'
  }
  fitHeight.value = !fitHeight.value
}

coreStore.$api.log({
  eventtype: 'pep_fe_pdf_view_start',
  event_description: 'user is viewing the PDF',
  itemid: props.iid || props.filename || 'unknown',
  collection: props.collection || undefined,
})

onBeforeUnmount(() => {
  removeFullscreenChangeListeners(handleFullscreenChange)
  coreStore.$api.log({
    eventtype: 'pep_fe_pdf_view_complete',
    event_description: 'user has stopped viewing the PDF',
    itemid: props.iid || props.filename || 'unknown',
    collection: props.collection || undefined,
  })
})
</script>

<template>
  <div tabindex="0">
    <div v-if="hasError" class="mt-8 mb-10">
      <pep-pharos-heading :level="2" preset="5" class="error text-align-center">
        PDF Viewer Error
      </pep-pharos-heading>
      <p class="text-align-center">An error occurred while loading the PDF viewer.</p>
    </div>
    <div v-else>
      <!-- This is conditionally moved to the body because some devices don't support fullscreen (notably iOS Safari).
       This approach allows for the viewer to at least occupy the entire viewing window in cases where the fullscreen
       API is not available. -->
      <Teleport to="body" :disabled="!isInFullscreen || !canUseFullscreenAPI()">
        <div
          v-if="enableViewer"
          ref="viewerWrapper"
          :class="['viewer-wrapper', { 'viewer-wrapper--full-screen': isInFullscreen }]"
        >
          <div class="viewer-and-controls">
            <ControlBar
              :pagination-key="paginationKey"
              :is-fit-to-width="fitHeight"
              :is-in-fullscreen="isInFullscreen"
              :is-menu-open="isMenuOpen"
              :can-fit-height="canFitHeight"
              :page-count="(pdfDocument || {}).numPages || 0"
              :current-page="(pdfView || {}).currentPageNumber || 1"
              @toggle-menu="toggleMenu"
              @rotate-right="rotateClockwise"
              @rotate-left="rotateCounterClockwise"
              @zoom-in="zoomIn(1)"
              @zoom-out="zoomOut(1)"
              @fit-view="fitHeightToggle"
              @update-page="handlePageSelection"
              @toggle-fullscreen="handleFullscreenToggle"
            />
            <div id="viewer-container" tabindex="-1">
              <div v-if="!isLoading" id="viewer" class="pdfViewer" />
              <pep-pharos-loading-spinner v-else-if="isLoading" />
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style lang="scss">
@import 'pdfjs-dist/web/pdf_viewer.css';
@import '@ithaka/pharos/lib/styles/variables.css';

.viewer-wrapper {
  max-width: 100%;
  &--full-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--pharos-color-black);
    display: flex;
    flex-direction: column;
  }
}
.viewer-and-controls {
  height: 100vh;
  width: 100%;
  position: relative;
  background-color: var(--pharos-color-black);
  padding-bottom: 5px;
}

#viewer-container {
  overflow: auto;
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  height: 95vh;
  &.full-screen {
    height: 100vh;
    min-height: 100%;
    min-width: 100vw;
    width: 100vw;
  }
}
</style>
