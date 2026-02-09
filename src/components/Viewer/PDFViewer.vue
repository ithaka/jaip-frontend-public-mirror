<script setup lang="ts">
import { ref, toRaw, onBeforeUnmount, useTemplateRef, type Ref, type PropType, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as viewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
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
import type { MediaRecord } from '@/interfaces/MediaRecord'
import RequestButton from '../buttons/RequestButton.vue'
import { useRoute, useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { useLogger } from '@/composables/logging/useLogger'
import { ViewerControls } from '@/interfaces/Viewer'

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
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
})

const coreStore = useCoreStore()
const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)
const itemid = ref(props.iid || props.filename || 'unknown')

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
// PDF LOADING
const isLoading = ref(false)
const loadingError = ref({
  message: '',
  status: false,
  code: 0,
})

const route = useRoute()
const routeName = ref(route.name)
const isReentryContent = computed(() => routeName.value === 'collection item')
const pdfView = ref({}) as Ref<viewer.PDFViewer>
const pdfDocument = ref()

const { handleWithLog, logs } = useLogger()
const {
  errorLinkClickLog,
  viewerControlLog,
  pageSelectionLog,
  startPDFViewingSessionLog,
  endPDFViewingSessionLog,
  PDFViewerErrorLog,
} = logs.getPDFViewerLogs({
  iid: itemid,
  isReentryContent: isReentryContent,
  viewer: pdfView,
  documentProxy: pdfDocument,
})

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
    if (err instanceof Error && 'status' in err) {
      if (err.status === 404) {
        loadingError.value.status = true
        loadingError.value.message = 'Not Found'
        loadingError.value.code = err.status
      } else if (err.status === 200 && err.name === 'InvalidPDFException') {
        loadingError.value.status = true
        loadingError.value.message = 'Unable to retrieve PDF document'
        loadingError.value.code = err.status
      } else {
        loadingError.value.status = true
        loadingError.value.message = 'Server Error'
        loadingError.value.code = typeof err.status === 'number' ? err.status : 500
      }
    } else {
      loadingError.value.status = true
      loadingError.value.message = 'Unknown Error'
      loadingError.value.code = 200
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...loadingError.value } }), () => {})
  } finally {
    isLoading.value = false
  }
}

// PDF VIEWER CREATION
const isCreatingViewer = ref(false)
const createViewerError = ref({
  message: '',
  status: false,
})
const createViewer = () => {
  try {
    isCreatingViewer.value = true

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
      // This is logged here because this event indicates that the viewer is fully initialized,
      // so we can reasonably assume that the user is now viewing the PDF.
      handleWithLog(startPDFViewingSessionLog)
    })

    // Update pagination key on page change to force re-render of page number input
    eventBus.on('pagechanging', function ($event: { previous: number }) {
      handleWithLog(
        pageSelectionLog({ previous_page: $event.previous }),
        () => paginationKey.value++,
      )
    })
    pdfView.value = pdfViewer
    return pdfViewer
  } catch (err) {
    createViewerError.value = {
      message: `An error occurred while creating the PDF viewer: ${JSON.stringify(err)}`,
      status: true,
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...createViewerError.value } }), () => {})
  } finally {
    isCreatingViewer.value = false
  }
}

// PDF PREPARATION
const isPreparingPage = ref(false)
const preparePageError = ref({
  message: '',
  status: false,
  code: 0,
})
const preparePage = async () => {
  const url = useValidDownloadURL(props.iid, props.collection, props.filename)
  if (!url) {
    preparePageError.value = {
      message: 'A valid URL could not be generated for the PDF document.',
      status: true,
      code: 404,
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...preparePageError.value } }), () => {})

    return
  }
  try {
    const workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
    if (props.enableViewer) {
      const doc = await createLoadingTask(url)
      const pdfViewer = createViewer() || ({} as viewer.PDFViewer)
      if (doc && pdfViewer) {
        pdfDocument.value = doc
        await pdfViewer.setDocument(doc)
      }
    }
  } catch (err) {
    preparePageError.value = {
      message: `An error occurred while preparing the PDF viewer.: ${JSON.stringify(err)}`,
      status: true,
      code: 0,
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...preparePageError.value } }), () => {})
  } finally {
    isPreparingPage.value = false
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

// PAGINATION CONTROLS
const paginationKey = ref(0)
const handlePageSelection = (page: number) => {
  if (page && page > 0 && page <= (pdfDocument.value || {}).numPages) {
    // This log happens here rather than in the click handler to ensure that we don't unnecessarily issue
    // logs when the page isn't actually valid.
    handleWithLog(
      pageSelectionLog({ previous_page: toRaw(pdfView.value).currentPageNumber }),
      () => {
        toRaw(pdfView.value).currentPageNumber = +page
      },
    )
  }
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

onBeforeUnmount(() => {
  handleWithLog(endPDFViewingSessionLog, () =>
    removeFullscreenChangeListeners(handleFullscreenChange),
  )
})

const router = useRouter()
const emit = defineEmits(['close'])
const reentryPath = computed(() => {
  return route.path.split('/').slice(0, 3).join('/')
})
const handleBrowseReentryLink = () => {
  handleWithLog(errorLinkClickLog({ destination: reentryPath.value }), () =>
    changeRoute(
      router,
      emit,
      reentryPath.value,
      searchTerms.value,
      pageNo.value,
      undefined,
      undefined,
    ),
  )
}

const toastContent = `This item was added to Your Requests. <pep-pharos-link is-on-background href='/search' variant='inline'>Return to Search</pep-pharos-link> to review it.`
const fireToast = () => {
  coreStore.toast(toastContent, 'success', 10000)
}
</script>

<template>
  <div tabindex="0">
    <div v-if="loadingError.status || preparePageError.status || createViewerError.status">
      <div
        v-if="loadingError.code === 404 || preparePageError.code === 404"
        class="error-container"
      >
        <div v-if="isReentryContent" class="error">
          <pep-pharos-heading
            :level="2"
            preset="4--bold"
            data-cy="item-not-found"
            no-margin
            class="error__heading"
          >
            Item not found
          </pep-pharos-heading>
          <p class="error__text">
            This guide may not exist or is no longer available on JSTOR. Try searching for another
            guide.
          </p>
          <pep-pharos-button
            variant="primary"
            data-cy="browse-guides-button"
            @click="handleBrowseReentryLink"
          >
            Browse guides
          </pep-pharos-button>
        </div>
        <div v-else class="error">
          <pep-pharos-heading
            :level="2"
            preset="4--bold"
            data-cy="item-not-found"
            no-margin
            class="error__heading"
          >
            Item not found
          </pep-pharos-heading>
          <p class="error__text">
            This item may not exist or is no longer available on JSTOR. Try searching for another
            item.
          </p>
          <pep-pharos-button variant="primary" :href="`/search`" data-cy="search-button"
            >Search</pep-pharos-button
          >
        </div>
      </div>
      <div v-else-if="loadingError.code === 200" class="error-container">
        <div v-if="isReentryContent" class="error">
          <pep-pharos-heading
            :level="2"
            preset="4--bold"
            data-cy="item-not-available"
            no-margin
            class="error__heading"
          >
            Item not available
          </pep-pharos-heading>
          <p class="error__text">
            Something went wrong while loading this guide. Try viewing other guides.
          </p>
          <pep-pharos-button
            variant="primary"
            data-cy="browse-guides-button"
            @click="handleBrowseReentryLink"
            >Browse guides</pep-pharos-button
          >
        </div>
        <div v-else class="error">
          <pep-pharos-heading
            :level="2"
            preset="4--bold"
            data-cy="item-not-available"
            no-margin
            class="error__heading"
          >
            Item not available
          </pep-pharos-heading>
          <p class="error__text">
            Something went wrong while loading this item. Try searching for another item.
          </p>
          <pep-pharos-button variant="primary" :href="`/search`" data-cy="search-button"
            >Search</pep-pharos-button
          >
        </div>
      </div>
      <div v-else-if="loadingError.code === 403">
        <div v-if="doc.is_restricted" class="error-container">
          <div class="error">
            <pep-pharos-heading
              :level="2"
              preset="4--bold"
              data-cy="item-unavailable"
              class="error__heading"
            >
              Item unavailable
            </pep-pharos-heading>
            <p class="error__text">Try searching for another item.</p>
            <pep-pharos-button variant="primary" :href="`/search`" data-cy="search-button"
              >Search</pep-pharos-button
            >
          </div>
        </div>
        <div v-else class="error-container">
          <div class="error">
            <pep-pharos-heading
              :level="2"
              preset="4--bold"
              data-cy="item-requires-approval"
              no-margin
              class="error__heading"
            >
              The item requires approval
            </pep-pharos-heading>
            <p class="error__text">Request this item for review and to keep searching.</p>
            <RequestButton
              :doc="doc"
              :hide-requests="false"
              :full-width="false"
              :button-label="`Request`"
              :cancel-button-label="`Cancel`"
              data-cy="request-button"
              @submit-request="fireToast"
            />
          </div>
        </div>
      </div>
      <div v-else class="error-container">
        <div v-if="isReentryContent" class="error">
          <pep-pharos-heading :level="2" preset="4--bold" no-margin class="error__heading">
            Item not viewable on this device
          </pep-pharos-heading>
          <p class="error__text">Try browsing other guides.</p>
          <pep-pharos-button
            variant="primary"
            data-cy="browse-guides-button"
            @click="handleBrowseReentryLink"
            >Browse guides</pep-pharos-button
          >
        </div>
        <div v-else class="error">
          <pep-pharos-heading :level="2" preset="4--bold" no-margin class="error__heading">
            Item not viewable on this device
          </pep-pharos-heading>
          <p class="error__text">Try searching for another item.</p>
          <pep-pharos-button variant="primary" :href="`/search`">Search</pep-pharos-button>
        </div>
      </div>
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
              @toggle-menu="
                handleWithLog(viewerControlLog({ action: ViewerControls.toggle_menu }), toggleMenu)
              "
              @rotate-right="
                handleWithLog(
                  viewerControlLog({ action: ViewerControls.rotate_right }),
                  rotateClockwise,
                )
              "
              @rotate-left="
                handleWithLog(
                  viewerControlLog({ action: ViewerControls.rotate_left }),
                  rotateCounterClockwise,
                )
              "
              @zoom-in="
                handleWithLog(viewerControlLog({ action: ViewerControls.zoom_in }), () => zoomIn(1))
              "
              @zoom-out="
                handleWithLog(viewerControlLog({ action: ViewerControls.zoom_out }), () =>
                  zoomOut(1),
                )
              "
              @fit-view="
                handleWithLog(
                  viewerControlLog({ action: ViewerControls.fit_view }),
                  fitHeightToggle,
                )
              "
              @update-page="handlePageSelection"
              @toggle-fullscreen="
                handleWithLog(
                  viewerControlLog({ action: ViewerControls.toggle_fullscreen }),
                  handleFullscreenToggle,
                )
              "
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
.error-container {
  padding: 10rem;
  border: 1px solid var(--pharos-color-black);
  @media (max-width: 767px) {
    padding: 10rem var(--pharos-spacing-1-x);
  }
  .error {
    text-align: center;
    color: var(--pharos-color-black);
    &__heading {
      margin-bottom: var(--pharos-spacing-one-half-x);
    }
    &__text {
      margin-bottom: var(--pharos-spacing-one-and-a-half-x);
      max-width: 360px;
      justify-self: center;
    }
  }
}
.viewer-wrapper {
  max-width: 100%;
  &--full-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100%;
    width: 100%;
    background-color: var(--pharos-color-black);
    display: flex;
    flex-direction: column;
  }
}
.viewer-and-controls {
  // This number results in a somewhat odd height, but it seems to roughly accommodate a pdf
  // and will work when in full screen or not. It's just slightly smaller than what we're told
  // is the viewport height for some tablets. It's a fallback for devices that don't support
  // vh.
  min-height: 1100px;
  min-height: 100vh;
  height: 100%;
  height: 100vh;
  height: 100dvh;
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
  height: 93%;
  height: 95vh;
  height: 95dvh;
  &.full-screen {
    height: 100vh;
    min-height: 100%;
    min-width: 100%;
  }
}
</style>
