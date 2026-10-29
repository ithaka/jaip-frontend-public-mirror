import type { getDocument, PDFWorker } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFPageView, PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'

/** The owner of PDF loading, its worker, and asynchronous destruction. */
export type PDFLoadingTask = ReturnType<typeof getDocument>
/** A successfully loaded, raw PDF.js document. */
export type PDFDocumentProxy = Awaited<PDFLoadingTask['promise']>
/** Any resource state accepted by the shared document/task cleanup path. */
export type PDFResource = PDFLoadingTask | PDFDocumentProxy | null | undefined
/** The installed runtime accepts null for detachment, although upstream declarations omit it. */
export type DisposablePDFViewer = PDFViewer & {
  /** Attaches a document or cancels/detaches the current document when passed null. */
  setDocument(document: PDFDocumentProxy | null): void
}
/** The runtime's instance-lifetime abort signal is also missing from upstream constructor types. */
export type DisposablePDFViewerOptions = ConstructorParameters<typeof PDFViewer>[0] & {
  abortSignal: AbortSignal
}
/** Shared page/text render payload used to reject events from superseded page views. */
export interface PDFPageRenderEvent {
  source: PDFPageView
  error?: unknown
}

/** Runtime worker ownership is private in upstream types; use only for document-scoped observation. */
export interface PDFLoadingTaskWorkerOwner {
  readonly _worker: Pick<PDFWorker, 'port'> | null
}

/** Only these PDF.js transport fields are inspected; other messages pass through unchanged. */
export interface PDFWorkerImageMessage {
  targetName?: string
  action?: string
  data?: unknown
}

export enum ViewerControls {
  toggle_menu = 'toggle-menu',
  rotate_right = 'rotate-right',
  rotate_left = 'rotate-left',
  zoom_in = 'zoom-in',
  zoom_out = 'zoom-out',
  fit_view = 'fit-view',
  update_page = 'update-page',
  scroll_to_page = 'scroll-to-page',
  toggle_fullscreen = 'toggle-fullscreen',
}
export type ViewerControlOptions = `${ViewerControls}`

export interface ViewerError {
  message: string
  name?: string
  stack?: string
  source?: string
  reported_stack?: string
  code?: number
  status: boolean
}
