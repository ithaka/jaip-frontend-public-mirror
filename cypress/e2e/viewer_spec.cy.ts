import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

// These tests seem to be taking an unusually long time, so we're increasing the timeout. That's resulting in
// consistent test passing.
describe('Page Viewer', () => {
  const iid = '43e7b8c1-a49c-37c3-ad42-6016af1d0eb8'

  context('As student', () => {
    beforeEach(() => {
      const route = `/page/${iid}/0?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/student__one_group_view_document__response.json',
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
      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@search', '@metadata'], {
        requestTimeout: 20000,
      })
    })

    // NOTE: There are no pep-pharos-buttons on the student PDF viewer. This means we can't
    // check for a specific button, but we can check that there are no buttons. We just repeat
    // the same test for print.
    it('does not show download button', () => {
      cy.get('[data-cy="download-pdf-button"]').should('not.exist')
    })

    it('does not show print button', () => {
      cy.get('[data-cy="print-pdf-button"]').should('not.exist')
    })
  })

  context('As student with restricted item', () => {
    beforeEach(() => {
      const route = `/page/${iid}/0?term=&page=1`
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

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@search', '@metadata'], {
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
      const route = `/page/${iid}/0?term=&page=1`
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/admin__one_group_bulk_approve__response.json',
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

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@features', '@search', '@metadata'], {
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
      const route = `/page/${iid}/0?term=&page=1`
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

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@search', '@metadata'], {
        requestTimeout: 20000,
      })
    })
    it('shows pdf button', () => {
      cy.get('pep-pharos-button').contains('View PDF', { matchCase: false }).should('be.visible')
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
      const route = `/page/${iid}/0?term=&page=1`
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

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@features', '@search', '@metadata'], {
        requestTimeout: 20000,
      })
    })

    it('shows pdf button', () => {
      cy.get('pep-pharos-button').contains('View PDF', { matchCase: false }).should('be.visible')
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
      const route = `/page/${iid}/0?term=&page=1`
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

      cy.wait(['@viewer', '@alerts', '@env', '@auth', '@features', '@search', '@metadata'], {
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
          fixture: 'pdf/open-access-sample.pdf',
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
      const getScaleValue = () =>
        cy.window().then((win) => {
          const viewer = win.document.getElementById('viewer') as HTMLElement
          const raw = win.getComputedStyle(viewer).getPropertyValue('--scale-factor')
          return parseFloat(raw)
        })

      const initialScale = 1
      // The effect of zoom seems to be a bit environment dependent, so we're adding
      // an additional zoom in and a couple of additional zoom outs to ensure we see
      // a significant change.
      cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').click()
      cy.get('.control-bar__buttons-left button[aria-label="Zoom in"]').click()
      getScaleValue().should('be.gt', initialScale)

      cy.get('.control-bar__buttons-left button[aria-label="Zoom out"]').click()
      cy.get('.control-bar__buttons-left button[aria-label="Zoom out"]').click()
      cy.get('.control-bar__buttons-left button[aria-label="Zoom out"]').click()
      cy.get('.control-bar__buttons-left button[aria-label="Zoom out"]').click()
      getScaleValue().should('be.lt', initialScale)
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
