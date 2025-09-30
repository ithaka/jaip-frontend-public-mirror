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
})
