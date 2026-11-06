import type {
  PDFSessionMarker,
  ViewerDiagnostics,
  ViewerError,
  ViewerIndexedFields,
} from '@/interfaces/Viewer'

declare global {
  interface HTMLElement {
    webkitRequestFullscreen?: () => Promise<void> | void
    msRequestFullscreen?: () => Promise<void> | void
  }

  interface Document {
    mozCancelFullScreen?: () => Promise<void> | void
    webkitExitFullscreen?: () => Promise<void> | void
    msExitFullscreen?: () => Promise<void> | void
    webkitFullscreenElement?: Element | null
    mozFullScreenElement?: Element | null
    msFullscreenElement?: Element | null
  }

  interface Navigator {
    pdfViewerEnabled?: boolean
  }
}

type PromiseConstructorWithResolvers = PromiseConstructor & {
  withResolvers?: <T>() => {
    promise: Promise<T>
    resolve: (value: T | PromiseLike<T>) => void
    reject: (reason?: unknown) => void
  }
}

type AbortSignalConstructorWithAny = typeof AbortSignal & {
  any?: (signals: AbortSignal[]) => AbortSignal
}

let pendingPDFResourceDisposal: Promise<void> = Promise.resolve()

// Slow tablets can take a while to terminate a worker; past this, a replacement load goes ahead.
const PDF_RESOURCE_DISPOSAL_WAIT_MS = 3000

/**
 * Tracks task teardown across viewer instances. Failures are reported by the caller that owns the
 * disposal, so they must not reject the shared chain and block every later load.
 */
export const trackPDFResourceDisposal = (disposal: Promise<void>): void => {
  const settled = disposal.catch(() => {})
  pendingPDFResourceDisposal = Promise.all([pendingPDFResourceDisposal, settled]).then(() => {})
}

/**
 * Waits for recorded resource teardown before another viewer creates a worker. A teardown that
 * never settles is dropped after a bounded wait so it cannot stall every later load.
 *
 * @returns Whether teardown finished; false means the wait timed out and loading may overlap it.
 */
export const waitForPDFResourceDisposal = async (): Promise<boolean> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), PDF_RESOURCE_DISPOSAL_WAIT_MS)
  })
  try {
    const finished = await Promise.race([pendingPDFResourceDisposal.then(() => true), timeout])
    if (!finished) pendingPDFResourceDisposal = Promise.resolve()
    return finished
  } finally {
    clearTimeout(timer)
  }
}

// Chromium's ImageDecoder implementation had PDF.js-breaking bugs until 133.
const MINIMUM_RELIABLE_CHROMIUM_IMAGE_DECODER_VERSION = 133
// Firefox added static and dynamic module imports in dedicated workers in version 114.
const MINIMUM_FIREFOX_MODULE_WORKER_VERSION = 114

// This determines whether to use the more established PDF.js decoder path on older Chromium-based
// browsers, including Android WebViews.
export const shouldDisablePDFJSImageDecoder = (
  userAgent: string = navigator.userAgent,
): boolean => {
  const chromiumVersion = /(?:Chrome|Chromium)\/(\d+)/.exec(userAgent)?.[1]
  if (!chromiumVersion) return false

  return Number.parseInt(chromiumVersion, 10) < MINIMUM_RELIABLE_CHROMIUM_IMAGE_DECODER_VERSION
}

/**
 * Returns whether PDF.js should run its worker module on the main thread. Firefox versions before
 * 114 parse module-worker imports as classic-worker syntax errors, so they cannot load PDF.js 6's
 * module worker directly.
 */
export const shouldUsePDFJSMainThreadWorker = (
  userAgent: string = navigator.userAgent,
): boolean => {
  const firefoxVersion = /Firefox\/(\d+)/.exec(userAgent)?.[1]
  if (!firefoxVersion) return false

  return Number.parseInt(firefoxVersion, 10) < MINIMUM_FIREFOX_MODULE_WORKER_VERSION
}

/** Runtime APIs the viewer needs that this browser lacks. */
export const getMissingPDFViewerAPIs = (): string[] => {
  const promiseConstructor = Promise as PromiseConstructorWithResolvers
  const abortSignalConstructor = window.AbortSignal as AbortSignalConstructorWithAny | undefined
  const missing: string[] = []
  if (typeof window.structuredClone !== 'function') missing.push('structuredClone')
  if (typeof window.AbortController === 'undefined') missing.push('AbortController')
  if (typeof abortSignalConstructor === 'undefined') missing.push('AbortSignal')
  else if (typeof abortSignalConstructor.any !== 'function') missing.push('AbortSignal.any')
  if (typeof promiseConstructor.withResolvers !== 'function') missing.push('Promise.withResolvers')
  return missing
}

/** Returns whether the browser exposes all runtime APIs used by the PDF.js viewer. */
export const canUsePDFViewer = (): boolean => getMissingPDFViewerAPIs().length === 0

/** Chromium's non-standard heap counters; undefined elsewhere or if the WebView misbehaves. */
export const getMemoryDiagnostics = (): {
  js_heap_used_mb?: number
  js_heap_limit_mb?: number
} => {
  try {
    const memory = (
      performance as Performance & {
        memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number }
      }
    ).memory
    const toMb = (bytes?: number) =>
      Number.isFinite(bytes) ? Math.round(bytes! / 1_048_576) : undefined
    return {
      js_heap_used_mb: toMb(memory?.usedJSHeapSize),
      js_heap_limit_mb: toMb(memory?.jsHeapSizeLimit),
    }
  } catch {
    return {}
  }
}

type NavigatorWithDeviceInfo = Navigator & {
  deviceMemory?: number
  connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean }
}

/** Device facts sent at the top level of every viewer log, since logs cannot be joined by session. */
export const getViewerDeviceFacts = (): Pick<
  ViewerIndexedFields,
  'device_memory_gb' | 'chromium_major' | 'connection_type'
> => {
  const nav = navigator as NavigatorWithDeviceInfo
  const chromiumMajor = /(?:Chrome|Chromium)\/(\d+)/.exec(navigator.userAgent)?.[1]
  return {
    device_memory_gb: nav.deviceMemory,
    chromium_major: chromiumMajor ? Number.parseInt(chromiumMajor, 10) : undefined,
    connection_type: nav.connection?.effectiveType,
  }
}

/** Remaining device and network facts that explain slow or failed loads. Any value may be undefined. */
export const getPDFEnvironmentDiagnostics = (): ViewerDiagnostics => {
  const nav = navigator as NavigatorWithDeviceInfo
  return {
    user_agent: navigator.userAgent,
    cpu_cores: navigator.hardwareConcurrency,
    connection_downlink_mbps: nav.connection?.downlink,
    connection_rtt_ms: nav.connection?.rtt,
    save_data: nav.connection?.saveData,
    is_online: navigator.onLine,
    has_webassembly: typeof WebAssembly === 'object',
    has_offscreen_canvas: typeof OffscreenCanvas !== 'undefined',
    has_native_image_decoder: 'ImageDecoder' in globalThis,
    device_pixel_ratio: window.devicePixelRatio,
    screen_width: window.screen?.width,
    screen_height: window.screen?.height,
  }
}

// One key for all tabs: the latest session wins. Tablets run one tab, so this is accepted.
const PDF_SESSION_MARKER_KEY = 'pdfViewerSession'

/** Saves viewer state for crash detection; a killed page fires no unload event. Best-effort. */
export const writePDFSessionMarker = (marker: PDFSessionMarker): void => {
  try {
    localStorage.setItem(PDF_SESSION_MARKER_KEY, JSON.stringify(marker))
  } catch {
    // Storage may be full or blocked.
  }
}

/** The marker from an earlier session, or null. */
export const readPDFSessionMarker = (): PDFSessionMarker | null => {
  try {
    const stored = localStorage.getItem(PDF_SESSION_MARKER_KEY)
    return stored ? (JSON.parse(stored) as PDFSessionMarker) : null
  } catch {
    return null
  }
}

/** Removes the marker only if this session owns it. */
export const clearPDFSessionMarker = (eventUuid: string): void => {
  try {
    if (readPDFSessionMarker()?.event_uuid === eventUuid) {
      localStorage.removeItem(PDF_SESSION_MARKER_KEY)
    }
  } catch {
    // Storage may be blocked.
  }
}

export const canUseFullscreenAPI = (): boolean => {
  const docElm = document.documentElement
  return !!(
    docElm.requestFullscreen ||
    docElm.webkitRequestFullscreen ||
    docElm.msRequestFullscreen
  )
}
export const requestFullscreen = async (
  htmlElement: HTMLElement | null | undefined,
): Promise<boolean> => {
  if (!htmlElement) {
    return false
  }

  try {
    if (htmlElement.requestFullscreen) {
      await htmlElement.requestFullscreen()
      return true
    } else if (htmlElement.webkitRequestFullscreen) {
      await htmlElement.webkitRequestFullscreen()
      return true
    } else if (htmlElement.msRequestFullscreen) {
      await htmlElement.msRequestFullscreen()
      return true
    }
  } catch {
    // A browser may expose the API but reject it because of permissions, iframe policy,
    // or a missing user activation. The caller can fall back to CSS fullscreen.
  }

  return false
}

export const exitFullscreen = async (): Promise<boolean> => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
      return true
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen()
      return true
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen()
      return true
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen()
      return true
    }
  } catch {
    // Keep the current state when the browser rejects the exit request.
  }

  return false
}

export const browserInFullscreen = (): boolean => {
  return (
    !!document.fullscreenElement ||
    !!document.webkitFullscreenElement ||
    !!document.mozFullScreenElement ||
    !!document.msFullscreenElement
  )
}

const fullscreenEvents: Array<
  'fullscreenchange' | 'mozfullscreenchange' | 'webkitfullscreenchange' | 'msfullscreenchange'
> = ['fullscreenchange', 'mozfullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange']

export const setupFullscreenChangeListeners = (callback: () => void): void => {
  fullscreenEvents.forEach((eventName) => {
    document.addEventListener(eventName, callback)
  })
}

export const removeFullscreenChangeListeners = (callback: () => void): void => {
  fullscreenEvents.forEach((eventName) => {
    document.removeEventListener(eventName, callback)
  })
}

let bodyScrollLockY: number | null = null

/** Pins the document body in place so it can't scroll behind a fixed-position overlay. */
export const lockBodyScroll = (): void => {
  if (bodyScrollLockY !== null) return

  bodyScrollLockY = window.scrollY
  const { style } = document.body
  style.position = 'fixed'
  style.top = `-${bodyScrollLockY}px`
  style.left = '0'
  style.right = '0'
  style.width = '100%'
}

/** Reverses {@link lockBodyScroll}, restoring normal scrolling and the prior scroll position. */
export const unlockBodyScroll = (): void => {
  if (bodyScrollLockY === null) return

  const scrollY = bodyScrollLockY
  bodyScrollLockY = null
  const { style } = document.body
  style.position = ''
  style.top = ''
  style.left = ''
  style.right = ''
  style.width = ''
  window.scrollTo(0, scrollY)
}

export const hasBrowserPDFViewer = (): boolean => {
  // Modern browsers
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/pdfViewerEnabled
  if (navigator.pdfViewerEnabled !== undefined) {
    return navigator.pdfViewerEnabled
  }

  // Old browsers or those not compatible with pdfViewerEnabled like Safari
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mimeTypes
  let hasPDFViewer = false
  try {
    const mimeType = navigator.mimeTypes?.namedItem('application/pdf') ?? null
    const hasPluginEnabled = mimeType?.enabledPlugin ?? null
    if (hasPluginEnabled) {
      hasPDFViewer = true
    }
  } catch {
    hasPDFViewer = false
  }

  return hasPDFViewer
}

/**
 * Converts any thrown value into the serializable error fields accepted by viewer logs and UI
 * state. This is necessary to allow for possible arbitrary error values from PDF.js and browser APIs
 * which may not be instances of Error.
 *
 * @param err - The value caught from PDF.js or browser APIs.
 * @returns A displayable message plus the original error name and stack when available.
 */
export const getErrorDetails = (err: unknown): Pick<ViewerError, 'message' | 'name' | 'stack'> => {
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
