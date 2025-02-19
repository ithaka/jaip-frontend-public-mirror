export async function requestFullscreen(htmlElement, callback = () => {}) {
  if (htmlElement.requestFullscreen) {
    await htmlElement.requestFullscreen()
    callback()
  } else if (htmlElement.webkitRequestFullscreen) {
    htmlElement.webkitRequestFullscreen()
    callback()
  } else if (htmlElement.msRequestFullscreen) {
    htmlElement.msRequestFullscreen()
    callback()
  }
}

export function exitFullscreen() {
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

export function browserInFullscreen() {
  return (
    !!document.fullscreenElement ||
    !!document.webkitFullscreenElement ||
    !!document.mozFullScreenElement ||
    !!document.msFullscreenElement
  )
}

export function setupFullscreenChangeListeners(callback) {
  document.addEventListener('fullscreenchange', callback)
  document.addEventListener('mozfullscreenchange', callback)
  document.addEventListener('webkitfullscreenchange', callback)
  document.addEventListener('msfullscreenchange', callback)
}

export function removeFullscreenChangeListeners(originalCallback) {
  document.removeEventListener('fullscreenchange', originalCallback)
  document.removeEventListener('mozfullscreenchange', originalCallback)
  document.removeEventListener('webkitfullscreenchange', originalCallback)
  document.removeEventListener('msfullscreenchange', originalCallback)
}

export function hasBrowserPDFViewer() {
  // Modern borwsers
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/pdfViewerEnabled
  if (navigator.pdfViewerEnabled !== undefined) {
    return navigator.pdfViewerEnabled
  }

  // Old browsers or not compatible with pdfViewerEnabled like Safari
  // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mimeTypes
  let hasPDFViewer = false
  try {
    const hasPluginEnabled =
      navigator.mimeTypes && navigator.mimeTypes['application/pdf']
        ? navigator.mimeTypes['application/pdf'].enabledPlugin
        : null
    if (hasPluginEnabled) {
      hasPDFViewer = true
    }
  } catch {
    hasPDFViewer = false
  }

  return hasPDFViewer
}
