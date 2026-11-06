import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

type RecordedLog = Record<string, unknown> & {
  action?: string
  eventtype?: string
  event_uuid?: string
  viewer_error?: Record<string, unknown>
  viewer_diagnostics?: Record<string, unknown>
}

describe('Viewer logging', () => {
  const iid = '43e7b8c1-a49c-37c3-ad42-6016af1d0eb8'
  const markerKey = 'pdfViewerSession'
  let logs: RecordedLog[]

  /** Records every log beacon, optionally running extra setup before the app loads. */
  const visit = (path: string, setup?: (win: Cypress.AUTWindow) => void) => {
    handleLocation(path, cy, 'viewer', 'pep')
    cy.visit(path, {
      onBeforeLoad(win) {
        setup?.(win)
        cy.stub(win.navigator, 'sendBeacon').callsFake((_url, data) => {
          if (data instanceof win.Blob) {
            void data.text().then((body) => logs.push(JSON.parse(body)))
          }
          return true
        })
      },
    })
  }

  const logsFor = (action: string) => logs.filter((log) => log.action === action)

  /** Fails until a log with this action has been sent, then returns it. */
  const expectLog = (action: string) => {
    let found: RecordedLog | undefined
    cy.wrap(null).should(() => {
      found = logsFor(action)[0]
      expect(found, `${action} log`).not.to.equal(undefined)
    })
    return cy.then(() => found!)
  }

  const interceptApp = ({ pdf = 'ok' }: { pdf?: 'ok' | 'fail' } = {}) => {
    cy.intercept('GET', routes.auth.get, {
      fixture: 'auth/users/student__one_group_view_pdf__response.json',
    }).as('auth')
    cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
    cy.intercept('POST', routes.features.grouped.get, {
      fixture: 'auth/features/basic_features.json',
    }).as('features')
    cy.intercept('POST', routes.search.basic, {
      fixture: 'search/term_given__specified_id_limit_one__response.json',
    }).as('search')
    cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }).as(
      'alerts',
    )
    cy.intercept('GET', routes.documents.metadata(iid), {
      body: { id: iid, pageCount: 3 },
    }).as('metadata')
    cy.intercept('GET', `/api/v2/page/${iid}/*`, {
      fixture: 'pdf/0.jpeg,null',
      headers: { 'content-type': 'image/jpeg' },
    }).as('pageImage')
    if (pdf === 'fail') {
      cy.intercept('GET', routes.documents.pdfs(iid), { statusCode: 500 }).as('pdfDocument')
    } else {
      cy.intercept('GET', routes.documents.pdfs(iid), {
        fixture: 'pdf/open-access-sample.pdf,null',
        headers: { 'content-type': 'application/pdf' },
      }).as('pdfDocument')
    }
  }

  beforeEach(() => {
    logs = []
  })

  describe('PDF viewer diagnostics', () => {
    it('logs the load sequence for one session with top-level viewer fields', () => {
      interceptApp()
      visit(`/pdf/${iid}?term=&page=1`)
      cy.get('#viewer .page', { timeout: 20000 }).should('have.length.at.least', 1)
      expectLog('pdf_first_page_rendered')

      cy.then(() => {
        const sequence = [
          'pdf_environment',
          'pdf_load_started',
          'pdf_document_loaded',
          'pdf_pages_initialized',
          'pdf_first_page_rendered',
        ]
        const sent = sequence.map((action) => logsFor(action)[0])
        sent.forEach((log, index) => expect(log, sequence[index]).not.to.equal(undefined))
        expect(new Set(sent.map((log) => log.event_uuid)).size).to.equal(1)
        for (const log of sent) {
          expect(log).to.include({ eventtype: 'pep_fe_viewer_diagnostic', viewer_type: 'pdf' })
          expect(log.viewer_visibility).to.be.a('string')
          expect(log.chromium_major).to.be.a('number')
          expect(log.viewer_diagnostics!.ms_since_mount).to.be.a('number')
        }
        expect(logsFor('pdf_environment')[0]!.viewer_diagnostics).to.include({
          local_storage_available: true,
        })
        expect(logsFor('pdf_pages_initialized')[0]).to.include({ viewer_phase: 'ready' })
        expect(logsFor('pdf_load_started')[0]).to.include({ viewer_phase: 'loading_document' })
        expect(logsFor('pdf_document_loaded')[0]!.viewer_diagnostics).to.include({ num_pages: 3 })
      })
    })

    it('reports a previous session that never exited cleanly', () => {
      interceptApp()
      visit(`/pdf/${iid}?term=&page=1`, (win) => {
        win.localStorage.setItem(
          markerKey,
          JSON.stringify({
            event_uuid: 'previous-session',
            iid: 'earlier-item',
            started_at: Date.now() - 60_000,
            last_beat_at: Date.now() - 30_000,
            phase: 'ready',
            visibility: 'hidden',
            pages_rendered: 2,
            js_heap_used_mb: 120,
          }),
        )
      })
      expectLog('pdf_previous_session_unclean').then((log) => {
        expect(log).to.include({
          eventtype: 'pep_fe_viewer_diagnostic',
          previous_visibility: 'hidden',
        })
        expect(log.viewer_diagnostics).to.include({
          previous_event_uuid: 'previous-session',
          previous_phase: 'ready',
          previous_pages_rendered: 2,
        })
      })
    })

    it('removes its crash marker after a clean exit', () => {
      interceptApp()
      visit(`/pdf/${iid}?term=&page=1`)
      cy.get('#viewer .page', { timeout: 20000 }).should('have.length.at.least', 1)
      cy.window().then((win) => {
        expect(win.localStorage.getItem(markerKey)).to.be.a('string')
      })
      cy.get('[data-cy="nav-link-research"]').click()
      cy.get('[data-cy="nav-link-search"]').click()
      cy.location('pathname').should('eq', '/search')
      cy.window().then((win) => {
        expect(win.localStorage.getItem(markerKey)).to.equal(null)
      })
    })

    it('still renders and skips crash detection when storage is blocked', () => {
      interceptApp()
      visit(`/pdf/${iid}?term=&page=1`, (win) => {
        cy.stub(win.Storage.prototype, 'setItem').throws(new Error('storage blocked'))
      })
      cy.get('#viewer .page', { timeout: 20000 }).should('have.length.at.least', 1)
      expectLog('pdf_environment').then((log) => {
        expect(log.viewer_diagnostics).to.include({ local_storage_available: false })
      })
      cy.then(() => {
        expect(logsFor('pdf_previous_session_unclean')).to.have.length(0)
      })
    })
  })

  describe('viewer mode switches', () => {
    it('records the PDF viewer state when a reader leaves a failing PDF viewer', () => {
      interceptApp({ pdf: 'fail' })
      visit(`/pdf/${iid}?term=&page=1`)
      cy.get('.error-container').should('be.visible')
      cy.get('[data-cy="alternate-viewer-link"]').click()
      cy.get('.page-viewer').should('have.attr', 'aria-busy', 'false')

      expectLog('viewer_mode_switch').then((log) => {
        expect(log).to.include({
          eventtype: 'pep_fe_link_click',
          viewer_type: 'pdf',
          to_viewer: 'page',
          viewer_phase: 'failed',
          viewer_had_problem: true,
        })
        expect(log.chromium_major).to.be.a('number')
        expect(log.viewer_diagnostics).to.include({ had_error: true, retried: false })
        expect(log.viewer_diagnostics!.ms_in_viewer).to.be.a('number')
      })
    })

    it('records a healthy PDF viewer and the return switch from the page viewer', () => {
      interceptApp()
      visit(`/pdf/${iid}?term=&page=1`)
      cy.get('#viewer .page', { timeout: 20000 }).should('have.length.at.least', 1)
      expectLog('pdf_first_page_rendered')
      cy.get('[data-cy="alternate-viewer-link"]').click()
      cy.get('.page-viewer').should('have.attr', 'aria-busy', 'false')
      cy.get('[data-cy="alternate-viewer-link"]').click()
      cy.get('.page-selector__input').should('have.value', '1')

      cy.wrap(null).should(() => expect(logsFor('viewer_mode_switch')).to.have.length(2))
      cy.then(() => {
        const [toPage, toPDF] = logsFor('viewer_mode_switch')
        expect(toPage).to.include({
          viewer_type: 'pdf',
          to_viewer: 'page',
          viewer_phase: 'ready',
          viewer_had_problem: false,
        })
        expect(toPage!.viewer_diagnostics!.pages_rendered).to.be.at.least(1)
        // The page viewer reports no PDF snapshot, only the direction and device facts.
        expect(toPDF).to.include({ viewer_type: 'page', to_viewer: 'pdf' })
        expect(toPDF).not.to.have.property('viewer_had_problem')
        expect(toPDF!.event_uuid).to.equal(toPage!.event_uuid)
      })
    })
  })

  describe('page viewer', () => {
    const openPageViewer = (index = '0') => visit(`/page/${iid}/${index}?term=history&page=2`)

    it('tags control logs with viewer type, phase, and page position', () => {
      interceptApp()
      openPageViewer()
      cy.get('.page-viewer').should('have.attr', 'aria-busy', 'false')
      cy.get('.control-bar [aria-label="Zoom in"]').filter(':visible').first().click()
      expectLog('zoom-in').then((log) => {
        expect(log).to.include({
          eventtype: 'pep_fe_viewer_control',
          viewer_type: 'page',
          viewer_phase: 'ready',
          current_page: 1,
          total_pages: 3,
        })
        expect(log.chromium_major).to.be.a('number')
      })
    })

    it('logs a metadata failure as an error with its stage', () => {
      interceptApp()
      cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 404 }).as('metadata')
      openPageViewer()
      cy.get('[data-cy="page-viewer-error"]').should('be.visible')
      expectLog('page_viewer_error').then((log) => {
        expect(log).to.include({
          eventtype: 'pep_fe_error',
          viewer_type: 'page',
          viewer_phase: 'loading_metadata',
          itemid: iid,
        })
        expect(log.viewer_error).to.include({
          source: 'PageViewer.vue:loadMetadata',
          code: 404,
          status: true,
        })
      })
    })

    it('names a missing page count so provider image gaps are countable', () => {
      interceptApp()
      cy.intercept('GET', routes.documents.metadata(iid), { body: { id: iid } }).as('metadata')
      openPageViewer()
      cy.get('[data-cy="page-viewer-error"]').should('be.visible')
      expectLog('page_viewer_error').then((log) => {
        expect(log.viewer_error).to.include({
          name: 'PageImagesUnavailable',
          source: 'PageViewer.vue:loadMetadata',
        })
      })
    })

    it('logs a failed page image with its page position', () => {
      interceptApp()
      cy.intercept('GET', routes.documents.pages(iid, '0'), { statusCode: 404 }).as('missingImage')
      openPageViewer()
      cy.get('[data-cy="page-viewer-error"]').should('be.visible')
      expectLog('page_viewer_error').then((log) => {
        expect(log).to.include({
          eventtype: 'pep_fe_error',
          viewer_phase: 'loading_page',
          current_page: 1,
          total_pages: 3,
        })
        expect(log.viewer_error).to.include({ source: 'PageViewer.vue:openPage', code: 404 })
      })
    })
  })
})
