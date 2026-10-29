/** Bootstrap URL and caller-supplied path to the emitted worker bundle. */
const bootstrapUrl = new URL(import.meta.url)
const bundle = bootstrapUrl.searchParams.get('bundle')
if (!bundle) throw new Error('The PDF worker bundle URL is missing.')

/** Same-origin bundle URL, validated before executing the worker module. */
const bundleUrl = new URL(bundle, bootstrapUrl)
if (
  bundleUrl.origin !== bootstrapUrl.origin ||
  bundleUrl.username ||
  bundleUrl.password ||
  bundleUrl.search ||
  bundleUrl.hash ||
  !/\/pdf-worker-entry[-.][\w-]+\.(?:m?js)$/.test(bundleUrl.pathname)
) {
  throw new Error('The PDF worker bundle URL is invalid.')
}

await import(bundleUrl.href)

/** Registered handler exposed for PDF.js's main-thread fake-worker fallback. */
const WorkerMessageHandler = globalThis.pdfjsWorker?.WorkerMessageHandler
if (typeof WorkerMessageHandler?.setup !== 'function') {
  throw new Error('The PDF worker bundle did not register WorkerMessageHandler.setup.')
}

export { WorkerMessageHandler }
