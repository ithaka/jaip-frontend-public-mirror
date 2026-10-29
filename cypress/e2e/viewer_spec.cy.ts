import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'
import { decodePDFJSEncodedBMP, initPDFWorkerPolyfills } from '../../src/utils/polyfills'

// These tests seem to be taking an unusually long time, so we're increasing the timeout. That's resulting in
// consistent test passing.
// NOTE: The page viewer (/page/:iid/:pid) no longer renders its own view; it redirects to the pdf viewer
// (/pdf/:iid), so these tests exercise the pdf viewer route directly.
describe('PDF Viewer Access', () => {
  const iid = '43e7b8c1-a49c-37c3-ad42-6016af1d0eb8'

  it('uses the viewer error action for cancellation logs when navigating away', () => {
    const route = `/pdf/${iid}?term=&page=1`
    let pdfRequestStarted = false
    const beaconBodies: Promise<string>[] = []

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
    cy.intercept('GET', routes.documents.pdfs(iid), (req) => {
      pdfRequestStarted = true
      req.reply({
        delay: 3000,
        fixture: 'pdf/open-access-sample.pdf,null',
        headers: { 'content-type': 'application/pdf' },
      })
    }).as('pdfDocument')
    handleLocation(route, cy, 'pdf-viewer-navigation', 'pep')

    cy.visit(route, {
      onBeforeLoad(win) {
        cy.stub(win.navigator, 'sendBeacon').callsFake((_url, data) => {
          if (data instanceof win.Blob) beaconBodies.push(data.text())
          return true
        })
      },
    })
    cy.wait(['@pdf-viewer-navigation', '@alerts', '@env', '@auth', '@search'], {
      requestTimeout: 20000,
    })
    cy.wrap(null).should(() => expect(pdfRequestStarted).to.equal(true))

    cy.get('[data-cy="nav-link-research"]').click()
    cy.get('[data-cy="nav-link-search"]').click()
    cy.location('pathname').should('eq', '/search')
    cy.get('#viewer-container').should('not.exist')
    cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
      const logs = bodies.map((body) => JSON.parse(body))
      const viewerErrors = logs.filter(
        (log) => log.eventtype === 'pep_fe_error' && log.component === 'PDFViewer',
      )
      expect(logs.filter((log) => log.action === 'pdf_viewer_loading_cancelled')).to.have.length(0)
      for (const log of viewerErrors) {
        expect(log).to.include({
          action: 'pdf_viewer_error',
          reason: 'PDF loading cancelled: component_unmounted',
        })
        expect(log.viewer_error).to.include({
          status: false,
          source: 'PDFViewer.vue:createLoadingTask',
        })
        expect(log.viewer_error.reported_stack).to.be.a('string').and.not.equal('')
        expect(log.event_description).to.contain(log.viewer_error.message)
      }
      expect(
        logs.filter((log) =>
          ['start_viewing_session', 'end_viewing_session'].includes(log.action ?? ''),
        ),
      ).to.have.length(0)
    })
  })

  it('redirects the page viewer route to the pdf viewer route', () => {
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
    cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 200, body: '' }).as(
      'metadata',
    )
    handleLocation(`/page/${iid}/0`, cy, 'viewer', 'pep')

    cy.visit(`/page/${iid}/0`)
    cy.wait(['@viewer', '@alerts', '@env', '@auth', '@search'], {
      requestTimeout: 20000,
    })
    cy.location('pathname').should('eq', `/pdf/${iid}`)
  })

  context('As student', () => {
    beforeEach(() => {
      const route = `/pdf/${iid}?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/student__one_group_view_pdf__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one__response.json',
      }).as('search')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 200, body: '' }).as(
        'metadata',
      )
      handleLocation(route, cy, 'viewer', 'pep')

      cy.visit(route)
      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@search'], {
        requestTimeout: 20000,
      })
    })

    // NOTE: There are no pep-pharos-buttons on the student PDF viewer. This means we can't
    // check for a specific button, but we can check that there are no buttons. We just repeat
    // the same test for print.
    it('does not show a back link when the item is opened directly', () => {
      cy.get('[data-cy="back-to-results-link"]').should('not.exist')
    })

    it('does not show download button', () => {
      cy.get('[data-cy="download-pdf-button"]').should('not.exist')
    })

    it('does not show print button', () => {
      cy.get('[data-cy="print-pdf-button"]').should('not.exist')
    })
  })

  context('As student with restricted item', () => {
    beforeEach(() => {
      const route = `/pdf/${iid}?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/student__one_group_media_access__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one_restricted__response.json',
      }).as('search')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 200, body: '' }).as(
        'metadata',
      )
      handleLocation(route, cy, 'viewer', 'pep')

      cy.visit(route)

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@search'], {
        requestTimeout: 20000,
      })
    })

    it('does not show download button', () => {
      cy.get('[data-cy="download-pdf-button"]').should('not.exist')
    })

    it('does not show print button', () => {
      cy.get('[data-cy="print-pdf-button"]').should('not.exist')
    })

    it('shows item unavailable', () => {
      cy.get('.search-result')
        .contains('Item unavailable', { matchCase: false })
        .should('be.visible')
    })
  })

  context('As admin', () => {
    beforeEach(() => {
      const route = `/pdf/${iid}?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/admin__one_group_view_pdf__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one__response.json',
      }).as('search')
      cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 200, body: '' }).as(
        'metadata',
      )
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      handleLocation(route, cy, 'viewer', 'pep-admin')

      cy.visit(route)

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@features', '@search'], {
        requestTimeout: 20000,
      })
    })

    it('does not show download button', () => {
      cy.get('pep-pharos-button').contains('Download', { matchCase: false }).should('not.exist')
    })

    it('does not show print button', () => {
      cy.get('pep-pharos-button').contains('Print', { matchCase: false }).should('not.exist')
    })
  })

  context('As student with media access', () => {
    beforeEach(() => {
      const route = `/pdf/${iid}?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/student__one_group_media_access__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one__response.json',
      }).as('search')
      cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 200, body: '' }).as(
        'metadata',
      )
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      handleLocation(route, cy, 'viewer', 'pep')

      cy.visit(route)

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@search'], {
        requestTimeout: 20000,
      })
    })
    it('does not show view pdf button', () => {
      cy.get('pep-pharos-button').contains('View PDF', { matchCase: false }).should('not.exist')
    })
    it('shows download button', () => {
      cy.get('pep-pharos-button').contains('Download', { matchCase: false }).should('be.visible')
    })
    it('shows print button', () => {
      cy.get('pep-pharos-button').contains('Print', { matchCase: false }).should('be.visible')
    })
  })

  context('As admin with media access', () => {
    beforeEach(() => {
      const route = `/pdf/${iid}?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/admin__one_group_media_access__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one__response.json',
      }).as('search')
      cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 200, body: '' }).as(
        'metadata',
      )
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      handleLocation(route, cy, 'viewer', 'pep-admin')

      cy.visit(route)

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@features', '@search'], {
        requestTimeout: 20000,
      })
    })

    it('does not show view pdf button', () => {
      cy.get('pep-pharos-button').contains('View PDF', { matchCase: false }).should('not.exist')
    })
    it('shows download button', () => {
      cy.get('pep-pharos-button').contains('Download', { matchCase: false }).should('be.visible')
      // We used to verify that the file download worked, because the download button created a blob based on the
      // previously downloaded base64 encoded pdf. The download button now uses the same endpoint as the view pdf
      // button, so there's little point in verifying that the download works, because it would only be verifying that
      // we've intercepted an http request. We can, however, verify that the button exists.
    })

    it('shows print button', () => {
      cy.get('pep-pharos-button').contains('Print', { matchCase: false }).should('be.visible')
      // Actual print behavior is very difficult to test, apparently. So long as the button exists, we should be okay though,
      // with the probable exception of IE.
    })
  })

  context('As admin with manage restricted list', () => {
    beforeEach(() => {
      const route = `/pdf/${iid}?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture:
          'auth/users/admin__ungrouped_manage_restricted_list_one_group_media_access__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one_restricted__response.json',
      }).as('search')
      cy.intercept('GET', routes.documents.metadata(iid), { statusCode: 200, body: '' }).as(
        'metadata',
      )
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      handleLocation(route, cy, 'viewer', 'pep-admin')

      cy.visit(route)

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@features', '@search'], {
        requestTimeout: 20000,
      })
    })

    it('shows restricted label', () => {
      cy.get('pep-pharos-heading').contains('Restricted', { matchCase: false }).should('be.visible')
    })
    it('shows unrestrict button', () => {
      cy.get('pep-pharos-button').contains('Unrestrict', { matchCase: false }).should('be.visible')
    })
  })

  context('PDF viewer reliability', () => {
    // Keep requests on one fixture document so failures and replacement attempts are countable.
    const pdfRoute = `/pdf/${iid}?term=&page=1`
    // Actual worker lifetimes expose leaks and retry overlap that request counts alone cannot show.
    let activeWorkers = 0
    let peakWorkers = 0
    // Rendering injection is independent of page-fetch injection and can fail one or all attempts.
    let injectedFailures = 0
    let failuresToInject = 0
    let renderFailureMessage = 'Injected PDF canvas failure'
    let renderFailureName = 'Error'
    let renderFailureStatus = 0
    // Page numbers are one-based here; the PDF.js worker protocol uses zero-based pageIndex.
    let failedPage = 0
    let pageFailureStatus = 404
    let pageFailureMessage = ''
    let pageFailuresToInject = Number.POSITIVE_INFINITY
    let imageFailuresToInject = 0
    let injectedImageFailures = 0
    let failSharedImage = false
    let hideWorkerPort = false
    /** How the worker answers PDF.js's Terminate request when a document is released. */
    let terminateMode: 'normal' | 'stuck' | 'rejected' = 'normal'
    let useMainThreadWorker = false
    /** Worker startup failures, telemetry availability, and observed stale-import notifications. */
    let workerFailureMode: 'none' | 'constructor' | 'startup' = 'none'
    let beaconMode: 'accepted' | 'rejected' | 'throwing' | 'missing' = 'accepted'
    let preloadFailures = 0
    const workers: Worker[] = []
    const workerDocumentIds = new Map<Worker, string>()
    let unsupportedBrowser = false
    /** Effective worker asset URLs and font settings captured from document-loading messages. */
    let cMapUrl = ''
    let cMapPacked = false
    let standardFontDataUrl = ''
    let wasmUrl = ''
    let useSystemFonts = false
    // Beacon bodies resolve asynchronously; retain them until assertions can inspect complete logs.
    const beaconBodies: Promise<string>[] = []

    /**
     * Opens the production viewer with worker accounting, controlled failures, and log capture.
     * @param options - Set expectDocument to false when startup should fail before fetching the PDF.
     */
    const visitPDF = ({ expectDocument = true } = {}) => {
      cy.visit(pdfRoute, {
        /** Installs instrumentation before application imports can construct a worker or render. */
        onBeforeLoad(win) {
          /** Counts Vite's event once and suppresses the application's stale-build reload in tests. */
          win.addEventListener('vite:preloadError', (event) => {
            preloadFailures++
            event.stopImmediatePropagation()
          })
          if (unsupportedBrowser)
            Object.defineProperty(win, 'structuredClone', { value: undefined })
          if (useMainThreadWorker)
            cy.stub(win.navigator, 'userAgent').value('Mozilla/5.0 Firefox/91.0')
          // Extend the real worker so the tests still exercise PDF.js's production message transport.
          const NativeWorker = win.Worker
          win.Worker = class extends NativeWorker {
            // PDF.js can request destruction through more than one cleanup path.
            private terminated = false
            // Message listeners added after GetDocRequest: PDF.js's document handler, then the app's.
            private documentMessageListeners = 0

            /** Counts creation without replacing the native constructor or worker script. */
            constructor(url: string | URL, options?: WorkerOptions) {
              if (workerFailureMode === 'constructor')
                throw new win.DOMException('Injected worker construction failure', 'SecurityError')
              super(url, options)
              activeWorkers++
              peakWorkers = Math.max(peakWorkers, activeWorkers)
              workers.push(this)
              if (workerFailureMode === 'startup')
                queueMicrotask(() => this.dispatchEvent(new win.Event('error')))
            }

            /**
             * Rejects the app's image observer, like a port whose PDF.js internals differ. After
             * GetDocRequest, PDF.js attaches its own document handler first; the observer is next.
             */
            addEventListener(
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: boolean | AddEventListenerOptions,
            ) {
              if (
                type === 'message' &&
                hideWorkerPort &&
                workerDocumentIds.has(this) &&
                ++this.documentMessageListeners > 1
              )
                throw new win.DOMException('Injected port failure', 'InvalidStateError')
              super.addEventListener(type, listener, options)
            }

            /** Counts the first termination only, while preserving native termination behavior. */
            terminate() {
              if (!this.terminated) {
                this.terminated = true
                activeWorkers--
              }
              super.terminate()
            }

            /**
             * Captures document options and can reject a page request using PDF.js's reply protocol.
             *
             * @param message - The real outgoing worker message.
             * @param transfer - Transfer list or options, matching both native overloads.
             */
            postMessage(
              message: Parameters<Worker['postMessage']>[0],
              transfer: Transferable[] | StructuredSerializeOptions = {},
            ) {
              if (message.action === 'GetDocRequest') {
                workerDocumentIds.set(this, message.data.docId)
                cMapUrl = message.data.evaluatorOptions.cMapUrl
                cMapPacked = message.data.evaluatorOptions.cMapPacked
                standardFontDataUrl = message.data.evaluatorOptions.standardFontDataUrl
                wasmUrl = message.data.evaluatorOptions.wasmUrl
                useSystemFonts = message.data.evaluatorOptions.useSystemFonts
              }
              if (message.action === 'Terminate' && terminateMode !== 'normal') {
                // A stuck worker never replies; a failed one rejects with PDF.js's reply protocol.
                if (terminateMode === 'rejected') {
                  queueMicrotask(() =>
                    this.dispatchEvent(
                      new win.MessageEvent('message', {
                        data: {
                          sourceName: message.targetName,
                          targetName: message.sourceName,
                          callback: 2,
                          callbackId: message.callbackId,
                          reason: {
                            name: 'UnknownErrorException',
                            message: 'Injected terminate failure',
                          },
                        },
                      }),
                    ),
                  )
                }
                return
              }
              if (message.action === 'GetOperatorList' && imageFailuresToInject > 0) {
                imageFailuresToInject--
                injectedImageFailures++
                queueMicrotask(() =>
                  this.dispatchEvent(
                    new win.MessageEvent('message', {
                      data: {
                        sourceName: message.targetName,
                        targetName: message.sourceName,
                        action: failSharedImage ? 'commonobj' : 'obj',
                        data: failSharedImage
                          ? ['injected_missing_image', 'Image', null]
                          : ['injected_missing_image', message.data.pageIndex, 'Image', null],
                      },
                    }),
                  ),
                )
              }
              if (
                message.action === 'GetPage' &&
                message.data?.pageIndex === failedPage - 1 &&
                pageFailuresToInject > 0
              ) {
                pageFailuresToInject--
                // callback=2 is a rejected sendWithPromise reply; preserve names and correlation ID.
                queueMicrotask(() =>
                  this.dispatchEvent(
                    new win.MessageEvent('message', {
                      data: {
                        sourceName: message.targetName,
                        targetName: message.sourceName,
                        callback: 2,
                        callbackId: message.callbackId,
                        reason: {
                          name: pageFailureStatus ? 'ResponseException' : 'UnknownErrorException',
                          message:
                            pageFailureMessage ||
                            (pageFailureStatus
                              ? 'Injected page request failure'
                              : 'Failed to fetch'),
                          ...(pageFailureStatus && { status: pageFailureStatus }),
                        },
                      },
                    }),
                  ),
                )
                return
              }
              if (Array.isArray(transfer)) super.postMessage(message, transfer)
              else super.postMessage(message, transfer)
            }
          }
          // Ignore PDF.js's tiny feature probes: only fail painting a real page-sized surface.
          const nativeFillRect = win.CanvasRenderingContext2D.prototype.fillRect
          cy.stub(win.CanvasRenderingContext2D.prototype, 'fillRect').callsFake(function (
            this: CanvasRenderingContext2D,
            ...args: Parameters<CanvasRenderingContext2D['fillRect']>
          ) {
            if (
              this.canvas.width > 100 &&
              this.canvas.height > 100 &&
              injectedFailures < failuresToInject
            ) {
              injectedFailures++
              throw Object.assign(new Error(renderFailureMessage), {
                name: renderFailureName,
                status: renderFailureStatus,
              })
            }
            return nativeFillRect.apply(this, args)
          })
          // Capture logs locally without relying on a backend beacon endpoint.
          if (beaconMode === 'missing') {
            Object.defineProperty(win.navigator, 'sendBeacon', { value: undefined })
          } else {
            cy.stub(win.navigator, 'sendBeacon').callsFake((_url, data) => {
              if (beaconMode === 'throwing') throw new Error('Injected Beacon API failure')
              if (data instanceof win.Blob) beaconBodies.push(data.text())
              return beaconMode !== 'rejected'
            })
          }
        },
      })
      cy.wait(['@pdf-reliability', '@auth', '@search'])
      if (!unsupportedBrowser && expectDocument) cy.wait('@pdfDocument')
    }

    /**
     * Exercises Vue Router's same-component navigation without reloading the application.
     * @param documentId - Target document ID to expose through the history and popstate APIs.
     */
    const navigateToPDF = (documentId: string) =>
      cy.window().then((win) => {
        /** Replacement URL retains the query shape expected by the PDF route. */
        const nextRoute = `/pdf/${documentId}?term=&page=1`
        win.history.pushState({ ...win.history.state, current: nextRoute }, '', nextRoute)
        win.dispatchEvent(new win.PopStateEvent('popstate', { state: win.history.state }))
      })

    /** Checks that destruction did not encounter the historical Vue-proxy/private-field failure. */
    const expectNoCleanupErrors = () => {
      cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
        expect(bodies.join('\n')).not.to.contain('Unable to release PDF resources')
        expect(bodies.join('\n')).not.to.contain('private member')
      })
    }

    /**
     * Requires one terminal viewer error, preventing duplicate logs or an invisible retry loop.
     *
     * @param code - Expected HTTP status, or zero when no HTTP response exists.
     * @param message - Original failure text that normalization must preserve.
     */
    const expectLoggedError = (code: number, message: string) => {
      cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
        // Other interaction logs are expected; only viewer errors count toward terminal reporting.
        const errors = bodies
          .map((body) => JSON.parse(body))
          .filter((log) => log.eventtype === 'pep_fe_error' && log.component === 'PDFViewer')
        expect(errors).to.have.length(1)
        expect(errors[0].action).to.equal('pdf_viewer_error')
        expect(errors[0].itemid).to.equal(iid)
        expect(errors[0].is_reentry_content).to.equal(false)
        expect(errors[0].viewer_error.code).to.equal(code)
        expect(errors[0].viewer_error.message).to.contain(message)
        expect(errors[0].viewer_error.source).to.match(/^PDFViewer\.vue:/)
        expect(errors[0].viewer_error.reported_stack).to.be.a('string').and.not.equal('')
        expect(errors[0].event_description).to.contain(errors[0].viewer_error.message)
        expect(errors[0].event_description).to.contain(errors[0].viewer_error.source)
      })
    }

    // Reset injection/accounting between tests and stub only external application dependencies.
    beforeEach(() => {
      activeWorkers = 0
      peakWorkers = 0
      injectedFailures = 0
      failuresToInject = 0
      renderFailureMessage = 'Injected PDF canvas failure'
      renderFailureName = 'Error'
      renderFailureStatus = 0
      failedPage = 0
      pageFailureStatus = 404
      pageFailureMessage = ''
      pageFailuresToInject = Number.POSITIVE_INFINITY
      imageFailuresToInject = 0
      injectedImageFailures = 0
      failSharedImage = false
      hideWorkerPort = false
      terminateMode = 'normal'
      useMainThreadWorker = false
      workerFailureMode = 'none'
      beaconMode = 'accepted'
      preloadFailures = 0
      workers.length = 0
      workerDocumentIds.clear()
      unsupportedBrowser = false
      cMapUrl = ''
      cMapPacked = false
      standardFontDataUrl = ''
      wasmUrl = ''
      useSystemFonts = false
      beaconBodies.length = 0
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/admin__one_group_media_access__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' })
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      })
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one__response.json',
      }).as('search')
      cy.intercept('GET', routes.alerts.get, { body: { alerts: [], count: 0 } })
      cy.intercept('GET', routes.documents.pdfs(iid), {
        fixture: 'pdf/open-access-sample.pdf,null',
        headers: { 'content-type': 'application/pdf' },
      }).as('pdfDocument')
      handleLocation(pdfRoute, cy, 'pdf-reliability', 'pep')
    })

    /** Each real-worker startup failure must reach PDF.js's automatic main-thread fallback. */
    for (const failureMode of ['constructor', 'startup'] as const) {
      it(`renders with automatic fallback after a worker ${failureMode} failure`, () => {
        workerFailureMode = failureMode
        visitPDF()
        cy.get('#viewer .page canvas').first().should('be.visible')
        cy.get('#viewer .page .textLayer span').should('have.length.at.least', 1)
        cy.get('.control-bar').should('be.visible')
        cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
        cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
          /** Successful fallback must not produce an application-level viewer error. */
          const errors = bodies
            .map((body) => JSON.parse(body))
            .filter((log) => log.action === 'pdf_viewer_error')
          expect(errors).to.have.length(0)
        })
      })
    }

    it('reopens a document after automatic worker fallback', () => {
      workerFailureMode = 'constructor'
      visitPDF()
      cy.get('#viewer .page canvas').first().should('be.visible')
      cy.get('[data-cy="nav-link-research"]').click()
      cy.get('[data-cy="nav-link-search"]').click()
      cy.location('pathname').should('eq', '/search')
      cy.window().then((win) => win.history.back())
      cy.location('pathname').should('eq', `/pdf/${iid}`)
      cy.wait('@pdfDocument')
      cy.get('#viewer .page canvas').first().should('be.visible')
      cy.get('#viewer .page .textLayer span').should('have.length.at.least', 1)
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
      expectNoCleanupErrors()
    })

    /** Covers explicit legacy-browser fallback and automatic fallback after worker failure. */
    for (const mainThread of [false, true]) {
      it(`forwards a stale worker asset once during ${mainThread ? 'explicit' : 'automatic'} fallback`, () => {
        useMainThreadWorker = mainThread
        if (!mainThread) workerFailureMode = 'constructor'
        cy.intercept('GET', /\/pdf-worker-entry[-.][\w-]+\.(?:m?js)$/, {
          statusCode: 404,
        })
        visitPDF({ expectDocument: false })
        cy.contains(mainThread ? 'Item not viewable on this device' : 'Item not available').should(
          'be.visible',
        )
        cy.get('#viewer canvas').should('not.exist')
        cy.wrap(null).should(() => {
          expect(preloadFailures).to.equal(1)
          expect(activeWorkers).to.equal(0)
        })
        expectLoggedError(0, 'Failed to fetch')
      })
    }

    it('reports an automatic fallback bundle that does not register its handler', () => {
      workerFailureMode = 'constructor'
      cy.intercept('GET', /\/pdf-worker-entry[-.][\w-]+\.(?:m?js)$/, {
        body: 'globalThis.pdfjsWorker = {};',
        headers: { 'content-type': 'text/javascript' },
      })
      visitPDF({ expectDocument: false })
      cy.get('[data-cy="item-not-available"]').should('be.visible')
      cy.get('#viewer canvas').should('not.exist')
      expectLoggedError(0, 'did not register WorkerMessageHandler.setup')
    })

    /** Beacon refusal, exceptions, and missing API support must leave viewer controls usable. */
    for (const mode of ['rejected', 'throwing', 'missing'] as const) {
      it(`renders and handles controls when telemetry is ${mode}`, () => {
        beaconMode = mode
        visitPDF()
        cy.get('#viewer .page canvas').first().should('be.visible')
        cy.get('.control-bar__actions-right button[aria-label="Rotate clockwise"]').click()
        cy.get('#viewer .page .textLayer')
          .first()
          .invoke('attr', 'data-main-rotation')
          .should('contain', '90')
        cy.wrap(null).should(() => expect(activeWorkers).to.equal(1))
      })
    }

    /**
     * Renders the first PDF, applies a Terminate behavior, then navigates to a second PDF so the
     * first document's release overlaps the second document's load.
     *
     * @param mode - How the first worker answers its Terminate request.
     * @returns The second document's ID.
     */
    const openSecondPDFAfterTerminate = (mode: typeof terminateMode) => {
      const secondId = '11111111-2222-3333-4444-555555555555'
      visitPDF()
      cy.get('#viewer .page canvas').first().should('be.visible')
      cy.then(() => {
        terminateMode = mode
      })
      cy.fixture('search/term_given__specified_id_limit_one__response.json').then((response) => {
        cy.intercept('POST', routes.search.basic, {
          ...response,
          docs: [{ ...response.docs[0], iid: secondId, title: 'Second document' }],
        }).as('secondSearch')
      })
      cy.intercept('GET', routes.documents.pdfs(secondId), {
        fixture: 'pdf/open-access-sample.pdf,null',
        headers: { 'content-type': 'application/pdf' },
      }).as('secondDocument')
      navigateToPDF(secondId)
      return secondId
    }

    it('loads the next document after a worker never finishes terminating', () => {
      openSecondPDFAfterTerminate('stuck')
      cy.contains('Second document').should('be.visible')
      // The wait is bounded (3s), so the second document must still render after it.
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 15000 }).should('be.visible')
      cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
        const errors = bodies
          .map((body) => JSON.parse(body))
          .filter((log) => log.eventtype === 'pep_fe_error' && log.component === 'PDFViewer')
        expect(
          errors.filter((log) => log.viewer_error.message.includes('did not finish disposal')),
        ).to.have.length(1)
      })
    })

    it('loads the next document after a worker fails to terminate', () => {
      openSecondPDFAfterTerminate('rejected')
      cy.contains('Second document').should('be.visible')
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 15000 }).should('be.visible')
      cy.get('#viewer-container').should('exist')
      cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
        const logged = bodies.join('\n')
        // The failed release is reported once, but it must not surface as a load error.
        expect(logged).to.contain('Unable to release PDF resources')
        expect(logged).not.to.contain('Unknown Error')
      })
    })

    it('replaces the document and metadata during same-route navigation', () => {
      /** Destination identity and original canvas establish that navigation replaces the viewer. */
      const secondId = '11111111-2222-3333-4444-555555555555'
      let previousCanvas: HTMLCanvasElement
      visitPDF()
      cy.get<HTMLCanvasElement>('#viewer .page canvas')
        .first()
        .should('be.visible')
        .then(($canvas) => {
          previousCanvas = $canvas[0]
        })
      cy.fixture('search/term_given__specified_id_limit_one__response.json').then((response) => {
        cy.intercept('POST', routes.search.basic, {
          ...response,
          docs: [{ ...response.docs[0], iid: secondId, title: 'Second document' }],
        }).as('secondSearch')
      })
      cy.intercept('GET', routes.documents.pdfs(secondId), {
        fixture: 'pdf/open-access-sample.pdf,null',
        headers: { 'content-type': 'application/pdf' },
      }).as('secondDocument')
      navigateToPDF(secondId)
      cy.wait(['@secondSearch', '@secondDocument'])
      cy.location('pathname').should('eq', `/pdf/${secondId}`)
      cy.contains('Second document').should('be.visible')
      cy.get<HTMLCanvasElement>('#viewer .page canvas')
        .first()
        .should('be.visible')
        .then(($canvas) => {
          expect($canvas[0]).not.to.equal(previousCanvas)
          expect(previousCanvas.isConnected).to.equal(false)
        })
      cy.wrap(null).should(() => {
        expect(activeWorkers).to.equal(1)
        expect(peakWorkers).to.equal(1)
      })
      expectNoCleanupErrors()
    })

    it('ignores a stale metadata response after another PDF route is selected', () => {
      /** Ordered route identities and a release callback force the older metadata response to finish last. */
      const staleId = '11111111-2222-3333-4444-555555555555'
      const latestId = '22222222-3333-4444-5555-666666666666'
      let releaseStaleSearch: (() => void) | undefined
      visitPDF()
      cy.get('#viewer .page canvas').first().should('be.visible')
      cy.fixture('search/term_given__specified_id_limit_one__response.json').then((response) => {
        cy.intercept('POST', routes.search.basic, (request) => {
          if (request.body.query === `id:${staleId}`) {
            request.alias = 'staleSearch'
            return new Cypress.Promise<void>((resolve) => {
              releaseStaleSearch = () => {
                request.reply({
                  ...response,
                  docs: [{ ...response.docs[0], iid: staleId, title: 'Stale document' }],
                })
                resolve()
              }
            })
          }
          request.alias = 'latestSearch'
          request.reply({
            ...response,
            docs: [{ ...response.docs[0], iid: latestId, title: 'Latest document' }],
          })
        })
      })
      /** Both route targets serve valid PDFs so metadata ordering is the only injected failure. */
      for (const documentId of [staleId, latestId]) {
        cy.intercept('GET', routes.documents.pdfs(documentId), {
          fixture: 'pdf/open-access-sample.pdf,null',
          headers: { 'content-type': 'application/pdf' },
        })
      }
      navigateToPDF(staleId)
      cy.wrap(null).should(() => expect(releaseStaleSearch).to.be.a('function'))
      navigateToPDF(latestId)
      cy.wait('@latestSearch')
      cy.contains('Latest document').should('be.visible')
      cy.then(() => releaseStaleSearch?.())
      cy.wait('@staleSearch')
      cy.get('.search-result')
        .should('contain', 'Latest document')
        .and('not.contain', 'Stale document')
      cy.get('#viewer .page canvas').first().should('be.visible')
      cy.wrap(null).should(() => {
        expect(activeWorkers).to.equal(1)
        expect(peakWorkers).to.equal(1)
      })
      expectNoCleanupErrors()
    })

    for (const mainThread of [false, true]) {
      it(`reports actual JPEG decoding failures with a ${mainThread ? 'main-thread' : 'real'} worker`, () => {
        useMainThreadWorker = mainThread
        cy.intercept('GET', routes.documents.pdfs(iid), {
          fixture: 'pdf/invalid-image.pdf,null',
          headers: { 'content-type': 'application/pdf' },
        }).as('pdfDocument')
        visitPDF()
        cy.contains('Item not viewable on this device', { timeout: 20000 }).should('be.visible')
        cy.get('@pdfDocument.all').should('have.length', 2)
        cy.wrap(null).should(() => {
          expect(activeWorkers).to.equal(0)
          expect(peakWorkers).to.equal(mainThread ? 0 : 1)
        })
        cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
          const errors = bodies
            .map((body) => JSON.parse(body))
            .filter((log) => log.action === 'pdf_viewer_error')
          expect(errors).to.have.length(2)
          for (const log of errors) {
            expect(log.viewer_error.name).to.equal('PDFImageDecodeError')
            expect(log.viewer_error.message).to.contain('The rendered content is incomplete')
            expect(log.itemid).to.equal(iid)
            expect(log.total_pages).to.equal(1)
          }
        })
        expectNoCleanupErrors()
      })
    }

    it('configures lazily fetched packed CMaps and serves the actual bundled font map', () => {
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.readFile<{ version: string }>('node_modules/pdfjs-dist/package.json').then((pdfjs) => {
        expect(cMapPacked).to.equal(true)
        expect(cMapUrl).to.contain(`/scripts/pdfjs/${pdfjs.version}/cmaps/`)
        cy.readFile('node_modules/pdfjs-dist/cmaps/UniJIS-UTF16-H.bcmap', 'binary').then(
          (expected) => {
            cy.request({ url: `${cMapUrl}UniJIS-UTF16-H.bcmap`, encoding: 'binary' }).then(
              (response) => {
                expect(response.status).to.equal(200)
                expect(response.body).to.equal(expected)
              },
            )
          },
        )
      })
    })

    it('serves standard font fallbacks while retaining system fonts', () => {
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.readFile<{ version: string }>('node_modules/pdfjs-dist/package.json').then((pdfjs) => {
        expect(useSystemFonts).to.equal(true)
        expect(standardFontDataUrl).to.contain(`/scripts/pdfjs/${pdfjs.version}/standard_fonts/`)
        // Exact bytes catch a missing static asset being served as the SPA's successful HTML fallback.
        for (const filename of [
          'LiberationSans-Regular.ttf',
          'FoxitSymbol.pfb',
          'FoxitDingbats.pfb',
        ]) {
          cy.readFile(`node_modules/pdfjs-dist/standard_fonts/${filename}`, 'binary').then(
            (expected) => {
              cy.request({ url: `${standardFontDataUrl}${filename}`, encoding: 'binary' }).then(
                (response) => {
                  expect(response.status).to.equal(200)
                  expect(response.body).to.equal(expected)
                },
              )
            },
          )
        }
      })
    })

    it('serves version-matched decoder resources and licenses', () => {
      visitPDF()
      cy.get('#viewer .page canvas').first().should('be.visible')
      cy.readFile<{ version: string }>('node_modules/pdfjs-dist/package.json').then((pdfjs) => {
        expect(wasmUrl).to.contain(`/scripts/pdfjs/${pdfjs.version}/wasm/`)
        /** Representative decoder binaries, JavaScript fallback, and license must match installed bytes. */
        for (const filename of ['openjpeg_nowasm_fallback.js', 'jbig2.wasm', 'LICENSE_JBIG2']) {
          cy.readFile(`node_modules/pdfjs-dist/wasm/${filename}`, 'binary').then((expected) => {
            cy.request({ url: `${wasmUrl}${filename}`, encoding: 'binary' }).then((response) => {
              expect(response.status).to.equal(200)
              expect(response.body).to.equal(expected)
            })
          })
        }
      })
    })

    it('releases the previous worker before retrying a failed render', () => {
      failuresToInject = 1
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.wrap(null).should(() => {
        expect(injectedFailures).to.equal(1)
        expect(peakWorkers).to.equal(1)
        expect(activeWorkers).to.equal(1)
      })
      cy.get('@pdfDocument.all').should('have.length', 2)
      cy.get('[data-cy="nav-link-research"]').click()
      cy.get('[data-cy="nav-link-search"]').click()
      cy.location('pathname').should('eq', '/search')
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
      cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
        const sessions = bodies
          .map((body) => JSON.parse(body))
          .filter((log) => ['start_viewing_session', 'end_viewing_session'].includes(log.action))
        expect(sessions.map((log) => log.action)).to.deep.equal([
          'start_viewing_session',
          'end_viewing_session',
        ])
        expect(sessions[0].event_uuid).to.equal(sessions[1].event_uuid)
      })
      expectNoCleanupErrors()
    })

    it('recovers from a single first-page initialization failure', () => {
      failedPage = 1
      pageFailureStatus = 0
      pageFailureMessage = 'Injected first-page initialization failure'
      pageFailuresToInject = 1
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.get('@pdfDocument.all').should('have.length', 2)
      cy.wrap(null).should(() => {
        expect(pageFailuresToInject).to.equal(0)
        expect(activeWorkers).to.equal(1)
        expect(peakWorkers).to.equal(1)
      })
      expectLoggedError(0, 'retrying without OffscreenCanvas or ImageDecoder')
      expectNoCleanupErrors()
    })

    it('restores a later page after retrying a failed render', () => {
      visitPDF()
      cy.get('#viewer .page[data-page-number="1"][data-loaded="true"] canvas', {
        timeout: 20000,
      }).should('be.visible')
      cy.get('.page-selector__input').clear()
      cy.get('.page-selector__input').type('3{enter}')
      cy.get('#viewer .page[data-page-number="3"][data-loaded="true"] canvas', {
        timeout: 20000,
      }).should('be.visible')
      cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').then(($button) => {
        failuresToInject = 1
        $button[0].click()
      })
      cy.get('@pdfDocument.all').should('have.length', 2)
      cy.get('#viewer .page[data-page-number="3"][data-loaded="true"] canvas', {
        timeout: 20000,
      }).should('be.visible')
      cy.get('.page-selector__input').should('have.value', '3')
      cy.wrap(null).should(() => {
        expect(injectedFailures).to.equal(1)
        expect(activeWorkers).to.equal(1)
        expect(peakWorkers).to.equal(1)
      })
      expectLoggedError(0, 'retrying without OffscreenCanvas or ImageDecoder')
      expectNoCleanupErrors()
    })

    it('releases workers after a terminal render error', () => {
      failuresToInject = 20
      visitPDF()
      cy.contains('Item not viewable on this device', { timeout: 20000 }).should('be.visible')
      cy.wrap(null).should(() => {
        expect(injectedFailures).to.be.at.least(2)
        expect(activeWorkers).to.equal(0)
        expect(peakWorkers).to.equal(1)
      })
      cy.get('@pdfDocument.all').should('have.length', 2)
      expectNoCleanupErrors()
    })

    for (const sharedImage of [false, true]) {
      it(`logs and stops after ${sharedImage ? 'shared' : 'page-local'} images fail on both attempts`, () => {
        failSharedImage = sharedImage
        imageFailuresToInject = Number.POSITIVE_INFINITY
        visitPDF()
        cy.contains('Item not viewable on this device', { timeout: 20000 }).should('be.visible')
        cy.get('@pdfDocument.all').should('have.length', 2)
        cy.wrap(null).should(() => {
          expect(injectedImageFailures).to.be.at.least(2)
          expect(activeWorkers).to.equal(0)
          expect(peakWorkers).to.equal(1)
        })
        cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
          const errors = bodies
            .map((body) => JSON.parse(body))
            .filter((log) => log.action === 'pdf_viewer_error')
          expect(errors).to.have.length(2)
          for (const log of errors) {
            expect(log.itemid).to.equal(iid)
            expect(log.viewer_error.name).to.equal('PDFImageDecodeError')
            expect(log.viewer_error.code).to.equal(0)
            expect(log.viewer_error.message).to.contain('injected_missing_image')
          }
        })
        expectNoCleanupErrors()
      })
    }

    it('recovers once from a swallowed image decoding failure', () => {
      imageFailuresToInject = 1
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.get('@pdfDocument.all').should('have.length', 2)
      cy.wrap(null).should(() => {
        expect(injectedImageFailures).to.equal(1)
        expect(activeWorkers).to.equal(1)
        expect(peakWorkers).to.equal(1)
      })
      expectLoggedError(0, 'injected_missing_image')
      expectNoCleanupErrors()
    })

    it('ignores missing-image messages from a replaced document', () => {
      imageFailuresToInject = 1
      visitPDF()
      cy.get('@pdfDocument.all').should('have.length', 2)
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.window().then((win) => {
        expect(workers).to.have.length(2)
        const previousWorker = workers[0]
        const currentWorker = workers[1]
        const message = {
          targetName: workerDocumentIds.get(previousWorker),
          action: 'commonobj',
          data: ['stale_missing_image', 'Image', null],
        }
        previousWorker.dispatchEvent(new win.MessageEvent('message', { data: message }))
        currentWorker.dispatchEvent(new win.MessageEvent('message', { data: message }))
      })
      cy.get('#viewer .page[data-loaded="true"] canvas').should('be.visible')
      cy.get('@pdfDocument.all').should('have.length', 2)
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(1))
      expectLoggedError(0, 'injected_missing_image')
      expectNoCleanupErrors()
    })

    it('renders and logs once when the worker image-decoding port rejects the observer', () => {
      hideWorkerPort = true
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.get('.control-bar').should('be.visible')
      // The observer is diagnostics only: no retry, no error UI, no second document request.
      cy.get('@pdfDocument.all').should('have.length', 1)
      cy.get('#viewer-container').should('exist')
      cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
        const errors = bodies
          .map((body) => JSON.parse(body))
          .filter((log) => log.eventtype === 'pep_fe_error' && log.component === 'PDFViewer')
        expect(errors).to.have.length(1)
        expect(errors[0].viewer_error).to.include({
          status: false,
          source: 'PDFViewer.vue:observeImageDecoding',
        })
        expect(errors[0].viewer_error.message).to.contain('image observation is off')
      })
    })

    it('releases a rendered document when navigating away', () => {
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.get('[data-cy="nav-link-research"]').click()
      cy.get('[data-cy="nav-link-search"]').click()
      cy.location('pathname').should('eq', '/search')
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
      expectNoCleanupErrors()
    })

    for (const statusCode of [403, 404]) {
      it(`logs HTTP ${statusCode} without retrying document loading`, () => {
        cy.intercept('GET', routes.documents.pdfs(iid), { statusCode, body: 'Unavailable' }).as(
          'pdfDocument',
        )
        visitPDF()
        cy.get(
          `[data-cy="${statusCode === 404 ? 'item-not-found' : 'item-requires-approval'}"]`,
        ).should('be.visible')
        cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
        cy.get('@pdfDocument.all').should('have.length', 1)
        expectLoggedError(statusCode, String(statusCode))
      })

      it(`does not retry HTTP ${statusCode} reported during rendering`, () => {
        failuresToInject = 1
        renderFailureStatus = statusCode
        visitPDF()
        cy.get(
          `[data-cy="${statusCode === 404 ? 'item-not-found' : 'item-requires-approval'}"]`,
        ).should('be.visible')
        cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
        cy.get('@pdfDocument.all').should('have.length', 1)
        expectLoggedError(statusCode, renderFailureMessage)
      })
    }

    it('logs a failed download without a decoder retry', () => {
      cy.intercept('GET', routes.documents.pdfs(iid), { forceNetworkError: true }).as('pdfDocument')
      visitPDF()
      cy.get('[data-cy="item-not-available"]').should('be.visible')
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
      cy.get('@pdfDocument.all').should('have.length', 1)
      expectLoggedError(0, 'Failed to fetch')
    })

    it('does not retry decoder settings for a render-time fetch failure', () => {
      failuresToInject = 1
      renderFailureMessage = 'Failed to fetch'
      visitPDF()
      cy.contains('Item not viewable on this device').should('be.visible')
      cy.wrap(null).should(() => {
        expect(injectedFailures).to.equal(1)
        expect(activeWorkers).to.equal(0)
        expect(peakWorkers).to.equal(1)
      })
      cy.get('@pdfDocument.all').should('have.length', 1)
      expectLoggedError(0, 'Failed to fetch')
    })

    for (const pageNumber of [1, 2]) {
      it(`logs a page ${pageNumber} fetch failure without a decoder retry`, () => {
        failedPage = pageNumber
        pageFailureStatus = 0
        visitPDF()
        cy.contains('Item not viewable on this device').should('be.visible')
        cy.wrap(null).should(() => {
          expect(activeWorkers).to.equal(0)
          expect(peakWorkers).to.equal(1)
        })
        cy.get('@pdfDocument.all').should('have.length', 1)
        expectLoggedError(0, 'Failed to fetch')
      })
    }

    for (const pageNumber of [1, 3]) {
      it(`preserves page ${pageNumber} context without retrying an allocation failure`, () => {
        renderFailureMessage = 'Array buffer allocation failed'
        if (pageNumber === 1) failuresToInject = 1
        visitPDF()
        if (pageNumber !== 1) {
          cy.get('#viewer .page[data-page-number="1"][data-loaded="true"] canvas', {
            timeout: 20000,
          }).should('be.visible')
          cy.get('.page-selector__input').clear()
          cy.get('.page-selector__input').type(`${pageNumber}{enter}`)
          cy.get(`#viewer .page[data-page-number="${pageNumber}"][data-loaded="true"] canvas`, {
            timeout: 20000,
          }).should('be.visible')
          cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').then(($button) => {
            failuresToInject = 1
            $button[0].click()
          })
        }
        cy.contains('Item not viewable on this device').should('be.visible')
        cy.wrap(null).should(() => {
          expect(injectedFailures).to.equal(1)
          expect(activeWorkers).to.equal(0)
        })
        cy.get('@pdfDocument.all').should('have.length', 1)
        expectLoggedError(0, renderFailureMessage)
        cy.then(() => Promise.all(beaconBodies)).then((bodies) => {
          const error = bodies
            .map((body) => JSON.parse(body))
            .find((log) => log.action === 'pdf_viewer_error')
          expect(error.total_pages).to.equal(3)
          expect(error.current_page).to.equal(pageNumber)
        })
      })
    }

    it('logs and stops when the first page cannot be fetched', () => {
      failedPage = 1
      visitPDF()
      cy.get('[data-cy="item-not-found"]').should('be.visible')
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
      expectLoggedError(404, 'Injected page request failure')
    })

    for (const message of ['Invalid typed array length: 93600000', 'Invalid array length']) {
      it(`does not retry the allocation failure "${message}"`, () => {
        failuresToInject = 1
        renderFailureMessage = message
        renderFailureName = 'RangeError'
        visitPDF()
        cy.contains('Item not viewable on this device').should('be.visible')
        cy.wrap(null).should(() => {
          expect(injectedFailures).to.equal(1)
          expect(activeWorkers).to.equal(0)
          expect(peakWorkers).to.equal(1)
        })
        cy.get('@pdfDocument.all').should('have.length', 1)
        expectLoggedError(0, message)
      })
    }

    it('logs and stops when a later page cannot be fetched', () => {
      failedPage = 2
      visitPDF()
      cy.get('[data-cy="item-not-found"]').should('be.visible')
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
      expectLoggedError(404, 'Injected page request failure')
    })

    it('bounds canvas allocation while zooming', () => {
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      for (let count = 0; count < 10; count++) {
        cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').click()
      }
      cy.get<HTMLCanvasElement>('#viewer .page[data-loaded="true"] canvas', {
        timeout: 20000,
      }).should(($canvases) => {
        for (const canvas of $canvases.toArray()) {
          expect(canvas.width * canvas.height).to.be.at.most(2_100_000)
        }
      })
      cy.get('#viewer .detailView').should('not.exist')
    })

    it('releases distant pages after selector navigation and renders them again on return', () => {
      visitPDF()
      cy.get('#viewer .page[data-page-number="1"][data-loaded="true"] canvas', {
        timeout: 20000,
      }).should('be.visible')
      cy.get('.page-selector__input').clear()
      cy.get('.page-selector__input').type('3{enter}')
      cy.get('#viewer .page[data-page-number="3"][data-loaded="true"] canvas', {
        timeout: 20000,
      }).should('be.visible')
      cy.get('#viewer .page[data-page-number="1"] canvas').should('not.exist')
      cy.get('.page-selector__input').clear()
      cy.get('.page-selector__input').type('1{enter}')
      cy.get('#viewer .page[data-page-number="1"][data-loaded="true"] canvas', {
        timeout: 20000,
      }).should('be.visible')
      expectNoCleanupErrors()
    })

    it('reports an unsupported browser without starting a worker', () => {
      unsupportedBrowser = true
      visitPDF()
      cy.contains('Item not viewable on this device').should('be.visible')
      cy.wrap(null).should(() => expect(peakWorkers).to.equal(0))
      expectLoggedError(0, 'not supported by this browser')
    })

    it('preserves zoom when repeated resize events do not change the viewer dimensions', () => {
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').click()
      cy.window().then((win) => {
        // Compare effective scale after the queued frame, not immediately after event dispatch.
        const viewer = win.document.getElementById('viewer')!
        const container = win.document.getElementById('viewer-container')!
        const scale = viewer.style.getPropertyValue('--scale-factor')
        Object.defineProperties(container, {
          clientWidth: { configurable: true, value: container.clientWidth - 15 },
          clientHeight: { configurable: true, value: container.clientHeight - 15 },
        })
        for (let count = 0; count < 10; count++) win.dispatchEvent(new win.Event('resize'))
        return new Cypress.Promise<void>((resolve) => {
          win.requestAnimationFrame(() => resolve())
        }).then(() => {
          expect(viewer.style.getPropertyValue('--scale-factor')).to.equal(scale)
        })
      })
    })

    it('still refits the PDF after a real viewport resize', () => {
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').click()
      cy.get('#viewer')
        .invoke('attr', 'style')
        .then((style) => {
          cy.viewport(900, 600)
          cy.get('#viewer').invoke('attr', 'style').should('not.equal', style)
        })
    })

    it('unlocks body scrolling after a terminal error in CSS fullscreen', () => {
      visitPDF()
      cy.get('#viewer .page[data-loaded="true"] canvas', { timeout: 20000 }).should('be.visible')
      cy.get('button[aria-label="Enter full screen"]').click()
      cy.get('body').should('have.css', 'position', 'fixed')
      cy.window().then((win) => {
        failuresToInject = 20
        win.dispatchEvent(new win.Event('resize'))
      })
      cy.viewport(1200, 700)
      cy.contains('Item not viewable on this device', { timeout: 20000 }).should('be.visible')
      cy.get('body').should('not.have.css', 'position', 'fixed')
      cy.get('.viewer-wrapper--full-screen').should('not.exist')
      cy.wrap(null).should(() => expect(activeWorkers).to.equal(0))
    })
  })

  context('PDF viewer control bar', () => {
    const pdfRoute = `/pdf/${iid}?term=&page=1`

    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/admin__one_group_media_access__response.json',
      }).as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'search/term_given__specified_id_limit_one__response.json',
      }).as('search')
      cy.intercept('GET', routes.alerts.get, {
        statusCode: 200,
        body: { alerts: [], count: 0 },
      }).as('alerts')
      cy.intercept('GET', routes.documents.pdfs(iid), (req) => {
        req.reply({
          fixture: 'pdf/open-access-sample.pdf,null',
          headers: {
            'content-type': 'application/pdf',
            'transfer-encoding': 'chunked',
            'content-disposition': 'inline; filename="open-access-sample.pdf"',
          },
        })
      }).as('pdfDocument')

      handleLocation(pdfRoute, cy, 'pdf-viewer', 'pep')
      cy.visit(pdfRoute)
      cy.wait(['@pdf-viewer', '@alerts', '@env', '@auth', '@features', '@search', '@pdfDocument'], {
        requestTimeout: 20000,
      })
      cy.get('#viewer .page', { timeout: 20000 }).should('have.length.at.least', 2)
    })

    it('adjusts zoom using the control bar', () => {
      /** Reads the rendered CSS scale, including PDF.js's conversion from PDF units to CSS pixels. */
      const getScaleValue = () =>
        cy.window().then((win) => {
          /** The viewer's live custom property reflects the current zoom rather than a fixed baseline. */
          const viewer = win.document.getElementById('viewer') as HTMLElement
          const raw = win.getComputedStyle(viewer).getPropertyValue('--scale-factor')
          return parseFloat(raw)
        })

      /** PDF.js converts 72-point PDF units to 96-DPI CSS pixels before exposing the scale factor. */
      const cssPixelsPerPDFUnit = 96 / 72
      cy.get('#viewer .page canvas').first().should('be.visible')
      getScaleValue().then((scaleFactor) => {
        /** One upward-rounded zoom step, clamped to the viewer's maximum, in PDF scale units. */
        const scale = scaleFactor / cssPixelsPerPDFUnit
        const expectedScale = Math.min(10, Math.ceil(Number((scale * 1.1).toFixed(2)) * 10) / 10)
        cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').click()
        getScaleValue().should('be.closeTo', expectedScale * cssPixelsPerPDFUnit, 0.0001)
      })
      getScaleValue().then((scaleFactor) => {
        /** One downward-rounded zoom step, clamped to the viewer's minimum, in PDF scale units. */
        const scale = scaleFactor / cssPixelsPerPDFUnit
        const expectedScale = Math.max(0.25, Math.floor(Number((scale / 1.1).toFixed(2)) * 10) / 10)
        cy.get('.control-bar__buttons-left button[aria-label="Zoom out"]').click()
        getScaleValue().should('be.closeTo', expectedScale * cssPixelsPerPDFUnit, 0.0001)
      })
    })

    it('ignores invalid page numbers entered or committed by leaving the input', () => {
      /** Captured position must remain unchanged after each rejected page selection. */
      let initialScrollTop = 0
      cy.get('#viewer .page canvas').first().should('be.visible')
      cy.get('#viewer-container')
        .invoke('scrollTop')
        .then((scrollTop) => {
          initialScrollTop = scrollTop as number
        })
      cy.get('.page-selector__input')
        .should('have.attr', 'aria-label', 'Page number')
        .and('have.attr', 'inputmode', 'numeric')
      /** Fractional, out-of-range, and nonnumeric input must be rejected on both Enter and blur. */
      for (const pageNumber of ['1.5', '0', '-1', '999', 'invalid']) {
        cy.get('.page-selector__input').clear()
        cy.get('.page-selector__input').type(`${pageNumber}{enter}`)
        cy.get('.page-selector__input').blur()
        cy.get('#viewer-container').should(($container) => {
          expect($container[0].scrollTop).to.equal(initialScrollTop)
        })
      }
    })

    it('rotates the document when using the rotate control', () => {
      cy.get('#viewer .page canvas', { timeout: 20000 }).first().should('be.visible')
      cy.get('.control-bar__actions-right button[aria-label="Rotate clockwise"]').click()
      cy.get('#viewer .page .textLayer')
        .first()
        .invoke('attr', 'data-main-rotation')
        .should('contain', '90')
    })

    it('toggles CSS fullscreen mode from the control bar', () => {
      cy.get('button[aria-label="Enter full screen"]').click()
      cy.get('.viewer-wrapper').should('have.class', 'viewer-wrapper--full-screen')

      cy.get('button[aria-label="Exit full screen"]').click()
      cy.get('.viewer-wrapper').should('not.have.class', 'viewer-wrapper--full-screen')
    })

    it('navigates to the requested page via the selector', () => {
      let initialScrollTop = 0
      cy.get('#viewer-container')
        .invoke('scrollTop')
        .then((scrollTop) => {
          initialScrollTop = scrollTop as number
        })

      cy.get('.page-selector__input').clear()
      cy.get('.page-selector__input').type('2{enter}')
      cy.get('.page-selector__input').should('have.value', '2')

      cy.get('#viewer-container').should(($container) => {
        expect($container[0]?.scrollTop).to.be.greaterThan(initialScrollTop + 50)
      })
    })
  })
})

describe('PDF legacy BMP decoding', () => {
  /**
   * Builds the small top-down BMP layouts emitted by PDF.js, including palettes and padded rows.
   *
   * @param bitsPerPixel - The supported 1-, 24-, or 32-bit test layout.
   * @param pixels - Already encoded pixels, including any required row padding.
   * @param byteOffset - Leading buffer bytes used to exercise non-zero-offset typed-array views.
   * @returns A two-pixel BMP view without requiring an additional binary fixture file.
   */
  const createBMP = (bitsPerPixel: number, pixels: number[], byteOffset = 0) => {
    // Match PDF.js's 108-byte RGBA header or 40-byte grayscale/BGR header plus optional palette.
    const width = 2
    const height = 1
    const headerSize = bitsPerPixel === 32 ? 108 : 40
    const pixelOffset = 14 + headerSize + (bitsPerPixel === 1 ? 8 : 0)
    // Keep the offset in the returned view so zero-copy decoding must account for its backing buffer.
    const bytes = new Uint8Array(
      new ArrayBuffer(byteOffset + pixelOffset + pixels.length),
      byteOffset,
    )
    // Negative height marks top-down rows, exactly as PDF.js's ImageResizer encodes them.
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    header.setUint16(0, 0x4d42, true)
    header.setUint32(10, pixelOffset, true)
    header.setUint32(14, headerSize, true)
    header.setInt32(18, width, true)
    header.setInt32(22, -height, true)
    header.setUint16(28, bitsPerPixel, true)
    if (bitsPerPixel === 1) bytes.set([0, 0, 0, 0, 255, 255, 255, 255], 54)
    bytes.set(pixels, pixelOffset)
    return bytes
  }

  it('reuses the 32-bit RGBA buffer without copying or changing pixels', () => {
    const bytes = createBMP(32, [10, 20, 30, 40, 50, 60, 70, 80])
    const image = decodePDFJSEncodedBMP(bytes)
    expect(image.data.buffer).to.equal(bytes.buffer)
    expect(Array.from(image.data)).to.deep.equal([10, 20, 30, 40, 50, 60, 70, 80])
    expect(image.width).to.equal(2)
    expect(image.height).to.equal(1)
  })

  it('preserves the input typed array byte offset', () => {
    const bytes = createBMP(32, [1, 2, 3, 4, 5, 6, 7, 8], 13)
    const image = decodePDFJSEncodedBMP(bytes)
    expect(image.data.buffer).to.equal(bytes.buffer)
    expect(image.data.byteOffset).to.equal(13 + 122)
    expect(Array.from(image.data)).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('keeps padded 24-bit BGR conversion correct', () => {
    const image = decodePDFJSEncodedBMP(createBMP(24, [30, 20, 10, 60, 50, 40, 0, 0]))
    expect(Array.from(image.data)).to.deep.equal([10, 20, 30, 255, 40, 50, 60, 255])
  })

  it('keeps padded 1-bit grayscale conversion correct', () => {
    const image = decodePDFJSEncodedBMP(createBMP(1, [0x40, 0, 0, 0]))
    expect(Array.from(image.data)).to.deep.equal([0, 0, 0, 255, 255, 255, 255, 255])
  })

  it('rejects truncated pixels before creating the RGBA view', () => {
    const bytes = createBMP(32, [1, 2, 3])
    expect(() => decodePDFJSEncodedBMP(bytes)).to.throw('Invalid PDF.js BMP layout')
  })

  it('does not retry the native BMP decoder after an allocation failure', () => {
    cy.stub(navigator, 'userAgent').value('Mozilla/5.0 Chrome/100.0.4896.88')
    const allocationError = new RangeError('Array buffer allocation failed')
    const nativeCreateImageBitmap = cy.stub(window, 'createImageBitmap')
    cy.stub(window, 'ImageData').throws(allocationError)
    initPDFWorkerPolyfills()
    const blob = new Blob([createBMP(32, [1, 2, 3, 4, 5, 6, 7, 8])], { type: 'image/bmp' })

    return createImageBitmap(blob).then(
      () => {
        throw new Error('The allocation failure must reject bitmap creation')
      },
      (error: unknown) => {
        expect(error).to.equal(allocationError)
        expect(nativeCreateImageBitmap.callCount).to.equal(0)
      },
    )
  })

  it('does not retry the native BMP decoder after bitmap creation fails', () => {
    cy.stub(navigator, 'userAgent').value('Mozilla/5.0 Chrome/100.0.4896.88')
    const bitmapError = new DOMException(
      'The source image could not be decoded',
      'InvalidStateError',
    )
    const nativeCreateImageBitmap = cy.stub(window, 'createImageBitmap').rejects(bitmapError)
    initPDFWorkerPolyfills()
    const blob = new Blob([createBMP(32, [1, 2, 3, 4, 5, 6, 7, 8])], { type: 'image/bmp' })

    return createImageBitmap(blob).then(
      () => {
        throw new Error('The bitmap creation failure must reject')
      },
      (error: unknown) => {
        expect(error).to.equal(bitmapError)
        expect(nativeCreateImageBitmap.callCount).to.equal(1)
        expect(nativeCreateImageBitmap.firstCall.args[0]).to.be.instanceOf(ImageData)
      },
    )
  })

  it('retains the native decoder fallback for unsupported BMP layouts', () => {
    cy.stub(navigator, 'userAgent').value('Mozilla/5.0 Chrome/100.0.4896.88')
    const nativeCreateImageBitmap = cy.stub(window, 'createImageBitmap').resolves()
    initPDFWorkerPolyfills()
    const blob = new Blob([createBMP(32, [1, 2, 3])], { type: 'image/bmp' })

    return createImageBitmap(blob).then(() => {
      expect(nativeCreateImageBitmap).to.have.been.calledOnceWithExactly(blob)
    })
  })
})
