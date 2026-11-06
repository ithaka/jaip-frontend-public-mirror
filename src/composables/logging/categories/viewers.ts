import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'
import { toRaw, type Ref } from 'vue'
import {
  ViewerControls,
  type ViewerControlOptions,
  type ViewerDiagnosticActions,
  type ViewerDiagnostics,
  type ViewerIndexedFields,
  type ViewerLogContext,
  type ViewerError,
  type ViewerPhase,
  type ViewerSessionSnapshot,
  type ViewerType,
} from '@/interfaces/Viewer'
import { getViewerDeviceFacts } from '@/utils/viewers'
import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { v4 as uuidv4 } from 'uuid'

const getPDFViewerLogs = (options: {
  iid: Ref<string>
  isReentryContent: Ref<boolean>
  viewer: Ref<PDFViewer>
  // Loading failures and teardown can be logged before/after any document is attached.
  documentProxy: Ref<PDFDocumentProxy | undefined>
  // Context merged into every error and diagnostic log when it is created.
  getContext?: () => ViewerLogContext
  eventUUID?: string
}) => {
  // This UUID is created when the Viewer component is created, and will be able to
  // link all viewer logs for a single document view session.
  const uuid = options.eventUUID ?? uuidv4()

  // Shared by every PDF viewer log. Read when the log is built, so it reflects the viewer's state then.
  const session = () => ({
    event_uuid: uuid,
    is_reentry_content: options.isReentryContent.value,
    viewer_type: 'pdf' as const,
  })
  const position = () => ({
    total_pages: toRaw(options.documentProxy.value)?.numPages,
    current_page: toRaw(options.viewer.value).currentPageNumber,
  })

  const errorLinkClickLog =
    (opts: { destination: string }): (() => WorkingLog) =>
    () => ({ ...generics.linkClick(opts.destination), ...session(), ...position() })

  const viewerControlLog =
    (opts: { action: ViewerControlOptions }): (() => WorkingLog) =>
    () => ({
      ...generics.viewerControl({ action: opts.action, iid: options.iid.value }),
      ...session(),
      ...position(),
    })

  const pageSelectionLog =
    (opts: { previous_page: number }): (() => WorkingLog) =>
    () => ({
      ...generics.viewerControl({ action: ViewerControls.update_page, iid: options.iid.value }),
      ...session(),
      ...position(),
      previous_page: opts.previous_page,
    })

  const pageScrollLog =
    (opts: { previous_page: number }): (() => WorkingLog) =>
    () => ({
      ...generics.viewerControl({
        action: ViewerControls.scroll_to_page,
        iid: options.iid.value,
      }),
      ...session(),
      ...position(),
      previous_page: opts.previous_page,
    })

  const startPDFViewingSessionLog = (): WorkingLog => ({
    ...generics.startViewingSession({ iid: options.iid.value }),
    ...session(),
  })

  const endPDFViewingSessionLog = (): WorkingLog => ({
    ...generics.endViewingSession({ iid: options.iid.value }),
    ...session(),
  })

  /** Captures failure-time context before asynchronous logging or teardown changes the viewer. */
  const PDFViewerErrorLog = (opts: { error: ViewerError; source: string }): (() => WorkingLog) => {
    const context = options.getContext?.()
    const log: WorkingLog = {
      ...generics.error({ message: opts.error.message, code: String(opts.error.code) }),
      event_description: `PDF viewer error in ${opts.source}: ${opts.error.message}`,
      action: 'pdf_viewer_error',
      viewer_error: {
        ...opts.error,
        source: opts.source,
        reported_stack: new Error(`PDF viewer error reported in ${opts.source}`).stack,
      },
      itemid: options.iid.value,
      ...session(),
      ...position(),
      ...context?.indexed,
      viewer_diagnostics: context?.details,
    }
    return () => log
  }

  /** Non-error milestones and warnings. Own event type, so they never count as viewer errors. */
  const viewerDiagnosticLog =
    (opts: {
      action: ViewerDiagnosticActions
      details?: ViewerDiagnostics
      indexed?: ViewerIndexedFields
    }): (() => WorkingLog) =>
    () => {
      const context = options.getContext?.()
      return {
        ...generics.viewerDiagnostic({
          action: opts.action,
          iid: options.iid.value,
          details: { ...context?.details, ...opts.details },
          indexed: { ...context?.indexed, ...opts.indexed },
        }),
        ...session(),
        ...position(),
      }
    }

  const PDFViewerLoadingCancelledLog = (opts: {
    reason: string
    error: ViewerError
  }): (() => WorkingLog) => {
    const log = PDFViewerErrorLog({
      error: opts.error,
      source: 'PDFViewer.vue:createLoadingTask',
    })()
    return () => ({
      ...log,
      event_description: `PDF loading was cancelled during teardown (${opts.reason}): ${opts.error.message}`,
      reason: `PDF loading cancelled: ${opts.reason}`,
    })
  }

  return {
    errorLinkClickLog,
    viewerControlLog,
    pageSelectionLog,
    pageScrollLog,
    startPDFViewingSessionLog,
    endPDFViewingSessionLog,
    PDFViewerErrorLog,
    PDFViewerLoadingCancelledLog,
    viewerDiagnosticLog,
  }
}

const getPageViewerLogs = (options: {
  iid: string
  eventUUID?: string
  // The parent view owns session logs for both viewers, so it reports which one is active.
  viewerType?: () => ViewerType
  // Where the viewer is, read when each log is built, like the PDF viewer's viewer and document refs.
  getState?: () => { phase: ViewerPhase; currentPage: number; totalPages: number }
}) => {
  // This UUID is created when the Viewer component is created, and will be able to
  // link all viewer logs for a single document view session.
  const uuid = options.eventUUID ?? uuidv4()
  // Top-level fields shared with the PDF viewer's logs, so the two can be compared by device.
  const deviceFacts = getViewerDeviceFacts()
  const indexed = (): ViewerIndexedFields => ({
    viewer_type: options.viewerType?.() ?? 'page',
    ...deviceFacts,
  })

  const session = () => ({ event_uuid: uuid, is_reentry_content: false, ...indexed() })
  const state = () => {
    const current = options.getState?.()
    return {
      viewer_phase: current?.phase,
      current_page: current?.currentPage,
      total_pages: current?.totalPages || undefined,
    }
  }

  const viewerControlLog =
    (opts: { action: ViewerControlOptions }): (() => WorkingLog) =>
    () => ({
      ...generics.viewerControl({ action: opts.action, iid: options.iid }),
      ...session(),
      ...state(),
    })

  const pageSelectionLog =
    (opts: { previous_page: number; new_page: number }): (() => WorkingLog) =>
    () => ({
      ...generics.viewerControl({ action: ViewerControls.update_page, iid: options.iid }),
      ...session(),
      ...state(),
      previous_page: opts.previous_page,
      current_page: opts.new_page,
    })

  const startPageViewingSessionLog = (): WorkingLog => ({
    ...generics.startViewingSession({ iid: options.iid }),
    ...session(),
  })

  const endPageViewingSessionLog = (): WorkingLog => ({
    ...generics.endViewingSession({ iid: options.iid }),
    ...session(),
  })

  /** Same event type as pdf_viewer_error, so errors from both viewers are counted together. */
  const pageViewerErrorLog =
    (opts: { error: ViewerError; source: string }): (() => WorkingLog) =>
    () => ({
      ...generics.error({ message: opts.error.message, code: String(opts.error.code) }),
      event_description: `Page viewer error in ${opts.source}: ${opts.error.message}`,
      action: 'page_viewer_error',
      viewer_error: { ...opts.error, source: opts.source },
      itemid: options.iid,
      ...session(),
      ...state(),
    })

  return {
    viewerControlLog,
    pageSelectionLog,
    startPageViewingSessionLog,
    endPageViewingSessionLog,
    pageViewerErrorLog,
  }
}

const getViewerNavigationLogs = (options: { iid: Ref<string>; eventUUID?: Ref<string> }) => {
  const uuid = uuidv4()
  const deviceFacts = getViewerDeviceFacts()

  // The log is created after navigation finishes, so the caller passes both viewers in. viewer_type
  // is the viewer the reader left, matching "the viewer active when the log fired".
  const viewerModeSwitchLog =
    (opts: {
      destination: string
      from: ViewerType
      to: ViewerType
      // Only the PDF viewer reports one, so a switch out of the page viewer has none.
      snapshot?: ViewerSessionSnapshot
    }): (() => WorkingLog) =>
    () => ({
      ...generics.linkClick(opts.destination, 'viewer_mode_switch'),
      event_uuid: options.eventUUID?.value ?? uuid,
      itemid: options.iid.value,
      viewer_type: opts.from,
      to_viewer: opts.to,
      ...deviceFacts,
      ...(opts.snapshot && {
        viewer_phase: opts.snapshot.phase,
        viewer_had_problem:
          opts.snapshot.hadError || opts.snapshot.stallCount > 0 || opts.snapshot.retried,
        viewer_diagnostics: {
          had_error: opts.snapshot.hadError,
          stall_count: opts.snapshot.stallCount,
          retried: opts.snapshot.retried,
          ms_in_viewer: opts.snapshot.msInViewer,
          pages_rendered: opts.snapshot.pagesRendered,
        },
      }),
    })

  return { viewerModeSwitchLog }
}

export const viewerLogs = {
  getPDFViewerLogs,
  getPageViewerLogs,
  getViewerNavigationLogs,
}
