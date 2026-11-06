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

/** Flat context attached to viewer logs. */
export type ViewerDiagnostics = Record<string, string | number | boolean | null | undefined>

/**
 * Viewer fields sent at the top level of a log. Elasticsearch indexes top-level fields but not the
 * keys inside viewer_diagnostics, so anything that must be filtered or aggregated belongs here.
 * Each name fixes its indexed type on first write; do not change a type once logs ship.
 */
export interface ViewerIndexedFields {
  viewer_type?: ViewerType
  to_viewer?: ViewerType
  viewer_had_problem?: boolean
  viewer_phase?: ViewerPhase
  viewer_visibility?: string
  js_heap_used_mb?: number
  device_memory_gb?: number
  chromium_major?: number
  connection_type?: string
  previous_visibility?: string
}

/** Context attached to every viewer error and diagnostic log. */
export interface ViewerLogContext {
  indexed: ViewerIndexedFields
  details: ViewerDiagnostics
}

/** The PDF viewer's state when the reader leaves it, reported on the mode-switch log. */
export interface ViewerSessionSnapshot {
  phase: ViewerPhase
  hadError: boolean
  stallCount: number
  retried: boolean
  msInViewer: number
  pagesRendered: number
}

/** Which viewer produced a log, so the PDF and page viewers can be compared. */
export type ViewerType = 'pdf' | 'page'

/** Where a viewer attempt is, reported in logs and the crash marker. */
export type ViewerPhase =
  | 'configuring_worker'
  | 'loading_document'
  | 'initializing_pages'
  | 'loading_metadata'
  | 'loading_page'
  | 'ready'
  | 'retrying'
  | 'failed'

/** Last known session state, saved so the next load can report a killed page. */
export interface PDFSessionMarker {
  event_uuid: string
  iid: string
  started_at: number
  last_beat_at: number
  phase: ViewerPhase
  visibility: string
  pages_rendered: number
  js_heap_used_mb?: number
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

/** Non-error viewer signals logged as viewer_diagnostic events. */
export enum ViewerDiagnosticActions {
  environment = 'pdf_environment',
  load_started = 'pdf_load_started',
  load_slow = 'pdf_load_slow',
  document_loaded = 'pdf_document_loaded',
  pages_initialized = 'pdf_pages_initialized',
  first_page_rendered = 'pdf_first_page_rendered',
  page_render_stalled = 'pdf_page_render_stalled',
  retry_recovered = 'pdf_retry_recovered',
  page_hidden = 'pdf_page_hidden',
  page_visible = 'pdf_page_visible',
  page_frozen = 'pdf_page_frozen',
  page_resumed = 'pdf_page_resumed',
  page_hide = 'pdf_page_hide',
  window_error = 'pdf_window_error',
  previous_session_unclean = 'pdf_previous_session_unclean',
}

export interface ViewerError {
  message: string
  name?: string
  stack?: string
  source?: string
  reported_stack?: string
  code?: number
  status: boolean
}
