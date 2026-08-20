import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Citations', () => {
  // The first document in the shared search fixture is approved for the
  // student's group, so it renders a Cite button. Its `iid` is used to target
  // the button and to build the citations request/`data-sheet-id`.
  const iid = '9e230b20-27ff-320e-a400-1d43f3f7b1e5'
  const citeButton = `[data-sheet-id="citations-display-${iid}"]`

  const interceptCitations = (response: {
    fixture?: string
    statusCode?: number
    delay?: number
  }) => cy.intercept('GET', routes.citations.get(iid), response).as('citations')

  context('As a student', () => {
    beforeEach(() => {
      // Each load of the search page makes several external calls (disciplines,
      // auth, alerts, environment, and the search itself). The citations request
      // is set per-context with the appropriate response.
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' }).as(
        'disciplines',
      )
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/student__one_group_no_features__response.json',
      }).as('auth')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__response.json' }).as(
        'search',
      )

      handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep')
      cy.visit('/search?term=mary+mcleod+bethune')
      cy.wait(['@searchPage', '@auth', '@alerts', '@env', '@search', '@disciplines'])
    })

    context('With a successful citations response', () => {
      beforeEach(() => {
        interceptCitations({ fixture: 'citations/response.json' })
      })

      it('Requests citations for the document and opens the modal on click', () => {
        cy.get(citeButton).first().click()

        cy.wait('@citations').its('request.url').should('include', `/citations/${iid}`)
        cy.get('pep-pharos-modal').should('be.visible')
      })

      it('Defaults to the MLA citation style', () => {
        cy.get(citeButton).first().click()
        cy.wait('@citations')

        cy.get('pep-pharos-modal').find('.citation__label').first().should('contain.text', 'MLA')
        cy.get('pep-pharos-modal')
          .find('.citation__text')
          .first()
          .should('contain.text', 'MARY McLEOD BETHUNE')
      })

      it('Switches between citation styles', () => {
        cy.get(citeButton).first().click()
        cy.wait('@citations')

        cy.get('pep-pharos-modal').find('#view_citations_chicago').click()
        cy.get('pep-pharos-modal')
          .find('.citation__label')
          .first()
          .should('contain.text', 'Chicago')
        cy.get('pep-pharos-modal')
          .find('.citation__text')
          .first()
          .should('contain.text', 'Negro History Bulletin 19')

        cy.get('pep-pharos-modal').find('#view_citations_apa').click()
        cy.get('pep-pharos-modal').find('.citation__label').first().should('contain.text', 'APA')
        cy.get('pep-pharos-modal')
          .find('.citation__text')
          .first()
          .should('contain.text', 'Brewer, W. M.')

        cy.get('pep-pharos-modal').find('#view_citations_mla').click()
        cy.get('pep-pharos-modal').find('.citation__label').first().should('contain.text', 'MLA')
      })

      it('Displays the shareable link to find the item', () => {
        cy.get(citeButton).first().click()
        cy.wait('@citations')

        cy.get('pep-pharos-modal').should('contain.text', `/pdf/${iid}`)
      })

      it('Only fetches citations once and caches them across reopens', () => {
        cy.get(citeButton).first().click()
        cy.wait('@citations')

        cy.get('pep-pharos-modal')
          .shadow()
          // This component is in the shadow DOM, and so is a pharos-button, not pep-pharos-button
          .find('pharos-button[a11y-label="Close modal"]')
          .click()

        // Reopening the modal should not trigger an additional request.
        cy.get(citeButton).first().click()
        cy.get('pep-pharos-modal').find('.citation__text').first().should('contain.text', 'MARY')
        cy.get('@citations.all').should('have.length', 1)
      })

      it('Copies the citation to the clipboard', () => {
        cy.get(citeButton).first().click()
        cy.wait('@citations')

        cy.window().then((win) => {
          cy.stub(win.navigator.clipboard, 'writeText').as('writeText').resolves()
        })

        cy.get('pep-pharos-modal')
          .find('.citation__content-row')
          .first()
          .contains('Copy', { matchCase: false })
          .click()

        cy.get('@writeText').should('have.been.called')
      })
    })

    context('While citations are loading', () => {
      beforeEach(() => {
        interceptCitations({ fixture: 'citations/response.json', delay: 500 })
      })

      it('Shows a loading state before the citations resolve', () => {
        cy.get(citeButton).first().click()

        cy.get('pep-pharos-modal').find('.citation__text').first().should('contain.text', 'Loading')
        cy.wait('@citations')
        cy.get('pep-pharos-modal')
          .find('.citation__text')
          .first()
          .should('contain.text', 'MARY McLEOD BETHUNE')
      })
    })

    context('When the citations request fails', () => {
      beforeEach(() => {
        interceptCitations({ statusCode: 500 })
      })

      it('Shows an error alert', () => {
        cy.get(citeButton).first().click()
        cy.wait('@citations')

        cy.get('pep-pharos-modal').find('.citation__error').should('be.visible')
        cy.get('pep-pharos-modal')
          .find('.citation__error')
          .should('contain.text', 'we were unable to cite this item')
      })
    })
  })

  context('As an admin', () => {
    beforeEach(() => {
      // Admins load the search page on the admin subdomain and their results
      // are served from the admin search endpoint. The Cite button is gated on
      // the authenticated-student flag, so it should never render here.
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' }).as(
        'disciplines',
      )
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/admin__two_groups_media_review__response.json',
      }).as('auth')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.search.basic, {
        fixture: 'admin_search/term_given__response.json',
      }).as('search')

      handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep-admin')
      cy.visit('/search?term=mary+mcleod+bethune')
      cy.wait(['@searchPage', '@auth', '@alerts', '@env', '@search', '@features', '@disciplines'])
    })

    it('Does not display the Cite button', () => {
      // Results should render so the assertion reflects the admin flow rather
      // than an empty result set.
      cy.get('.search-result').should('exist')
      cy.get(citeButton).should('not.exist')
    })
  })
})
