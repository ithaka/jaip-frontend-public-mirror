import type { Ref } from 'vue'
import {
  ViewerDiagnosticActions,
  type ViewerDiagnostics,
  type ViewerIndexedFields,
  type ViewerLogContext,
  type ViewerPhase,
  type ViewerSessionSnapshot,
} from '@/interfaces/Viewer'
import {
  clearPDFSessionMarker,
  getErrorDetails,
  getMemoryDiagnostics,
  getPDFEnvironmentDiagnostics,
  getViewerDeviceFacts,
  readPDFSessionMarker,
  writePDFSessionMarker,
} from '@/utils/viewers'
import { isLocalStorageAvailable } from '@/utils/storage'

const PAGE_RENDER_STALL_MS = 15_000
const SLOW_LOAD_MS = 30_000
const SESSION_HEARTBEAT_MS = 10_000
// Caps keep a failing device from flooding the log endpoint.
const MAX_STALL_LOGS = 5
const MAX_WINDOW_ERROR_LOGS = 5

type LogDiagnostic = (
  action: ViewerDiagnosticActions,
  details?: ViewerDiagnostics,
  indexed?: ViewerIndexedFields,
) => void

/**
 * Tracks the PDF viewer's phase, timing, and render progress, sends its diagnostic logs, and keeps
 * a crash marker so a killed page can be reported on the next load.
 */
export const usePDFViewerDiagnostics = (options: {
  iid: Ref<string>
  eventUuid: string
  log: LogDiagnostic
  isRetry: () => boolean
  hadError: () => boolean
}) => {
  const { log } = options
  const mountedAt = performance.now()
  const sessionStartedAt = Date.now()
  const deviceFacts = getViewerDeviceFacts()
  // Checked once; without storage, crash detection is off and pdf_environment reports it.
  const hasLocalStorage = isLocalStorageAvailable()

  let phase: ViewerPhase = 'configuring_worker'
  let loadStartedAt = 0
  let bytesLoaded: number | undefined
  let bytesTotal: number | undefined
  let pagesRenderStarted = 0
  let pagesRendered = 0
  let stallLogCount = 0
  let windowErrorLogCount = 0
  let hasLoggedFirstPageRendered = false
  let hiddenAt: number | null = null
  // Renders PDF.js has started but not finished, by page number.
  const pendingPageRenders = new Map<
    number,
    { startedAt: number; timer: ReturnType<typeof setTimeout> }
  >()
  let removeLifecycleListeners: (() => void) | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  /** Merged into every viewer error and diagnostic log. */
  const getContext = (): ViewerLogContext => {
    const { js_heap_used_mb, js_heap_limit_mb } = getMemoryDiagnostics()
    return {
      indexed: {
        viewer_type: 'pdf',
        viewer_phase: phase,
        viewer_visibility: document.visibilityState,
        js_heap_used_mb,
        ...deviceFacts,
      },
      details: {
        ms_since_mount: Math.round(performance.now() - mountedAt),
        is_retry: options.isRetry(),
        bytes_loaded: bytesLoaded,
        bytes_total: bytesTotal,
        pages_render_started: pagesRenderStarted,
        pages_rendered: pagesRendered,
        js_heap_limit_mb,
      },
    }
  }

  /** Read by the parent view when the reader switches viewers, to log whether this one was failing. */
  const getSnapshot = (): ViewerSessionSnapshot => ({
    phase,
    hadError: options.hadError(),
    stallCount: stallLogCount,
    retried: options.isRetry(),
    msInViewer: Math.round(performance.now() - mountedAt),
    pagesRendered,
  })

  /** Saves the last known state so a killed page leaves a trace. */
  const writeSessionMarker = () => {
    if (!hasLocalStorage) return
    writePDFSessionMarker({
      event_uuid: options.eventUuid,
      iid: options.iid.value,
      started_at: sessionStartedAt,
      last_beat_at: Date.now(),
      phase,
      visibility: document.visibilityState,
      pages_rendered: pagesRendered,
      js_heap_used_mb: getMemoryDiagnostics().js_heap_used_mb,
    })
  }

  /** Changes phase and saves it to the crash marker. */
  const setPhase = (next: ViewerPhase) => {
    phase = next
    writeSessionMarker()
  }

  /** Reports a marker left by a session that never exited cleanly (app kill or crash). */
  const reportPreviousUncleanSession = () => {
    if (!hasLocalStorage) return
    const previous = readPDFSessionMarker()
    if (!previous || previous.event_uuid === options.eventUuid) return
    log(
      ViewerDiagnosticActions.previous_session_unclean,
      {
        previous_event_uuid: previous.event_uuid,
        previous_iid: previous.iid,
        previous_phase: previous.phase,
        previous_pages_rendered: previous.pages_rendered,
        previous_js_heap_used_mb: previous.js_heap_used_mb,
        previous_session_age_s: Math.round((previous.last_beat_at - previous.started_at) / 1000),
        ms_since_previous_beat: Date.now() - previous.last_beat_at,
      },
      { previous_visibility: previous.visibility },
    )
  }

  /** Logs page lifecycle changes and uncaught errors, and keeps the crash marker fresh. */
  const startLifecycleDiagnostics = () => {
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === 'hidden'
      if (isHidden) hiddenAt = Date.now()
      log(isHidden ? ViewerDiagnosticActions.page_hidden : ViewerDiagnosticActions.page_visible, {
        hidden_for_ms: !isHidden && hiddenAt ? Date.now() - hiddenAt : undefined,
      })
      if (!isHidden) hiddenAt = null
      writeSessionMarker()
    }
    const logLifecycle = (action: ViewerDiagnosticActions) => () => {
      log(action)
      writeSessionMarker()
    }
    const handleFreeze = logLifecycle(ViewerDiagnosticActions.page_frozen)
    const handleResume = logLifecycle(ViewerDiagnosticActions.page_resumed)
    const handlePageHide = (event: PageTransitionEvent) => {
      log(ViewerDiagnosticActions.page_hide, { persisted: event.persisted })
      // A persisted page may be restored, so only a real unload is a clean exit.
      if (!event.persisted) clearPDFSessionMarker(options.eventUuid)
    }
    const logWindowError = (message: string, details?: ViewerDiagnostics) => {
      if (windowErrorLogCount++ >= MAX_WINDOW_ERROR_LOGS) return
      log(ViewerDiagnosticActions.window_error, { error_message: message, ...details })
    }
    const handleWindowError = (event: ErrorEvent) =>
      logWindowError(event.message, { error_source: event.filename, error_line: event.lineno })
    const handleUnhandledRejection = (event: PromiseRejectionEvent) =>
      logWindowError(getErrorDetails(event.reason).message)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('freeze', handleFreeze)
    document.addEventListener('resume', handleResume)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    if (hasLocalStorage) heartbeatTimer = setInterval(writeSessionMarker, SESSION_HEARTBEAT_MS)
    removeLifecycleListeners = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('freeze', handleFreeze)
      document.removeEventListener('resume', handleResume)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  /** Logged before any support check so unsupported devices still report what they are. */
  const logEnvironment = (details: ViewerDiagnostics) =>
    log(ViewerDiagnosticActions.environment, {
      ...getPDFEnvironmentDiagnostics(),
      local_storage_available: hasLocalStorage,
      ...details,
    })

  /** Begins watching the page and checks for a session that never exited cleanly. */
  const start = () => {
    reportPreviousUncleanSession()
    startLifecycleDiagnostics()
    writeSessionMarker()
  }

  /** Stops watching. Safe to call more than once. */
  const stop = () => {
    // Reaching here from an error leaves the reader on the error UI, so the session is over either way.
    if (phase !== 'ready') phase = 'failed'
    removeLifecycleListeners?.()
    removeLifecycleListeners = null
    clearPDFSessionMarker(options.eventUuid)
  }

  /** Starts a load attempt, including the retry, and resets its counters. */
  const loadStarted = () => {
    setPhase('loading_document')
    loadStartedAt = performance.now()
    bytesLoaded = undefined
    bytesTotal = undefined
    pagesRenderStarted = 0
    pagesRendered = 0
    hasLoggedFirstPageRendered = false
    log(ViewerDiagnosticActions.load_started)
  }

  /** Progress is not logged on its own; it rides along in the context of later logs. */
  const setProgress = (loaded: number, total: number) => {
    bytesLoaded = loaded
    bytesTotal = total
  }

  /** Logs once if the download is still running after a while; returns a cancel function. */
  const watchSlowLoad = () => {
    const timer = setTimeout(() => {
      log(ViewerDiagnosticActions.load_slow, {
        waited_ms: Math.round(performance.now() - loadStartedAt),
      })
    }, SLOW_LOAD_MS)
    return () => clearTimeout(timer)
  }

  const documentLoaded = (details: { numPages: number; workerIsReal: boolean }) => {
    setPhase('initializing_pages')
    log(ViewerDiagnosticActions.document_loaded, {
      load_ms: Math.round(performance.now() - loadStartedAt),
      num_pages: details.numPages,
      worker_is_real: details.workerIsReal,
    })
  }

  const pagesInitialized = () => {
    setPhase('ready')
    log(ViewerDiagnosticActions.pages_initialized)
  }

  /** Starts a stall timer; a blank page never reaches the rendered event. */
  const renderStarted = (pageNumber: number) => {
    pagesRenderStarted++
    if (pendingPageRenders.has(pageNumber)) return
    const startedAt = performance.now()
    const timer = setTimeout(() => {
      if (stallLogCount++ >= MAX_STALL_LOGS) return
      log(ViewerDiagnosticActions.page_render_stalled, {
        page_number: pageNumber,
        stalled_ms: Math.round(performance.now() - startedAt),
      })
    }, PAGE_RENDER_STALL_MS)
    pendingPageRenders.set(pageNumber, { startedAt, timer })
  }

  /** Clears the stall timer and logs the first page that renders. */
  const renderFinished = (pageNumber: number, error?: unknown) => {
    const pending = pendingPageRenders.get(pageNumber)
    if (pending) {
      clearTimeout(pending.timer)
      pendingPageRenders.delete(pageNumber)
    }
    if (error) return
    pagesRendered++
    if (hasLoggedFirstPageRendered) return
    hasLoggedFirstPageRendered = true
    log(ViewerDiagnosticActions.first_page_rendered, {
      page_number: pageNumber,
      render_ms: pending ? Math.round(performance.now() - pending.startedAt) : undefined,
      ms_since_load_start: Math.round(performance.now() - loadStartedAt),
    })
  }

  /** Stops stall timers for the current document attempt. */
  const clearRenderWatchdogs = () => {
    for (const { timer } of pendingPageRenders.values()) clearTimeout(timer)
    pendingPageRenders.clear()
  }

  return {
    getContext,
    getSnapshot,
    setPhase,
    logEnvironment,
    start,
    stop,
    loadStarted,
    setProgress,
    watchSlowLoad,
    documentLoaded,
    pagesInitialized,
    renderStarted,
    renderFinished,
    clearRenderWatchdogs,
  }
}
