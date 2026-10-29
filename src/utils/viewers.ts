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

/** Returns whether the browser exposes all runtime APIs used by the PDF.js viewer. */
export const canUsePDFViewer = (): boolean => {
  const promiseConstructor = Promise as PromiseConstructorWithResolvers
  if (
    typeof window.structuredClone !== 'function' ||
    typeof window.AbortController === 'undefined' ||
    typeof window.AbortSignal === 'undefined'
  ) {
    return false
  }

  const abortSignalConstructor = window.AbortSignal as AbortSignalConstructorWithAny
  return (
    typeof abortSignalConstructor.any === 'function' &&
    typeof promiseConstructor.withResolvers === 'function'
  )
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
