import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'
import { toRaw, type Ref } from 'vue'
import { ViewerControls, type ViewerControlOptions, type ViewerError } from '@/interfaces/Viewer'
import type { PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs'
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { v4 as uuidv4 } from 'uuid'

const getPDFViewerLogs = (options: {
  iid: Ref<string>
  isReentryContent: Ref<boolean>
  viewer: Ref<PDFViewer>
  documentProxy: Ref<PDFDocumentProxy>
}) => {
  // This UUID is created when the Viewer component is created, and will be able to
  // link all viewer logs for a single document view session.
  const uuid = uuidv4()

  const errorLinkClickLog =
    (opts: { destination: string }): (() => WorkingLog) =>
    () => ({
      ...generics.linkClick(opts.destination),
      event_uuid: uuid,
      is_reentry_content: options.isReentryContent.value,
      total_pages: toRaw(options.documentProxy.value).numPages,
      current_page: toRaw(options.viewer.value).currentPageNumber,
    })

  const viewerControlLog =
    (opts: { action: ViewerControlOptions }): (() => WorkingLog) =>
    () => {
      return {
        ...generics.viewerControl({ action: opts.action, iid: options.iid.value }),
        event_uuid: uuid,
        is_reentry_content: options.isReentryContent.value,
        total_pages: toRaw(options.documentProxy.value).numPages,
        current_page: toRaw(options.viewer.value).currentPageNumber,
      }
    }

  const pageSelectionLog =
    (opts: { previous_page: number }): (() => WorkingLog) =>
    () => {
      return {
        ...generics.viewerControl({ action: ViewerControls.update_page, iid: options.iid.value }),
        event_uuid: uuid,
        is_reentry_content: options.isReentryContent.value,
        total_pages: toRaw(options.documentProxy.value).numPages,
        current_page: toRaw(options.viewer.value).currentPageNumber,
        previous_page: opts.previous_page,
      }
    }

  const pageScrollLog =
    (opts: { previous_page: number }): (() => WorkingLog) =>
    () => {
      return {
        ...generics.viewerControl({
          action: ViewerControls.scroll_to_page,
          iid: options.iid.value,
        }),
        event_uuid: uuid,
        is_reentry_content: options.isReentryContent.value,
        total_pages: toRaw(options.documentProxy.value).numPages,
        current_page: toRaw(options.viewer.value).currentPageNumber,
        previous_page: opts.previous_page,
      }
    }

  const startPDFViewingSessionLog = (): WorkingLog => {
    return {
      ...generics.startViewingSession({ iid: options.iid.value }),
      event_uuid: uuid,
      is_reentry_content: options.isReentryContent.value,
    }
  }

  const endPDFViewingSessionLog = (): WorkingLog => {
    return {
      ...generics.endViewingSession({ iid: options.iid.value }),
      event_uuid: uuid,
      is_reentry_content: options.isReentryContent.value,
    }
  }

  const PDFViewerErrorLog =
    (opts: { error: ViewerError }): (() => WorkingLog) =>
    () => {
      return {
        ...generics.error({ message: opts.error.message, code: String(opts.error.code) }),
        event_description: 'An error occurred in the PDF viewer',
        action: 'pdf_viewer_error',
        viewer_error: opts.error,
        event_uuid: uuid,
      }
    }

  return {
    errorLinkClickLog,
    viewerControlLog,
    pageSelectionLog,
    pageScrollLog,
    startPDFViewingSessionLog,
    endPDFViewingSessionLog,
    PDFViewerErrorLog,
  }
}

const getPageViewerLogs = (options: { iid: Ref<string> }) => {
  // This UUID is created when the Viewer component is created, and will be able to
  // link all viewer logs for a single document view session.
  const uuid = uuidv4()

  const viewerControlLog =
    (opts: { action: ViewerControlOptions }): (() => WorkingLog) =>
    () => {
      return {
        ...generics.viewerControl({ action: opts.action, iid: options.iid.value }),
        event_uuid: uuid,
      }
    }

  const pageSelectionLog =
    (opts: { previous_page: number; new_page: number }): (() => WorkingLog) =>
    () => {
      return {
        ...generics.viewerControl({ action: ViewerControls.update_page, iid: options.iid.value }),
        event_uuid: uuid,
        previous_page: opts.previous_page,
        current_page: opts.new_page,
      }
    }

  const startPageViewingSessionLog = (): WorkingLog => {
    return {
      ...generics.startViewingSession({ iid: options.iid.value }),
      event_uuid: uuid,
    }
  }

  const endPageViewingSessionLog = (): WorkingLog => {
    return {
      ...generics.endViewingSession({ iid: options.iid.value }),
      event_uuid: uuid,
    }
  }

  const pageViewerErrorLog =
    (opts: { error: ViewerError }): (() => WorkingLog) =>
    () => {
      return {
        ...generics.viewerControl({ action: ViewerControls.toggle_menu, iid: options.iid.value }),
        event_description: 'An error occurred in the page viewer',
        action: 'page_viewer_error',
        viewer_error: opts.error,
        event_uuid: uuid,
      }
    }

  return {
    viewerControlLog,
    pageSelectionLog,
    startPageViewingSessionLog,
    endPageViewingSessionLog,
    pageViewerErrorLog,
  }
}
export const viewerLogs = {
  getPDFViewerLogs,
  getPageViewerLogs,
}
