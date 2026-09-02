<script setup lang="ts">
import {
  ref,
  toRaw,
  onBeforeUnmount,
  useTemplateRef,
  nextTick,
  type Ref,
  type PropType,
  computed,
} from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as viewer from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import pdfWorkerUrl from '@/workers/pdf-worker-entry.ts?worker&url'
import { useCoreStore } from '@/stores/core'
import ControlBar from './Controls/ControlBar.vue'
import {
  requestFullscreen,
  exitFullscreen,
  browserInFullscreen,
  setupFullscreenChangeListeners,
  removeFullscreenChangeListeners,
  canUseFullscreenAPI,
  canUsePDFViewer,
  shouldDisablePDFJSImageDecoder,
  shouldUsePDFJSMainThreadWorker,
} from '@/utils/viewers.js'
import { initPDFWorkerPolyfills } from '@/utils/polyfills'
import { useValidDownloadURL } from '@/composables/urls'
import type { Collections } from '@/interfaces/Collections'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import RequestButton from '../buttons/RequestButton.vue'
import { useRoute, useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { useLogger } from '@/composables/logging/useLogger'
import { ViewerControls, type ViewerError } from '@/interfaces/Viewer'

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
/**
 * Older Chromium releases expose ImageDecoder even though their implementation can fail while
 * PDF.js renders certain images. The user-agent check keeps PDF.js on its established decoder path
 * for affected browsers, including Chrome 100 and Android WebViews based on it. This does not
 * disable images: PDF.js still renders them using its own WASM or JavaScript decoders instead of the
 * browser's native ImageDecoder implementation.
 */
const DISABLE_IMAGE_DECODER = shouldDisablePDFJSImageDecoder()
// Vite serves worker source modules directly in development, so browsers without module-worker
// support see its injected static imports as syntax errors. Production uses the bundled IIFE.
const USE_MAIN_THREAD_PDF_WORKER = import.meta.env.DEV || shouldUsePDFJSMainThreadWorker()

// The wasm files are needed to process some images included in PDFs (jpx files specifically,
// though there may be others). Including the wasmUrl in the loading task options allows PDF.js to
// render those images. PDF.js appends decoder filenames to this URL, so the trailing slash matters.
const OPENJPEG_WASM_URL = `${import.meta.env.BASE_URL}scripts/pdfjs/wasm/`

// We need to determine whether the browser supports CSS round(), because pdfjs uses it to set the
// page sizes.
const SUPPORTS_CSS_ROUND = (() => {
  const probe = document.createElement('div')
  probe.style.width = 'round(down, 1px, 1px)'
  return probe.style.width !== ''
})()

/**
 * If we don't have CSS round() support, we can apply page dimensions directly. Older browsers also
 * reject the multiplication syntax used by PDF.js's former calc() fallback, so values are taken
 * from the already-scaled viewport instead of asking the CSS parser to perform that multiplication.
 * Modern browsers keep PDF.js's native rounded inline dimensions unchanged. This is based on fallbacks
 * from pdfjs v4.
 *
 * @param pageView - The PDF.js page view whose compatibility variables should be refreshed.
 */
const setLegacyPageDimensions = (pageView?: viewer.PDFPageView) => {
  if (SUPPORTS_CSS_ROUND || !pageView) return

  const { div, viewport } = pageView
  const isSideways = viewport.rotation % 180 !== 0
  const pageWidth = `${Math.floor(viewport.width)}px`
  const pageHeight = `${Math.floor(viewport.height)}px`
  const layerWidth = isSideways ? pageHeight : pageWidth
  const layerHeight = isSideways ? pageWidth : pageHeight

  // Write dimensions directly instead of relying on a stylesheet declaration whose unresolved
  // custom property could collapse every page to auto/zero sizing.
  div.style.width = pageWidth
  div.style.height = pageHeight
  for (const layer of div.querySelectorAll<HTMLElement>('[data-main-rotation]')) {
    layer.style.width = layerWidth
    layer.style.height = layerHeight
  }
}

/** Refreshes compatibility dimensions for every page currently owned by a PDF.js viewer. */
const setLegacyViewerDimensions = (pdfViewer: viewer.PDFViewer) => {
  if (SUPPORTS_CSS_ROUND) return
  for (let index = 0; index < pdfViewer.pagesCount; index++) {
    setLegacyPageDimensions(pdfViewer.getPageView(index))
  }
}

// PDF VIEWER SETUP
// PDF LOADING
const isLoading = ref(false)
// Holds download and parsing failures in the shared shape used by the error UI and logger.
const loadingError = ref<ViewerError>({
  message: '',
  status: false,
  code: 0,
})

const route = useRoute()
const routeName = ref(route.name)
const isReentryContent = computed(() => routeName.value === 'collection item')
const pdfView = ref({}) as Ref<viewer.PDFViewer>
const pdfDocument = ref()

/**
 * Converts any thrown value into the serializable error fields accepted by viewer logs and UI
 * state. This is necessary to allow for possible arbitrary error values from PDF.js and browser APIs
 * which may not be instances of Error.
 *
 * @param err - The value caught from PDF.js or browser APIs.
 * @returns A displayable message plus the original error name and stack when available.
 */
const getErrorDetails = (err: unknown): Pick<ViewerError, 'message' | 'name' | 'stack'> => {
  if (typeof err === 'object' && err !== null) {
    const error = err as { message?: unknown; name?: unknown; stack?: unknown }
    if (typeof error.message === 'string') {
      return {
        message: error.message,
        ...(typeof error.name === 'string' && { name: error.name }),
        ...(typeof error.stack === 'string' && { stack: error.stack }),
      }
    }
  }

  return { message: typeof err === 'string' ? err : String(err) }
}

// The viewerEventBus is used to listen for events from the PDF viewer.
// It is set when the viewer is created and cleared when the component is unmounted.
// The removeWindowResizeListener function is used to remove the window resize event
// listener when the component is unmounted to prevent memory leaks.
const viewerEventBus = ref<viewer.EventBus | null>(null)
let removeWindowResizeListener: (() => void) | null = null
// The source URL is retained so a failed render can reload the same document with safer options.
let activePDFSourceUrl: string | null = null
// Ensures an OffscreenCanvas failure triggers at most one full-document retry.
let hasRetriedWithoutOffscreenCanvas = false
// Prevents render-error events produced during replacement from starting overlapping retries.
let isRetryingWithoutOffscreenCanvas = false

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

onBeforeUnmount(() => {
  handleWithLog(endPDFViewingSessionLog, () =>
    removeFullscreenChangeListeners(handleFullscreenChange),
  )

  if (removeWindowResizeListener) {
    removeWindowResizeListener()
    removeWindowResizeListener = null
  }

  viewerEventBus.value = null
})

/**
 * Loads a PDF using the compatibility settings shared by the initial load and fallback retry.
 * Loading failures are normalized, displayed, and logged here so callers can stop when no document
 * is returned.
 *
 * @param src - PDF URL to load.
 * @param options - Optional rendering compatibility overrides.
 * @param options.disableOffscreenCanvas - Force PDF.js to render without OffscreenCanvas.
 * @returns The loaded PDF document, or `undefined` after recording a loading error.
 */
const createLoadingTask = async (
  src: string,
  { disableOffscreenCanvas = false }: { disableOffscreenCanvas?: boolean } = {},
) => {
  isLoading.value = true
  try {
    const loadingTask = await pdfjsLib.getDocument({
      url: src,
      enableXfa: ENABLE_XFA,
      withCredentials: true,
      wasmUrl: OPENJPEG_WASM_URL,
      // This disables only Chromium's native ImageDecoder on affected versions. PDF images remain
      // enabled and are decoded through PDF.js's WASM/JavaScript fallback implementation.
      // The single render-failure retry also forces this off: WebView builds can misreport their
      // Chromium version, so a render failure past the version threshold may still be an
      // ImageDecoder bug rather than an OffscreenCanvas one.
      isImageDecoderSupported: !DISABLE_IMAGE_DECODER && !disableOffscreenCanvas,
      // This override is applied only after a render failure to preserve the faster default path.
      ...(disableOffscreenCanvas && { isOffscreenCanvasSupported: false }),
    }).promise
    return loadingTask
  } catch (err) {
    const errorDetails = getErrorDetails(err)
    if (err instanceof Error && 'status' in err) {
      if (err.status === 404) {
        loadingError.value = {
          ...errorDetails,
          message: `Not Found: ${errorDetails.message}`,
          status: true,
          code: err.status,
        }
      } else if (err.status === 200 && err.name === 'InvalidPDFException') {
        loadingError.value = {
          ...errorDetails,
          message: `Unable to retrieve PDF document: ${errorDetails.message}`,
          status: true,
          code: err.status,
        }
      } else {
        loadingError.value = {
          ...errorDetails,
          message: `Server Error: ${errorDetails.message}`,
          status: true,
          code: typeof err.status === 'number' ? err.status : 500,
        }
      }
    } else {
      loadingError.value = {
        ...errorDetails,
        message: `Unknown Error: ${errorDetails.message}`,
        status: true,
        code: 200,
      }
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...loadingError.value } }), () => {})
  } finally {
    isLoading.value = false
  }
}

/**
 * Retries one asynchronous page-render failure with OffscreenCanvas disabled. PDF loading can
 * succeed before a browser-specific canvas failure appears, so this recovery listens for
 * `pagerendered` errors rather than only catching `getDocument`. The retry restores the current page
 * and disposes of the superseded document to release worker and canvas resources.
 *
 * @param err - The rendering failure reported by the PDF.js event bus.
 */
const handlePageRenderError = async (err: unknown) => {
  // Several page renders may fail together; only the first event should control replacement.
  if (isRetryingWithoutOffscreenCanvas) return

  const errorDetails = getErrorDetails(err)
  // A second failure is terminal because repeating the same fallback would create a retry loop.
  if (hasRetriedWithoutOffscreenCanvas || !activePDFSourceUrl) {
    preparePageError.value = {
      ...errorDetails,
      message: `Unable to render the PDF document: ${errorDetails.message}`,
      status: true,
      code: 0,
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...preparePageError.value } }), () => {})
    return
  }

  hasRetriedWithoutOffscreenCanvas = true
  isRetryingWithoutOffscreenCanvas = true
  handleWithLog(
    PDFViewerErrorLog({
      error: {
        ...errorDetails,
        message: `PDF rendering failed; retrying without OffscreenCanvas or ImageDecoder: ${errorDetails.message}`,
        status: true,
        code: 0,
      },
    }),
    () => {},
  )

  try {
    const pdfViewer = toRaw(pdfView.value)
    const previousDocument = pdfDocument.value
    const previousPageNumber = pdfViewer.currentPageNumber || 1
    const replacementDocument = await createLoadingTask(activePDFSourceUrl, {
      disableOffscreenCanvas: true,
    })
    if (!replacementDocument) return

    // Wait for the replacement viewer to initialize before restoring the user's page position.
    viewerEventBus.value?.on(
      'pagesinit',
      () => {
        pdfViewer.currentPageNumber = Math.min(previousPageNumber, replacementDocument.numPages)
      },
      { once: true },
    )
    pdfDocument.value = replacementDocument
    pdfViewer.setDocument(replacementDocument)
    isRetryingWithoutOffscreenCanvas = false

    // The replacement now owns the viewer, so the first document can release its worker resources.
    if (previousDocument) {
      void previousDocument.destroy().catch((cleanupError: unknown) => {
        const cleanupErrorDetails = getErrorDetails(cleanupError)
        handleWithLog(
          PDFViewerErrorLog({
            error: {
              ...cleanupErrorDetails,
              message: `Unable to clean up the previous PDF document: ${cleanupErrorDetails.message}`,
              status: true,
              code: 0,
            },
          }),
          () => {},
        )
      })
    }
  } catch (retryError) {
    const retryErrorDetails = getErrorDetails(retryError)
    preparePageError.value = {
      ...retryErrorDetails,
      message: `Unable to render the PDF document without OffscreenCanvas or ImageDecoder: ${retryErrorDetails.message}`,
      status: true,
      code: 0,
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...preparePageError.value } }), () => {})
  } finally {
    isRetryingWithoutOffscreenCanvas = false
  }
}

// PDF VIEWER CREATION
const isCreatingViewer = ref(false)
// Holds viewer-construction failures in the shared shape used by the error UI and logger.
const createViewerError = ref<ViewerError>({
  message: '',
  status: false,
  code: 0,
})
const createViewer = () => {
  try {
    isCreatingViewer.value = true

    const container = document.getElementById('viewer-container') as HTMLDivElement
    const eventBus = new viewer.EventBus()

    // This needs to be set on the viewerEventBus ref so that it can be accessed in the onBeforeUnmount hook to remove the resize listener.
    viewerEventBus.value = eventBus
    const pdfViewer = new viewer.PDFViewer({
      container,
      eventBus,
      annotationMode: pdfjsLib.AnnotationMode.DISABLE,
    })

    if (!SUPPORTS_CSS_ROUND) {
      // pagesloaded catches mixed-size documents after their individual viewports are known;
      // pagerender also covers lazily initialized pages before their canvas is drawn.
      eventBus.on('pagesloaded', () => setLegacyViewerDimensions(pdfViewer))
      eventBus.on('pagerender', ({ source }: { source: viewer.PDFPageView }) =>
        setLegacyPageDimensions(source),
      )
      eventBus.on('textlayerrendered', ({ source }: { source: viewer.PDFPageView }) =>
        setLegacyPageDimensions(source),
      )
      eventBus.on('xfalayerrendered', ({ source }: { source: viewer.PDFPageView }) =>
        setLegacyPageDimensions(source),
      )
      // PDF.js updates viewports before these events; refresh the fixed pixel values after zooming
      // and after rotation swaps the page width and height.
      eventBus.on('scalechanging', () => setLegacyViewerDimensions(pdfViewer))
      eventBus.on('rotationchanging', () => setLegacyViewerDimensions(pdfViewer))
    }

    // In cases where the viewer size changes, the pdf needs to be re-fitted. We can use
    // the pdf.js event bus to listen for resize events and adjust the scale accordingly,
    // but we also need to dispatch resize events when the window is resized.
    const dispatchResizeEvent = () => {
      eventBus.dispatch('resize', {})
    }
    window.addEventListener('resize', dispatchResizeEvent)
    // This is set on a variable so that it can be removed in the onBeforeUnmount hook to prevent memory leaks.
    removeWindowResizeListener = () => {
      window.removeEventListener('resize', dispatchResizeEvent)
    }
    eventBus.on('resize', function () {
      pdfViewer.currentScaleValue = 'page-fit'
    })

    // Set initial scale to fit page
    eventBus.on('pagesinit', function () {
      setLegacyViewerDimensions(pdfViewer)
      pdfViewer.currentScaleValue = 'page-fit'
      fitHeight.value = true
      // This is logged here because this event indicates that the viewer is fully initialized,
      // so we can reasonably assume that the user is now viewing the PDF.
      handleWithLog(startPDFViewingSessionLog)
    })

    // Rendering happens asynchronously after setDocument, so loading the document can succeed
    // even when a browser-specific canvas implementation later fails.
    eventBus.on('pagerendered', ({ error }: { error?: unknown }) => {
      if (error) void handlePageRenderError(error)
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
    const errorDetails = getErrorDetails(err)
    createViewerError.value = {
      ...errorDetails,
      message: `An error occurred while creating the PDF viewer: ${errorDetails.message}`,
      status: true,
      code: 0,
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...createViewerError.value } }), () => {})
    // Returning no viewer lets preparePage stop instead of calling setDocument on a placeholder.
    return undefined
  } finally {
    isCreatingViewer.value = false
  }
}

// PDF PREPARATION
const isPreparingPage = ref(false)
/** Holds compatibility, URL, worker, and document-attachment failures encountered during setup. */
const preparePageError = ref<ViewerError>({
  message: '',
  status: false,
  code: 0,
})

/**
 * Configures PDF.js's execution context. Firefox versions before 114 cannot parse module imports in
 * workers, so load PDF.js's WorkerMessageHandler into the page and let PDF.js use its supported
 * main-thread fallback there. Other browsers retain a real worker using Vite's bundled classic URL.
 */
const configurePDFJSWorker = async () => {
  if (USE_MAIN_THREAD_PDF_WORKER) {
    // The worker bundle uses transferToFixedLength even when PDF.js hosts it on the main thread.
    // In development, import PDF.js directly so Vite doesn't serve its ESM worker entry as a classic
    // worker. Production imports the already-emitted IIFE URL to avoid shipping a duplicate copy.
    // Both paths register globalThis.pdfjsWorker for PDF.js's built-in fake-worker implementation.
    initPDFWorkerPolyfills()
    if (import.meta.env.DEV) {
      await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs')
    } else {
      await import(/* @vite-ignore */ pdfWorkerUrl)
    }
    return
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
}

/**
 * Validates browser support and the source URL before configuring the bundled worker and creating
 * the PDF.js viewer. Unsupported devices are routed through the component's normal error UI rather
 * than leaving the surrounding view blank.
 */
const preparePage = async () => {
  // The legacy bundle still relies on a small set of APIs supplied by polyfills.
  if (props.enableViewer && !canUsePDFViewer()) {
    preparePageError.value = {
      message: 'The PDF viewer is not supported by this browser.',
      status: true,
      code: 0,
    }
    handleWithLog(PDFViewerErrorLog({ error: { ...preparePageError.value } }), () => {})
    return
  }

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
  // The render fallback needs the resolved URL because props alone may not describe the final host.
  activePDFSourceUrl = url
  try {
    if (props.enableViewer) {
      await configurePDFJSWorker()
      const doc = await createLoadingTask(url)
      if (!doc) return

      // #viewer is hidden via v-show while isLoading is true; PDF.js measures text-layer layout
      // (and caches the result forever) as soon as pages are created, so that DOM update must be
      // flushed first or those measurements are taken against a display:none ancestor.
      await nextTick()

      const pdfViewer = createViewer()
      if (!pdfViewer) return

      pdfDocument.value = doc
      await pdfViewer.setDocument(doc)
    }
  } catch (err) {
    const errorDetails = getErrorDetails(err)
    preparePageError.value = {
      ...errorDetails,
      message: `An error occurred while preparing the PDF viewer: ${errorDetails.message}`,
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
/** Distinguishes the CSS fallback from native fullscreen so only the fallback is teleported. */
const isUsingCSSFullscreen = ref(false)

/** Leaves CSS fullscreen and re-fits the document after its viewport returns to normal. */
const exitCSSFullscreen = () => {
  isUsingCSSFullscreen.value = false
  isInFullscreen.value = false
  toRaw(pdfView.value).currentScaleValue = 'page-fit'
}

/** Enters a viewport-filling CSS mode for browsers where native fullscreen cannot be used. */
const enterCSSFullscreen = () => {
  if (!viewerWrapper.value) return

  isUsingCSSFullscreen.value = true
  isInFullscreen.value = true
}

/**
 * Toggles fullscreen without allowing rejected browser promises to desynchronize the controls.
 * Browsers may expose the Fullscreen API but reject a request because of permissions or other issues,
 * which falls back to CSS fullscreen.
 */
const handleFullscreenToggle = async () => {
  if (isUsingCSSFullscreen.value) {
    exitCSSFullscreen()
    return
  }

  // If the fullscreen API is not available, we handle the toggle with CSS only.
  if (!canUseFullscreenAPI()) {
    enterCSSFullscreen()
    return
  }

  // When the fullscreen API is available
  if (isInFullscreen.value) {
    const didExitFullscreen = await exitFullscreen()
    // Preserve the fullscreen state when the browser rejects the exit request.
    if (didExitFullscreen && !browserInFullscreen()) {
      if (viewerWrapper.value) {
        viewerWrapper.value.style.position = 'relative'
        viewerWrapper.value.style.display = 'flex'
      }
      toRaw(pdfView.value).currentScaleValue = 'page-fit'
      isInFullscreen.value = false
    }
  } else {
    const didEnterFullscreen = await requestFullscreen(viewerWrapper.value)
    // Native state is updated only after the browser confirms that the request succeeded.
    if (didEnterFullscreen) {
      isInFullscreen.value = true
    } else {
      // Some browsers expose requestFullscreen but reject it at runtime. Keep the
      // viewer usable by switching to the same CSS fallback used when the API is absent.
      enterCSSFullscreen()
    }
  }
}

/**
 * Synchronizes native fullscreen state when it changes outside the control bar, such as when the
 * user presses Escape. CSS fullscreen is ignored because it does not generate browser fullscreen
 * events and owns its state independently.
 */
const handleFullscreenChange = () => {
  if (isUsingCSSFullscreen.value) return

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
      <!-- Only the CSS fallback is moved to body so ancestor layout and overflow cannot constrain it.
       Native fullscreen keeps the same DOM node in place because moving an active fullscreen element can cause the
       browser to exit fullscreen. -->
      <Teleport to="body" :disabled="!isUsingCSSFullscreen">
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
              <!-- Keep PDF.js's viewer node mounted while a document reloads. Replacing it with v-if
               would invalidate the DOM references held by the existing PDFViewer instance. -->
              <div v-show="!isLoading" id="viewer" class="pdfViewer" />
              <pep-pharos-loading-spinner v-if="isLoading" />
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style lang="scss">
// PDF.js defines these rules using native CSS nesting, which Chrome only supports from version 112.
// Keep the fallback selectors unnested and this style block unscoped so they match the layer
// elements that PDF.js creates dynamically. They are harmlessly redundant in newer browsers.
.textLayer span,
.textLayer br {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
  user-select: text;
}

// The text layer is rendered on top of the canvas layer, so it must be positioned and sized to match.
.canvasWrapper {
  overflow: hidden;
  width: 100%;
  height: 100%;
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    display: block;
    width: 100%;
    height: 100%;
    contain: content;
  }
  .selection {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: rgb(0 90 255 / 0.22);
  }
}

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
  // Fallback for devices that don't support vh (e.g. Android WebView).
  // --vh is set via JS in main.ts.
  min-height: 1100px;
  min-height: 100vh;
  min-height: calc(var(--vh, 1vh) * 100);
  height: 100%;
  height: 100vh;
  height: 100dvh;
  height: calc(var(--vh, 1vh) * 100);
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
  height: calc(var(--vh, 1vh) * 95);
  &.full-screen {
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
    min-height: 100%;
    min-width: 100%;
  }
}
</style>
