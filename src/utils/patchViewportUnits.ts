/**
 * @module patchViewportUnits
 * @description Patches CSS viewport units (vh/dvh/vw/dvw) to use JS-calculated custom properties.
 *
 * Android WebView may report viewport units as 0. This module:
 * 1. Sets `--vh` and `--vw` custom properties on `:root` equal to 1% of the viewport dimensions
 * 2. Monkey-patches {@link CSSStyleSheet.prototype.replaceSync} so that any stylesheet
 *    applied to a shadow DOM (e.g. Lit web components like pharos) automatically
 *    rewrites viewport units to use `calc(var(--vh/--vw) * N)`.
 *
 * Must be imported before any web component definitions run.
 */

import { useLogger } from '@/composables/logging/useLogger'

/**
 * Sets `--vh` and `--vw` CSS custom properties on the document root element,
 * each equal to 1% of the corresponding viewport dimension.
 */
function setViewportProperties() {
  const root = document.documentElement.style
  root.setProperty('--vh', `${(window.visualViewport?.height || window.innerHeight) * 0.01}px`)
  root.setProperty('--vw', `${(window.visualViewport?.width || window.innerWidth) * 0.01}px`)
}

/**
 * Rewrites raw viewport units in a CSS string to use custom properties.
 *
 * @param {string} css - The CSS string to transform.
 * @returns {string} The transformed CSS string.
 *
 * @example
 * rewriteViewportUnits("height:100vh")  // "height:calc(var(--vh, 1vh) * 100)"
 * rewriteViewportUnits("height:95dvh")  // "height:calc(var(--vh, 1vh) * 95)"
 * rewriteViewportUnits("width:100vw")   // "width:calc(var(--vw, 1vw) * 100)"
 * rewriteViewportUnits("width:88dvw")   // "width:calc(var(--vw, 1vw) * 88)"
 */
function rewriteViewportUnits(css: string): string {
  return css.replace(/(\d+(?:\.\d+)?)d?v([hw])\b/g, 'calc(var(--v$2, 1v$2) * $1)')
}

/**
 * Initializes the viewport units patch.
 *
 * Sets `--vh` and `--vw` custom properties on `:root`, adds a resize listener
 * to keep them updated, and monkey-patches {@link CSSStyleSheet.prototype.replaceSync}
 * and {@link CSSStyleSheet.prototype.replace} so that shadow DOM stylesheets
 * (e.g. from Lit-based web components) have their viewport units rewritten automatically.
 */
export function initViewportUnitsPatch() {
  try {
    setViewportProperties()
    window.addEventListener('resize', setViewportProperties)

    /** @type {typeof CSSStyleSheet.prototype.replaceSync} */
    const originalReplaceSync = CSSStyleSheet.prototype.replaceSync
    CSSStyleSheet.prototype.replaceSync = function (text: string) {
      return originalReplaceSync.call(this, rewriteViewportUnits(text))
    }

    /** @type {typeof CSSStyleSheet.prototype.replace} */
    const originalReplace = CSSStyleSheet.prototype.replace
    CSSStyleSheet.prototype.replace = function (text: string) {
      return originalReplace.call(this, rewriteViewportUnits(text))
    }
  } catch (error) {
    const { handleWithLog, logs } = useLogger()
    const { viewportPatchErrorLog } = logs.getViewportPatchLogs()
    const log_error = error instanceof Error ? error : new Error(String(error))
    handleWithLog(viewportPatchErrorLog({ err: log_error }))
  }
}
