import { shouldDisablePDFJSImageDecoder } from '@/utils/viewers'

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

/**
 * Decodes the uncompressed BMP layout produced by pdfjs-dist's `ImageResizer._encodeBMP()`
 * (BITMAPFILEHEADER + BITMAPINFOHEADER, 1bpp grayscale/24bpp BGR/32bpp RGBA pixel data, rows
 * padded to 4 bytes for 1bpp/24bpp). Re-verify this layout whenever pdfjs-dist is upgraded by
 * re-grepping `_encodeBMP` in the built worker bundle.
 */
const decodePDFJSEncodedBMP = (bytes: Uint8Array): ImageData => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint16(0, true) !== 0x4d42) {
    throw new Error('Not a BMP file')
  }

  const pixelDataOffset = view.getUint32(10, true)
  const width = view.getInt32(18, true)
  const height = Math.abs(view.getInt32(22, true))
  const bitsPerPixel = view.getUint16(28, true)
  const colorTableOffset = 14 + view.getUint32(14, true)
  const rgba = new Uint8ClampedArray(width * height * 4)

  if (bitsPerPixel === 1) {
    const rowSize = (((width + 7) >> 3) + 3) & ~3
    for (let y = 0; y < height; y++) {
      const rowStart = pixelDataOffset + y * rowSize
      for (let x = 0; x < width; x++) {
        const bit = (bytes[rowStart + (x >> 3)] >> (7 - (x & 7))) & 1
        const gray = bytes[colorTableOffset + bit * 4]
        const outIdx = (y * width + x) * 4
        rgba[outIdx] = gray
        rgba[outIdx + 1] = gray
        rgba[outIdx + 2] = gray
        rgba[outIdx + 3] = 255
      }
    }
  } else if (bitsPerPixel === 24) {
    const rowSize = (3 * width + 3) & ~3
    for (let y = 0; y < height; y++) {
      const rowStart = pixelDataOffset + y * rowSize
      for (let x = 0; x < width; x++) {
        const idx = rowStart + x * 3
        const outIdx = (y * width + x) * 4
        rgba[outIdx] = bytes[idx + 2]
        rgba[outIdx + 1] = bytes[idx + 1]
        rgba[outIdx + 2] = bytes[idx]
        rgba[outIdx + 3] = 255
      }
    }
  } else if (bitsPerPixel === 32) {
    const rowSize = width * 4
    for (let y = 0; y < height; y++) {
      const rowStart = pixelDataOffset + y * rowSize
      for (let x = 0; x < width; x++) {
        const idx = rowStart + x * 4
        const outIdx = (y * width + x) * 4
        rgba[outIdx] = bytes[idx]
        rgba[outIdx + 1] = bytes[idx + 1]
        rgba[outIdx + 2] = bytes[idx + 2]
        rgba[outIdx + 3] = bytes[idx + 3]
      }
    }
  } else {
    throw new Error(`Unsupported BMP bit depth: ${bitsPerPixel}`)
  }

  return new ImageData(rgba, width, height)
}

type CreateImageBitmapFn = typeof createImageBitmap

/**
 * Chromium WebViews below version 133 can throw `InvalidStateError` from `createImageBitmap` when
 * decoding the full-size BMP blobs PDF.js's `ImageResizer` builds before downscaling oversized page
 * images (e.g. large JBIG2 scans - not gated by `isImageDecoderSupported`, which only covers
 * `ImageDecoder`). This replaces `createImageBitmap` for `image/bmp` blobs only with a manual
 * decode of that deterministic, self-encoded BMP, turned into a bitmap directly from its
 * `ImageData` - sidestepping the broken native BMP codec entirely. Every other call
 * (non-BMP sources, or BMP calls with crop/option arguments this fast path doesn't handle) falls
 * through to the native implementation unchanged.
 */
const polyfillCreateImageBitmapForLegacyBMPDecoder = () => {
  if (!shouldDisablePDFJSImageDecoder()) return
  if (typeof createImageBitmap !== 'function') return

  const nativeCreateImageBitmap: CreateImageBitmapFn = createImageBitmap.bind(globalThis)

  const patchedCreateImageBitmap = (async (
    image: unknown,
    ...rest: unknown[]
  ): Promise<ImageBitmap> => {
    if (!(image instanceof Blob) || image.type !== 'image/bmp' || rest.length > 0) {
      return (nativeCreateImageBitmap as (...args: unknown[]) => Promise<ImageBitmap>)(
        image,
        ...rest,
      )
    }

    try {
      const imageData = decodePDFJSEncodedBMP(new Uint8Array(await image.arrayBuffer()))
      // No canvas: these images exceed canvas size limits.
      return await nativeCreateImageBitmap(imageData)
    } catch {
      // Fall back to the native decoder if the BMP doesn't match the expected layout.
      return nativeCreateImageBitmap(image)
    }
  }) as CreateImageBitmapFn

  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    writable: true,
    value: patchedCreateImageBitmap,
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
  polyfillCreateImageBitmapForLegacyBMPDecoder()
}
