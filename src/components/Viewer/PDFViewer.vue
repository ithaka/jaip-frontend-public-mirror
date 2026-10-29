<script setup lang="ts">
import {
  ref,
  shallowRef,
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
  trackPDFResourceDisposal,
  waitForPDFResourceDisposal,
  lockBodyScroll,
  unlockBodyScroll,
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
import {
  ViewerControls,
  type ViewerError,
  type PDFLoadingTask,
  type PDFDocumentProxy,
  type PDFResource,
  type DisposablePDFViewer,
  type DisposablePDFViewerOptions,
  type PDFPageRenderEvent,
  type PDFLoadingTaskWorkerOwner,
  type PDFWorkerImageMessage,
} from '@/interfaces/Viewer'

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
// XFA is not needed for this read-only viewer and requires PDF.js to build an additional document
// representation. Keep it disabled to reduce peak memory use on constrained devices.
const ENABLE_XFA = false
const DEFAULT_SCALE_DELTA = 1.1
const MIN_SCALE = 0.25
const MAX_SCALE = 10.0
// Limit page surfaces to about 8 MiB of RGBA pixels; source-image decoding can allocate more.
const MAX_CANVAS_PIXELS = 2_097_152
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

/** Version-scoped asset root keeps cached decoders, CMaps, and fonts aligned with PDF.js. */
const PDF_RESOURCE_URL = `${import.meta.env.BASE_URL}scripts/pdfjs/${pdfjsLib.version}/`
/**
 * Decoder directory includes JavaScript fallbacks for devices where WebAssembly is disabled.
 * PDF.js appends decoder filenames, so the trailing slash is required.
 */
const WASM_URL = `${PDF_RESOURCE_URL}wasm/`

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
// Readiness gates controls without keeping the measurable PDF surface hidden until first paint.
const isDocumentReady = ref(false)
let hasStartedViewingSession = false
// Holds download and parsing failures in the shared shape used by the error UI and logger.
const loadingError = ref<ViewerError>({
  message: '',
  status: false,
  code: 0,
})

const route = useRoute()
const routeName = ref(route.name)
const isReentryContent = computed(() => routeName.value === 'collection item')
// Deep Vue proxies break PDF.js private fields. Only replacement of these objects is reactive.
const pdfView = shallowRef({}) as Ref<viewer.PDFViewer>
const pdfDocument = shallowRef<PDFDocumentProxy>()

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
    return {
      message: typeof error.message === 'string' ? error.message : String(err),
      ...(typeof error.name === 'string' && { name: error.name }),
      ...(typeof error.stack === 'string' && { stack: error.stack }),
    }
  }

  return { message: typeof err === 'string' ? err : String(err) }
}

/**
 * Reads a real response status without assuming PDF.js errors share the browser's Error prototype.
 *
 * @param error - A loading, initialization, or rendering failure.
 * @returns The reported HTTP status, or zero when no HTTP response status is available.
 */
const getErrorCode = (error: unknown): number =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof error.status === 'number'
    ? error.status
    : 0

// The viewerEventBus is used to listen for events from the PDF viewer.
// It is set when the viewer is created and cleared when the component is unmounted.
// The removeWindowResizeListener function is used to remove the window resize event
// listener when the component is unmounted to prevent memory leaks.
const viewerEventBus = shallowRef<viewer.EventBus | null>(null)
let removeWindowResizeListener: (() => void) | null = null
let removeViewerEventBusListeners: (() => void) | null = null
let removeRetryPagesInitListener: (() => void) | null = null
let removeImageDecodeListener: (() => void) | null = null

// The source URL is retained so a failed render can reload the same document with safer options.
let activePDFSourceUrl: string | null = null

// Ensures an OffscreenCanvas failure triggers at most one full-document retry.
let hasRetriedWithoutOffscreenCanvas = false

// Prevents render-error events produced during replacement from starting overlapping retries.
let isRetryingWithoutOffscreenCanvas = false

// Component-owned refs avoid finding another viewer instance through a document-wide ID lookup.
const viewerContainer = useTemplateRef<HTMLDivElement>('viewerContainer')
const viewerElement = useTemplateRef<HTMLDivElement>('viewerElement')

// Keep the owning task after loading so both pending and attached documents have one cleanup path.
let activeLoadingTask: PDFLoadingTask | null = null
let activePDFViewer: DisposablePDFViewer | null = null
let isUnmounted = false
// Terminal disposal also blocks late callbacks while the component remains mounted on its error UI.
let isViewerDisposed = false
// This signal belongs to the viewer instance, not a document attempt; retries must not abort it.
let viewerLifetime: AbortController | null = null
// All cleanup callers await the same destruction, including its rejection, before replacing a task.
const disposalPromises = new WeakMap<PDFLoadingTask, Promise<void>>()

/**
 * Releases a resource through its raw owning task, sharing completion across repeated calls.
 *
 * @param resource - A loaded document, pending task, or empty state during teardown.
 * @returns Worker/request destruction completion; rejects if destruction fails.
 */
const disposePDFResource = (resource: PDFResource): Promise<void> => {
  // Resolve the owner before accessing private-field-bearing PDF.js methods or worker properties.
  const rawResource = toRaw(resource)
  const loadingTask =
    rawResource && 'loadingTask' in rawResource ? toRaw(rawResource.loadingTask) : rawResource
  if (!loadingTask) return Promise.resolve()
  const pendingDisposal = disposalPromises.get(loadingTask)
  if (pendingDisposal) return pendingDisposal
  // A deferred call also turns a synchronous destroy() exception into an observed rejection.
  const disposal = Promise.resolve().then(() => loadingTask.destroy())
  disposalPromises.set(loadingTask, disposal)
  trackPDFResourceDisposal(disposal)
  return disposal
}

const { handleWithLog, logs } = useLogger()
const {
  errorLinkClickLog,
  viewerControlLog,
  pageSelectionLog,
  startPDFViewingSessionLog,
  endPDFViewingSessionLog,
  PDFViewerErrorLog,
  PDFViewerLoadingCancelledLog,
} = logs.getPDFViewerLogs({
  iid: itemid,
  isReentryContent: isReentryContent,
  viewer: pdfView,
  documentProxy: pdfDocument,
})

/**
 * Records cleanup failures even when navigation has already removed the viewer UI.
 *
 * @param error - A rejected resource-destruction or document-detachment operation.
 */
const logCleanupError = (error: unknown) => {
  const details = getErrorDetails(error)
  void handleWithLog(
    PDFViewerErrorLog({
      error: {
        ...details,
        message: `Unable to release PDF resources: ${details.message}`,
        status: true,
        code: 0,
      },
      source: 'PDFViewer.vue:logCleanupError',
    }),
  )
}

/**
 * Detaches document-owned listeners and pages before awaiting destruction of their worker.
 * Leaves instance-owned resize/scroll listeners intact so a retry can reuse the viewer.
 *
 * @returns Cleanup completion; a rejection prevents starting a replacement worker.
 */
const releasePDFDocument = async () => {
  isDocumentReady.value = false
  removeRetryPagesInitListener?.()
  removeRetryPagesInitListener = null
  removeImageDecodeListener?.()
  removeImageDecodeListener = null
  // Snapshot ownership before clearing the UI ref; the task remains tracked until destruction ends.
  const resource = activeLoadingTask ?? pdfDocument.value
  pdfDocument.value = undefined
  try {
    activePDFViewer?.setDocument(null)
  } finally {
    await disposePDFResource(resource)
    if (activeLoadingTask === resource) activeLoadingTask = null
  }
}

/** Permanently stops this viewer, unlocks fullscreen, and logs asynchronous resource cleanup errors. */
const disposeViewer = () => {
  isViewerDisposed = true
  isUsingCSSFullscreen.value = false
  isInFullscreen.value = false
  unlockBodyScroll()
  viewerLifetime?.abort()
  removeWindowResizeListener?.()
  removeWindowResizeListener = null
  removeViewerEventBusListeners?.()
  removeViewerEventBusListeners = null
  void releasePDFDocument().catch(logCleanupError)
}

onBeforeUnmount(() => {
  // Set this before cleanup so promise rejections caused by destroy() are treated as cancellation.
  isUnmounted = true
  removeFullscreenChangeListeners(handleFullscreenChange)
  if (hasStartedViewingSession) handleWithLog(endPDFViewingSessionLog)
  // In case the viewer unmounts (the user navigates away) while CSS fullscreen is still active.
  unlockBodyScroll()

  disposeViewer()
  activePDFViewer = null
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
  let loadingTask: PDFLoadingTask | null = null
  try {
    const didPreviousDisposalFinish = await waitForPDFResourceDisposal()
    if (isUnmounted || isViewerDisposed) return undefined
    // A worker that will not terminate must not block reading; the new load overlaps it instead.
    if (!didPreviousDisposalFinish) {
      void handleWithLog(
        PDFViewerErrorLog({
          error: {
            message: 'The previous PDF worker did not finish disposal; loading anyway.',
            status: false,
            code: 0,
          },
          source: 'PDFViewer.vue:createLoadingTask',
        }),
        () => {},
      )
    }
    loadingTask = pdfjsLib.getDocument({
      url: src,
      enableXfa: ENABLE_XFA,
      withCredentials: true,
      wasmUrl: WASM_URL,
      // These packed maps and replacement fonts are fetched only when the PDF needs them.
      cMapUrl: `${PDF_RESOURCE_URL}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${PDF_RESOURCE_URL}standard_fonts/`,
      useWasm: false,
      useWorkerFetch: true,
      // The PDF endpoint will support optional byte ranges. These flags will disable streaming
      // and prefetching the rest of the document so PDF.js retains only the chunks needed for the pages the user opens.
      disableStream: true,
      disableAutoFetch: true,
      canvasMaxAreaInBytes: MAX_CANVAS_PIXELS * 4,
      stopAtErrors: true,
      // This disables only Chromium's native ImageDecoder on affected versions. PDF images remain
      // enabled and are decoded through PDF.js's WASM/JavaScript fallback implementation.
      // The single render-failure retry also forces this off: WebView builds can misreport their
      // Chromium version, so a render failure past the version threshold may still be an
      // ImageDecoder bug rather than an OffscreenCanvas one.
      isImageDecoderSupported: !DISABLE_IMAGE_DECODER && !disableOffscreenCanvas,
      ...(disableOffscreenCanvas && { isOffscreenCanvasSupported: false }),
    })
    activeLoadingTask = loadingTask
    const document = await loadingTask.promise
    if (isUnmounted || isViewerDisposed) {
      await disposePDFResource(loadingTask)
      return undefined
    }
    return document
  } catch (err) {
    // destroy() rejects the loading promise as part of normal component teardown.
    if (isUnmounted || isViewerDisposed || loadingTask?.destroyed) {
      handleWithLog(
        PDFViewerLoadingCancelledLog({
          reason: isUnmounted ? 'component_unmounted' : 'loading_task_destroyed',
          error: { ...getErrorDetails(err), status: false, code: getErrorCode(err) },
        }),
        () => {},
      )
      return undefined
    }

    const errorDetails = getErrorDetails(err)
    const errorCode = getErrorCode(err)
    if (errorCode) {
      if (errorCode === 404) {
        loadingError.value = {
          ...errorDetails,
          message: `Not Found: ${errorDetails.message}`,
          status: true,
          code: errorCode,
        }
      } else if (errorCode === 200 && errorDetails.name === 'InvalidPDFException') {
        loadingError.value = {
          ...errorDetails,
          message: `Unable to retrieve PDF document: ${errorDetails.message}`,
          status: true,
          code: errorCode,
        }
      } else {
        loadingError.value = {
          ...errorDetails,
          message: `Server Error: ${errorDetails.message}`,
          status: true,
          code: errorCode,
        }
      }
    } else {
      loadingError.value = {
        ...errorDetails,
        message: `Unknown Error: ${errorDetails.message}`,
        status: true,
        code: 0,
      }
    }
    handleWithLog(
      PDFViewerErrorLog({
        error: { ...loadingError.value },
        source: 'PDFViewer.vue:createLoadingTask',
      }),
      () => {},
    )
    disposeViewer()
  } finally {
    if (!isUnmounted) isLoading.value = false
  }
}

/**
 * Retries a recoverable asynchronous render failure once with OffscreenCanvas/ImageDecoder disabled.
 * Transport, allocation, and invalid-document errors stop immediately. PDF loading can succeed
 * before rendering fails; recovery releases the old worker before loading a replacement and
 * restores the reader's page after initialization.
 *
 * @param err - The rendering failure reported by the PDF.js event bus.
 * @param errorSource - The observer or event handler that detected the failure.
 */
const handlePageRenderError = async (err: unknown, errorSource: string) => {
  // Several page renders may fail together; only the first event should control replacement.
  if (isUnmounted || isViewerDisposed || isRetryingWithoutOffscreenCanvas) return

  const errorDetails = getErrorDetails(err)
  const errorCode = getErrorCode(err)
  // Decoder settings cannot repair transport, memory exhaustion, or invalid-document failures.
  const isTerminalError =
    errorCode >= 400 ||
    /failed to fetch|fetch failed|network(?:error| request failed)|load failed/i.test(
      errorDetails.message,
    ) ||
    errorDetails.name === 'NetworkError' ||
    /allocation failed|out of memory|invalid (?:typed )?array (?:buffer|length)|array buffer allocation/i.test(
      errorDetails.message,
    ) ||
    ['InvalidPDFException', 'MissingPDFException', 'PasswordException'].includes(
      errorDetails.name ?? '',
    )
  // A second failure is terminal because repeating the same fallback would create a retry loop.
  if (isTerminalError || hasRetriedWithoutOffscreenCanvas || !activePDFSourceUrl) {
    preparePageError.value = {
      ...errorDetails,
      message: `Unable to render the PDF document: ${errorDetails.message}`,
      status: true,
      code: errorCode,
    }
    handleWithLog(
      PDFViewerErrorLog({ error: { ...preparePageError.value }, source: errorSource }),
      () => {},
    )
    disposeViewer()
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
      source: errorSource,
    }),
    () => {},
  )

  try {
    const pdfViewer = toRaw(pdfView.value)
    const previousPageNumber = pdfViewer.currentPageNumber || 1
    await releasePDFDocument()
    if (isUnmounted || isViewerDisposed) return
    const replacementDocument = await createLoadingTask(activePDFSourceUrl, {
      disableOffscreenCanvas: true,
    })
    if (!replacementDocument) return
    await nextTick()
    if (isUnmounted || isViewerDisposed) {
      await disposePDFResource(replacementDocument)
      return
    }

    // Wait for the replacement viewer to initialize before restoring the user's page position.
    const eventBus = viewerEventBus.value
    if (eventBus) {
      const handleReplacementPagesInit = () => {
        removeRetryPagesInitListener = null
        if (isUnmounted) return
        pdfViewer.currentPageNumber = Math.min(previousPageNumber, replacementDocument.numPages)
      }

      removeRetryPagesInitListener = () => {
        eventBus.off('pagesinit', handleReplacementPagesInit)
      }

      eventBus.on('pagesinit', handleReplacementPagesInit, { once: true })
    }
    pdfDocument.value = replacementDocument
    observePageRequests(replacementDocument)
    observeImageDecoding(replacementDocument)
    pdfViewer.setDocument(replacementDocument)
    observeDocumentInitialization(pdfViewer, replacementDocument)
  } catch (retryError) {
    if (isUnmounted) return

    const retryErrorDetails = getErrorDetails(retryError)
    preparePageError.value = {
      ...retryErrorDetails,
      message: `Unable to render the PDF document without OffscreenCanvas or ImageDecoder: ${retryErrorDetails.message}`,
      status: true,
      code: 0,
    }
    handleWithLog(
      PDFViewerErrorLog({
        error: { ...preparePageError.value },
        source: 'PDFViewer.vue:handlePageRenderError.retry',
      }),
      () => {},
    )
    disposeViewer()
  } finally {
    isRetryingWithoutOffscreenCanvas = false
  }
}

/**
 * Observes asynchronous initialization that setDocument's synchronous return cannot report.
 *
 * @param pdfViewer - The viewer receiving this document attempt.
 * @param document - Identity used to ignore failures from superseded attempts.
 */
const observeDocumentInitialization = (pdfViewer: viewer.PDFViewer, document: PDFDocumentProxy) => {
  void pdfViewer.pagesPromise?.catch((error: unknown) => {
    if (!isUnmounted && pdfDocument.value === document)
      void handlePageRenderError(error, 'PDFViewer.vue:observeDocumentInitialization')
  })
}

/**
 * Observes lazy-page failures that PDF.js otherwise handles with a console-only error.
 * First-page failures reach pagesPromise before recovery can reset PDF.js's initialization state.
 *
 * @param document - The raw document whose page requests should reach the viewer's error handler.
 */
const observePageRequests = (document: PDFDocumentProxy) => {
  // Preserve the original receiver and rejection contract while adding per-document observation.
  const getPage = document.getPage.bind(document)
  /** Fetches a page, reporting failures only while this document is still active. */
  document.getPage = async (pageNumber: number) => {
    try {
      return await getPage(pageNumber)
    } catch (error) {
      if (pageNumber !== 1 && !isUnmounted && pdfDocument.value === document) {
        void handlePageRenderError(
          error,
          `PDFViewer.vue:observePageRequests.getPage(${pageNumber})`,
        )
      }
      throw error
    }
  }
}

/**
 * Records that image-decode observation could not start; the document still renders without it.
 *
 * @param reason - Why the observer could not attach to PDF.js's worker port.
 */
const logImageObservationUnavailable = (reason: string) => {
  void handleWithLog(
    PDFViewerErrorLog({
      error: {
        message: `${reason}; image observation is off.`,
        status: false,
        code: 0,
      },
      source: 'PDFViewer.vue:observeImageDecoding',
    }),
    () => {},
  )
}

/**
 * Reports missing image results that PDF.js otherwise consumes as non-fatal decoder warnings.
 * The installed PDF.js sends null Image data through obj/commonobj even with stopAtErrors enabled.
 * Observe its existing port without changing transport delivery, including the fake-worker port.
 * This is best-effort diagnostics: the port is a private PDF.js field, so a missing or unusable port
 * is logged and skipped rather than failing a document that would otherwise render.
 *
 * @param document - Loaded document whose worker and identity own this removable observer.
 */
const observeImageDecoding = (document: PDFDocumentProxy) => {
  const task = document.loadingTask
  const port = (task as unknown as PDFLoadingTaskWorkerOwner)._worker?.port
  if (!port) {
    logImageObservationUnavailable('The PDF image-decoding message port is unavailable')
    return
  }

  const handleImageMessage = ({ data: message }: MessageEvent<PDFWorkerImageMessage | null>) => {
    if (!message || message.targetName !== task.docId || !Array.isArray(message.data)) return
    const data = message.data
    const isPageImage = message.action === 'obj' && data[2] === 'Image' && data[3] === null
    const isSharedImage = message.action === 'commonobj' && data[1] === 'Image' && data[2] === null
    if ((!isPageImage && !isSharedImage) || typeof data[0] !== 'string') return

    const pageNumber = isPageImage && typeof data[1] === 'number' ? data[1] + 1 : undefined
    const error = new Error(
      `PDF.js could not decode image "${data[0]}"${pageNumber ? ` on page ${pageNumber}` : ''}. The rendered content is incomplete.`,
    )
    error.name = 'PDFImageDecodeError'
    queueMicrotask(() => {
      if (!isUnmounted && !isViewerDisposed && pdfDocument.value === document) {
        void handlePageRenderError(error, 'PDFViewer.vue:observeImageDecoding.handleImageMessage')
      }
    })
  }

  try {
    port.addEventListener('message', handleImageMessage)
  } catch (error) {
    logImageObservationUnavailable(
      `The PDF image-decoding message port rejected the listener: ${getErrorDetails(error).message}`,
    )
    return
  }
  removeImageDecodeListener = () => port.removeEventListener('message', handleImageMessage)
}

// PDF VIEWER CREATION
// Holds viewer-construction failures in the shared shape used by the error UI and logger.
const createViewerError = ref<ViewerError>({
  message: '',
  status: false,
  code: 0,
})
/** Creates the component-owned PDF.js instance and registers removable rendering/control listeners. */
const createViewer = () => {
  try {
    const container = viewerContainer.value
    const viewerNode = viewerElement.value
    if (!container || !viewerNode) {
      // A missing element after navigation is expected; while mounted it indicates a real template
      // or lifecycle problem and should still be reported.
      if (isUnmounted) return undefined
      throw new Error('The PDF viewer DOM elements are not mounted.')
    }
    const eventBus = new viewer.EventBus()
    viewerLifetime = new AbortController()

    // This needs to be set on the viewerEventBus ref so that it can be accessed in the onBeforeUnmount hook to remove the resize listener.
    viewerEventBus.value = eventBus
    // Disable unused auxiliary surfaces and retain a bounded page canvas on constrained tablets.
    const viewerOptions: DisposablePDFViewerOptions = {
      container,
      viewer: viewerNode,
      eventBus,
      annotationMode: pdfjsLib.AnnotationMode.DISABLE,
      annotationEditorMode: pdfjsLib.AnnotationEditorType.DISABLE,
      abortSignal: viewerLifetime.signal,
      maxCanvasPixels: MAX_CANVAS_PIXELS,
      enableDetailCanvas: false,
      enableOptimizedPartialRendering: false,
      imagesRightClickMinSize: -1,
    }
    const pdfViewer = new viewer.PDFViewer(viewerOptions) as DisposablePDFViewer

    // Keep these listener callbacks named so the same references can be removed via eventBus.off.
    const handlePagesLoaded = () => setLegacyViewerDimensions(pdfViewer)
    const handlePageRender = ({ source }: { source: viewer.PDFPageView }) =>
      setLegacyPageDimensions(source)
    /** Refreshes legacy text dimensions and reports errors only from the active page view. */
    const handleTextLayerRendered = ({ source, error }: PDFPageRenderEvent) => {
      if (source.id === null || source !== pdfViewer.getPageView(source.id - 1)) return
      setLegacyPageDimensions(source)
      if (error)
        void handlePageRenderError(error, 'PDFViewer.vue:createViewer.handleTextLayerRendered')
    }
    const handleXFALayerRendered = ({ source }: { source: viewer.PDFPageView }) =>
      setLegacyPageDimensions(source)
    const handleScaleChanging = () => setLegacyViewerDimensions(pdfViewer)
    const handleRotationChanging = () => setLegacyViewerDimensions(pdfViewer)
    // Remember accepted dimensions and the pending frame to avoid repeated app-switch/resize redraws.
    let { width: lastViewerWidth, height: lastViewerHeight } = container.getBoundingClientRect()
    let resizeFrame: number | null = null
    /** Refits only when a live, visible container has actually changed size. */
    const handleResize = () => {
      // A zero-size background/hidden surface must not replace the last usable viewport dimensions.
      const { width, height } = container.getBoundingClientRect()
      if (
        isUnmounted ||
        isViewerDisposed ||
        width <= 0 ||
        height <= 0 ||
        (width === lastViewerWidth && height === lastViewerHeight)
      )
        return
      lastViewerWidth = width
      lastViewerHeight = height
      pdfViewer.currentScaleValue = 'page-fit'
      fitHeight.value = true
    }
    const handlePagesInit = async () => {
      if (isUnmounted || isViewerDisposed) return
      const initializedDocument = pdfDocument.value
      isDocumentReady.value = true
      await nextTick()
      if (isUnmounted || isViewerDisposed || pdfDocument.value !== initializedDocument) return
      const { width, height } = container.getBoundingClientRect()
      lastViewerWidth = width
      lastViewerHeight = height
      setLegacyViewerDimensions(pdfViewer)
      pdfViewer.currentScaleValue = 'page-fit'
      fitHeight.value = true
      // This is logged here because this event indicates that the viewer is fully initialized,
      // so we can reasonably assume that the user is now viewing the PDF.
      if (!hasStartedViewingSession) {
        hasStartedViewingSession = true
        handleWithLog(startPDFViewingSessionLog)
      }
    }
    /** Routes current-page render failures to recovery, ignoring events from replaced documents. */
    const handlePageRendered = ({ source, error }: PDFPageRenderEvent) => {
      if (source.id === null || source !== pdfViewer.getPageView(source.id - 1)) return
      if (error) void handlePageRenderError(error, 'PDFViewer.vue:createViewer.handlePageRendered')
    }
    /** Releases distant offscreen surfaces after navigation updates the visible page positions. */
    const handleViewAreaUpdate = () => {
      // PDF.js normally caches at least ten pages; only inspect that small cache, not the whole PDF.
      const bounds = container.getBoundingClientRect()
      const cachedPages: Set<viewer.PDFPageView> = pdfViewer.getCachedPageViews()
      for (const page of cachedPages) {
        if (page.id === null || Math.abs(page.id - pdfViewer.currentPageNumber) <= 1) continue
        const pageBounds = page.div.getBoundingClientRect()
        if (pageBounds.bottom <= bounds.top || pageBounds.top >= bounds.bottom) page.destroy()
      }
    }
    const handlePageChanging = ($event: { previous: number }) => {
      handleWithLog(
        pageSelectionLog({ previous_page: $event.previous }),
        () => paginationKey.value++,
      )
    }

    if (!SUPPORTS_CSS_ROUND) {
      // pagesloaded catches mixed-size documents after their individual viewports are known;
      // pagerender also covers lazily initialized pages before their canvas is drawn.
      eventBus.on('pagesloaded', handlePagesLoaded)
      eventBus.on('pagerender', handlePageRender)
      eventBus.on('xfalayerrendered', handleXFALayerRendered)
      // PDF.js updates viewports before these events; refresh the fixed pixel values after zooming
      // and after rotation swaps the page width and height.
      eventBus.on('scalechanging', handleScaleChanging)
      eventBus.on('rotationchanging', handleRotationChanging)
    }

    // In cases where the viewer size changes, the pdf needs to be re-fitted. We can use
    // the pdf.js event bus to listen for resize events and adjust the scale accordingly,
    // but we also need to dispatch resize events when the window is resized.
    /** Coalesces window resize bursts into one PDF.js event on the next animation frame. */
    const dispatchResizeEvent = () => {
      if (resizeFrame !== null) return
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null
        eventBus.dispatch('resize', {})
      })
    }
    window.addEventListener('resize', dispatchResizeEvent)
    // This is set on a variable so that it can be removed in the onBeforeUnmount hook to prevent memory leaks.
    /** Removes the external resize listener and cancels work queued before permanent disposal. */
    removeWindowResizeListener = () => {
      window.removeEventListener('resize', dispatchResizeEvent)
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame)
      resizeFrame = null
    }
    eventBus.on('resize', handleResize)

    // Set initial scale to fit page
    eventBus.on('pagesinit', handlePagesInit)

    // Rendering happens asynchronously after setDocument, so loading the document can succeed
    // even when a browser-specific canvas implementation later fails.
    eventBus.on('pagerendered', handlePageRendered)
    eventBus.on('textlayerrendered', handleTextLayerRendered)

    // Update pagination key on page change to force re-render of page number input
    eventBus.on('pagechanging', handlePageChanging)
    eventBus.on('updateviewarea', handleViewAreaUpdate)

    /** Unregisters component callbacks before PDF.js detaches pages or destroys its worker. */
    removeViewerEventBusListeners = () => {
      if (!SUPPORTS_CSS_ROUND) {
        eventBus.off('pagesloaded', handlePagesLoaded)
        eventBus.off('pagerender', handlePageRender)
        eventBus.off('xfalayerrendered', handleXFALayerRendered)
        eventBus.off('scalechanging', handleScaleChanging)
        eventBus.off('rotationchanging', handleRotationChanging)
      }
      eventBus.off('resize', handleResize)
      eventBus.off('pagesinit', handlePagesInit)
      eventBus.off('pagerendered', handlePageRendered)
      eventBus.off('textlayerrendered', handleTextLayerRendered)
      eventBus.off('pagechanging', handlePageChanging)
      eventBus.off('updateviewarea', handleViewAreaUpdate)
    }

    activePDFViewer = pdfViewer
    pdfView.value = pdfViewer
    return pdfViewer
  } catch (err) {
    if (isUnmounted) return undefined

    const errorDetails = getErrorDetails(err)
    createViewerError.value = {
      ...errorDetails,
      message: `An error occurred while creating the PDF viewer: ${errorDetails.message}`,
      status: true,
      code: 0,
    }
    handleWithLog(
      PDFViewerErrorLog({
        error: { ...createViewerError.value },
        source: 'PDFViewer.vue:createViewer',
      }),
      () => {},
    )
    // Returning no viewer lets preparePage stop instead of calling setDocument on a placeholder.
    return undefined
  }
}

// PDF PREPARATION
/** Holds compatibility, URL, worker, and document-attachment failures encountered during setup. */
const preparePageError = ref<ViewerError>({
  message: '',
  status: false,
  code: 0,
})

/**
 * Configures PDF.js's execution context. Firefox versions before 114 cannot parse module imports in
 * workers, so load PDF.js's WorkerMessageHandler into the page and let PDF.js use its supported
 * main-thread fallback there. Other browsers use an ESM bridge to the same polyfilled bundle so
 * PDF.js can also import its named handler if real-worker startup fails.
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

  /** Same-origin ESM bridge; the build ID refreshes it when the emitted worker bundle changes. */
  const bootstrapUrl = new URL(
    `${import.meta.env.BASE_URL}scripts/pdfjs/pdf-worker-bootstrap.mjs`,
    window.location.href,
  )
  bootstrapUrl.searchParams.set('bundle', new URL(pdfWorkerUrl, window.location.href).href)
  bootstrapUrl.searchParams.set('version', __APP_BUILD_ID__)
  pdfjsLib.GlobalWorkerOptions.workerSrc = bootstrapUrl.href
}

/**
 * Validates browser support and the source URL before configuring the bundled worker and creating
 * the PDF.js viewer. Unsupported devices are routed through the component's normal error UI rather
 * than leaving the surrounding view blank.
 */
const preparePage = async () => {
  if (isUnmounted) return
  let pendingDocument: PDFDocumentProxy | undefined

  // The legacy bundle still relies on a small set of APIs supplied by polyfills.
  if (props.enableViewer && !canUsePDFViewer()) {
    preparePageError.value = {
      ...getErrorDetails(new Error('The PDF viewer is not supported by this browser.')),
      status: true,
      code: 0,
    }
    handleWithLog(
      PDFViewerErrorLog({
        error: { ...preparePageError.value },
        source: 'PDFViewer.vue:preparePage.browserSupport',
      }),
      () => {},
    )
    return
  }

  const url = useValidDownloadURL(props.iid, props.collection, props.filename)
  if (!url) {
    preparePageError.value = {
      ...getErrorDetails(new Error('A valid URL could not be generated for the PDF document.')),
      status: true,
      code: 404,
    }
    handleWithLog(
      PDFViewerErrorLog({
        error: { ...preparePageError.value },
        source: 'PDFViewer.vue:preparePage.documentURL',
      }),
      () => {},
    )

    return
  }
  // The render fallback needs the resolved URL because props alone may not describe the final host.
  activePDFSourceUrl = url
  try {
    if (props.enableViewer) {
      await configurePDFJSWorker()
      if (isUnmounted) return

      const doc = await createLoadingTask(url)
      if (!doc) return
      pendingDocument = doc

      // #viewer is hidden via v-show while isLoading is true; PDF.js measures text-layer layout
      // (and caches the result forever) as soon as pages are created, so that DOM update must be
      // flushed first or those measurements are taken against a display:none ancestor.
      await nextTick()
      if (isUnmounted) {
        await disposePDFResource(doc)
        return
      }

      const pdfViewer = createViewer()
      if (!pdfViewer) {
        disposeViewer()
        return
      }

      pdfDocument.value = doc
      observePageRequests(doc)
      observeImageDecoding(doc)
      pdfViewer.setDocument(doc)
      observeDocumentInitialization(pdfViewer, doc)
      pendingDocument = undefined
    }
  } catch (err) {
    if (isUnmounted) return

    if (pendingDocument) {
      void disposePDFResource(pendingDocument).catch(logCleanupError)
      if (pdfDocument.value === pendingDocument) {
        pdfDocument.value = undefined
      }
    }

    const errorDetails = getErrorDetails(err)
    preparePageError.value = {
      ...errorDetails,
      message: `An error occurred while preparing the PDF viewer: ${errorDetails.message}`,
      status: true,
      code: 0,
    }
    handleWithLog(
      PDFViewerErrorLog({
        error: { ...preparePageError.value },
        source: 'PDFViewer.vue:preparePage',
      }),
      () => {},
    )
    disposeViewer()
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
/**
 * Navigates and logs only valid, in-range page selections while the document is ready.
 * @param page - One-based page number, including text entered in the page selector.
 */
const handlePageSelection = (page: number | string) => {
  /** Numeric candidate validated before passing it to PDF.js's page-number setter. */
  const pageNumber = Number(page)
  if (
    isDocumentReady.value &&
    Number.isInteger(pageNumber) &&
    pageNumber > 0 &&
    pageNumber <= (pdfDocument.value?.numPages ?? 0)
  ) {
    // This log happens here rather than in the click handler to ensure that we don't unnecessarily issue
    // logs when the page isn't actually valid.
    handleWithLog(
      pageSelectionLog({ previous_page: toRaw(pdfView.value).currentPageNumber }),
      () => {
        toRaw(pdfView.value).currentPageNumber = pageNumber
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
/**
 * Increases zoom once per requested tick without exceeding the maximum scale.
 * @param ticks - Positive integer number of zoom steps to apply to the ready document.
 */
const zoomIn = (ticks: number) => {
  if (!isDocumentReady.value || !Number.isInteger(ticks) || ticks < 1) return
  /** Accumulates rounded, bounded steps before committing the viewer's new scale. */
  let newScale = toRaw(pdfView.value).currentScale
  do {
    newScale = Number((newScale * DEFAULT_SCALE_DELTA).toFixed(2))
    newScale = Math.ceil(newScale * 10) / 10
    newScale = Math.min(MAX_SCALE, newScale)
  } while (--ticks && newScale < MAX_SCALE)
  toRaw(pdfView.value).currentScale = newScale
  fitHeight.value = false
}
/**
 * Decreases zoom once per requested tick without dropping below the minimum scale.
 * @param ticks - Positive integer number of zoom steps to apply to the ready document.
 */
const zoomOut = (ticks: number) => {
  if (!isDocumentReady.value || !Number.isInteger(ticks) || ticks < 1) return
  /** Accumulates rounded, bounded steps before committing the viewer's new scale. */
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
  unlockBodyScroll()
  toRaw(pdfView.value).currentScaleValue = 'page-fit'
}

/** Enters a viewport-filling CSS mode for browsers where native fullscreen cannot be used. */
const enterCSSFullscreen = () => {
  if (!viewerWrapper.value) return

  isUsingCSSFullscreen.value = true
  isInFullscreen.value = true
  lockBodyScroll()
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
    changeRoute(router, {
      emit,
      path: reentryPath.value,
      term: searchTerms.value,
      page: pageNo.value,
    }),
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
      <div
        v-else-if="loadingError.status && (loadingError.code === 200 || loadingError.code === 0)"
        class="error-container"
      >
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
      <div v-else-if="loadingError.code === 403 || preparePageError.code === 403">
        <div v-if="doc.is_restricted" class="error-container">
          <div class="error">
            <pep-pharos-heading
              :level="2"
              preset="4--bold"
              data-cy="item-unavailable"
              no-margin
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
          :class="[
            'viewer-wrapper',
            {
              'viewer-wrapper--full-screen': isInFullscreen,
              'viewer-wrapper--native-full-screen': isInFullscreen && !isUsingCSSFullscreen,
            },
          ]"
        >
          <div class="viewer-and-controls">
            <ControlBar
              v-if="isDocumentReady"
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
            <div class="viewer-body">
              <div id="viewer-container" ref="viewerContainer" tabindex="-1">
                <!-- Keep PDF.js's viewer node mounted while a document reloads. Replacing it with v-if
                 would invalidate the DOM references held by the existing PDFViewer instance. -->
                <div v-show="!isLoading" id="viewer" ref="viewerElement" class="pdfViewer" />
                <pep-pharos-loading-spinner v-if="isLoading" />
              </div>
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
    overflow: hidden;
    background-color: var(--pharos-color-black);
    display: flex;
    flex-direction: column;
    // iPadOS draws its status bar (time, date, battery) over native fullscreen content because the
    // viewport uses viewport-fit=cover. Inset the viewer below it; the inset is 0 where nothing overlays the page.
    --safe-area-top: env(safe-area-inset-top, 0px);
    box-sizing: border-box;
    padding-top: var(--safe-area-top);
    // Its min-height is a viewport unit; zero it so the box can shrink to fit below the inset.
    .viewer-and-controls {
      min-height: 0;
    }
  }
  // iOS also overlays its own exit button at the top left of native fullscreen content, which would
  // cover the first toolbar controls. ControlBar uses this inset to move them clear of it.
  &--native-full-screen {
    @supports (-webkit-touch-callout: none) {
      --fullscreen-exit-button-inset: 88px;
    }
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
  display: flex;
  flex-direction: column;
}

// Takes the height the toolbar leaves, so the scroll container is sized by layout instead of its own
// viewport-unit guess. Only .viewer-and-controls reads --vh (see its fallback chain above).
.viewer-body {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
}

#viewer-container {
  overflow: auto;
  // PDF.js requires its scroll container to be absolutely positioned.
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
