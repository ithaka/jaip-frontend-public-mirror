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
  callback: () => void = () => {},
): Promise<void> => {
  if (!htmlElement) {
    return
  }

  if (htmlElement.requestFullscreen) {
    htmlElement.requestFullscreen()
    callback()
  } else if (htmlElement.webkitRequestFullscreen) {
    htmlElement.webkitRequestFullscreen()
    callback()
  } else if (htmlElement.msRequestFullscreen) {
    htmlElement.msRequestFullscreen()
    callback()
  }
}

export const exitFullscreen = (): void => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
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
