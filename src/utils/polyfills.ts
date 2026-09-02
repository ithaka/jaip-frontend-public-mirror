//Shape returned by `Promise.withResolvers`.
type PromiseResolvers<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

// `Promise` typed with the optional `withResolvers` static so its presence can be feature-detected.
type PromiseConstructorWithResolvers = PromiseConstructor & {
  withResolvers?: <T>() => PromiseResolvers<T>
}

// `AbortSignal` typed with the optional `any` static so its presence can be feature-detected.
type AbortSignalConstructorWithAny = typeof AbortSignal & {
  any?: (signals: AbortSignal[]) => AbortSignal
}

// `ArrayBuffer.prototype` typed with the optional `transferToFixedLength` method so its presence
// can be feature-detected on browsers whose TypeScript-facing API is newer than their runtime API.
type ArrayBufferWithTransferToFixedLength = ArrayBuffer & {
  transferToFixedLength?: (newLength?: number) => ArrayBuffer
}

/**
 * Adds `Promise.withResolvers`, which the legacy PDF.js bundle calls directly with no internal
 * fallback. Native support starts at Chrome 119, Firefox 128, and Safari 17.4.
 */
const polyfillPromiseWithResolvers = () => {
  const promiseConstructor = Promise as PromiseConstructorWithResolvers
  if (typeof promiseConstructor.withResolvers === 'function') return

  Object.defineProperty(promiseConstructor, 'withResolvers', {
    configurable: true,
    writable: true,
    value: <T>(): PromiseResolvers<T> => {
      let resolve!: PromiseResolvers<T>['resolve']
      let reject!: PromiseResolvers<T>['reject']
      const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve
        reject = promiseReject
      })

      return { promise, resolve, reject }
    },
  })
}

/**
 * Adds `AbortSignal.any`, which the legacy PDF.js bundle calls directly with no internal fallback.
 * Native support starts at Chrome 116, Firefox 124, and Safari 17.4. Does nothing if the browser
 * lacks `AbortController`/`AbortSignal` entirely, since there is no way to construct a signal to
 * return in that case.
 */
const polyfillAbortSignalAny = () => {
  // AbortSignal.any is only available in browsers that support AbortController/AbortSignal. Fortunately,
  // these go back to Chrome 66, Firefox 57, and Safari 12, so we aren't worried about supporting anything that
  // doesn't have them.
  if (typeof AbortSignal === 'undefined' || typeof AbortController === 'undefined') return

  const abortSignalConstructor = AbortSignal as AbortSignalConstructorWithAny
  if (typeof abortSignalConstructor.any === 'function') return

  Object.defineProperty(abortSignalConstructor, 'any', {
    configurable: true,
    writable: true,
    value: (signals: AbortSignal[]): AbortSignal => {
      const controller = new AbortController()
      const listeners = new Map<AbortSignal, () => void>()

      const cleanup = () => {
        listeners.forEach((listener, signal) => signal.removeEventListener('abort', listener))
        listeners.clear()
      }

      const abortFrom = (signal: AbortSignal) => {
        cleanup()
        controller.abort(signal.reason)
      }

      for (const signal of signals) {
        if (signal.aborted) {
          abortFrom(signal)
          return controller.signal
        }

        const listener = () => abortFrom(signal)
        listeners.set(signal, listener)
        signal.addEventListener('abort', listener, { once: true })
      }

      return controller.signal
    },
  })
}

// `Array.prototype.toReversed` typed so its presence can be feature-detected.
type ArrayWithToReversed = typeof Array.prototype & {
  toReversed?: <T>(this: T[]) => T[]
}

/**
 * Adds `Array.prototype.toReversed`, which the legacy PDF.js calls directly with no internal fallback.
 * Native support starts at Chrome 110, Firefox 115, and Safari 16.
 */
const polyfillArrayToReversed = () => {
  const arrayPrototype = Array.prototype as ArrayWithToReversed
  if (typeof arrayPrototype.toReversed === 'function') return

  Object.defineProperty(arrayPrototype, 'toReversed', {
    configurable: true,
    writable: true,
    value: function toReversed<T>(this: T[]): T[] {
      return [...this].reverse()
    },
  })
}

/**
 * Adds `ArrayBuffer.prototype.transferToFixedLength`, which PDF.js uses inside its worker while
 * preparing font-substitution data. Native support starts at Chrome 114, Firefox 122, and Safari
 * 17.4.
 *
 * This compatibility implementation copies into a fixed-length buffer but does not detach the
 * source buffer. PDF.js does not rely on the source becoming detached at its current call site.
 */
const polyfillArrayBufferTransferToFixedLength = () => {
  const arrayBufferPrototype = ArrayBuffer.prototype as ArrayBufferWithTransferToFixedLength
  if (typeof arrayBufferPrototype.transferToFixedLength === 'function') return

  Object.defineProperty(arrayBufferPrototype, 'transferToFixedLength', {
    configurable: true,
    writable: true,
    value: function transferToFixedLength(this: ArrayBuffer, newLength = this.byteLength) {
      const newBuffer = new ArrayBuffer(newLength)
      new Uint8Array(newBuffer).set(new Uint8Array(this, 0, Math.min(this.byteLength, newLength)))
      return newBuffer
    },
  })
}

/** Adds the runtime APIs required by the legacy PDF.js bundle on supported older browsers. */
export const initPDFViewerPolyfills = () => {
  polyfillPromiseWithResolvers()
  polyfillAbortSignalAny()
  polyfillArrayToReversed()
}

/**
 * Adds the runtime APIs required specifically inside the PDF.js worker. Workers have their own
 * global scope, so main-thread polyfills installed by `initPDFViewerPolyfills` do not reach them.
 */
export const initPDFWorkerPolyfills = () => {
  polyfillPromiseWithResolvers()
  polyfillArrayBufferTransferToFixedLength()
}
