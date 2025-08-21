import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Bulk approval', () => {
  context('As a student', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/student__one_group_view_document__response.json' })
        .as('auth')
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
        .as('disciplines')
      cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__response.json' })
        .as('search')
      cy.intercept('GET', routes.alerts.get, { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')

      handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep')
      cy.visit('/search?term=mary+mcleod+bethune')

      cy.wait(['@searchPage', '@alerts', '@env', '@auth', '@disciplines', '@search'])
    })

    it('Shows a status indicator for articles from bulk approved disciplines', () => {
      cy.get('.search-result')
        .first()
        .contains('Status: Approved by Discipline')
    })

    it('Shows a status indicator for articles from bulk approved journals', () => {
      cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__journal_approved__response.json' })
        .as('search')
      cy.visit('/search?term=mary+mcleod+bethune')
      cy.wait(['@searchPage', '@alerts', '@env', '@auth', '@disciplines', '@search'])
      cy.get('.search-result')
        .first()
        .contains('Status: Approved by Journal')
    })

    it('Shows a status icon for bulk approved disciplines', () => {
      cy.get('.search-facets pep-pharos-button')
        .contains('Show 68 More', { matchCase: false })
        .click()

      // There is no cy.hover(), and cy.trigger() doesn't work with the pharos tooltip.
      // So there is no good way to test the visibility of the tooltip text.
      cy.get('.search-facets span')
        .contains(/^History$/)
        .parents('div[slot="label"]')
        .find('[data-tooltip-id="approval_history-discipline"]')
        .scrollIntoView()

      cy.get('.search-facets span')
        .contains(/^History$/)
        .parents('div[slot="label"]')
        .find('[data-tooltip-id="approval_history-discipline"]')
        .should('be.visible')
    })

    it('Displays the PDF button for bulk-approved articles', () => {
      cy.get('.search-result')
        .first()
        .contains('Read', { matchCase: false })
        .should('be.visible')
    })
  })

  context('As an admin', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_bulk_approve__response.json' })
        .as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
        .as('disciplines')
      cy.intercept('POST', routes.search.basic, { fixture: 'admin_search/term_given__response.json' })
        .as('search')
      cy.intercept('POST', routes.search.status('denied'), { fixture: 'admin_search/denied__response.json' })
        .as('denied')
      cy.intercept('POST', routes.approvals.bulk, { body: '' })
        .as('bulk')
      cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
      cy.intercept('GET', routes.alerts.get, { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      handleLocation('/search?term=&page=1', cy, 'searchPage', 'pep-admin')
      cy.visit('/search?term=&page=1')
      cy.wait(['@searchPage', '@alerts', '@env', '@auth', '@features', '@disciplines', '@search'])
    })

    context('The approve all button', () => {
      it('Displays when no search term or filter are set', () => {
        cy.get('pep-pharos-button')
          .contains('Approve All', { matchCase: false })
      })

      it('Displays when no search term or filter are set except a discipline', () => {
        cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { fixture: 'disciplines/afam__response.json' })
          .as('afam')

        cy.get('pep-pharos-checkbox')
          .contains('African American Studies', { matchCase: false })
          .click()
        cy.wait(['@afam', '@search'])
        cy.contains('Mary McLeod Bethune') // wait for render

        cy.get('pep-pharos-button')
          .contains('Approve All', { matchCase: false })
      })

      it('Displays when research reports is selected as a filter', () => {
        cy.get('pep-pharos-checkbox[value="research_report"]')
          .first()
          .click()

        cy.get('.search-facets pep-pharos-button')
          .contains('Show 68 More', { matchCase: false })
          .click()

        cy.get('pep-pharos-checkbox[value="research_report"]')
          .last()
          .should('have.attr', 'checked')

        cy.wait('@search')
        cy.get('pep-pharos-button').contains('Approve All', { matchCase: false })
      })

      it('Displays when no search term or filter are set except a journal', () => {
        cy.intercept('POST', routes.search.basic, { fixture: `admin_search/no_term_given__journal__response.json` })
          .as('search-termless')
        cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { fixture: `disciplines/journals__response.json` })
          .as('afam')


        // Select a discipline from the dropdown to access a journal list
        cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
          .scrollIntoView()
        cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
          .should('be.visible')
          .shadow()
          .find('input')
          .click()
        cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
          .should('be.visible')
          .shadow()
          .find('input')
          .type('{downarrow}{enter}')
        cy.wait('@afam')

        // Click on the first journal
        cy.get('pep-pharos-checkbox')
          .contains('African American Review')
          .parents('pep-pharos-checkbox')
          .click()
        cy.wait(['@search-termless'])
        cy.contains('Civil Rights Litigation')
      })

      it('Does not display when there is a search term', () => {
        handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep-admin')
        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage', '@alerts', '@env', '@auth', '@disciplines', '@search'])
        cy.get('pep-pharos-button')
          .contains('Approve All', { matchCase: false })
          .should('not.exist')
      })

      it('Does not display when there is a filter', () => {
        cy.get('pep-pharos-checkbox[value="journal"]')
          .click()
        cy.wait('@search')

        // Wait for re-render after the filter applies.
        cy.contains('Mary McLeod Bethune', { matchCase: false})

        cy.get('pep-pharos-button')
          .contains('Approve All', { matchCase: false })
          .should('not.exist')
      })

    })

    it('Approves all disciplines when no journals or disciplines are selected', () => {
      cy.get('pep-pharos-button')
        .contains('Approve All', { matchCase: false })
        .click()

      cy.get('#approve-all-modal pep-pharos-button')
        .contains('Submit', { matchCase: false })
        .click()
      cy.fixture('approvals/bulk__request.json').then((request) => {
        cy.wait('@bulk').its('request.body').should('deep.eq', request)
      })

      cy.wait(['@denied', '@disciplines'])
    })

    it('Displays denial information for previously denied items that are part of bulk approvals', () => {
      cy.get('pep-pharos-button')
        .contains('Approve All', { matchCase: false })
        .click()
      cy.get('#approve-all-modal')
        .contains('This includes articles that were previously denied')
      cy.get('#approve-all-modal pep-pharos-checkbox-group li')
        .first()
        .find('pep-pharos-icon.fill-coral-50') // denied articles have a visual indicator

      cy.wait('@denied')
    })

    it('Lets you add previously denied articles to bulk approval sets', () => {
      cy.get('pep-pharos-button')
        .contains('Approve All', { matchCase: false })
        .click()
      cy.get('#approve-all-modal li pep-pharos-checkbox')
        .first()
        .contains('Approve with the set?')
        .click()

      cy.get('#approve-all-modal pep-pharos-button')
        .contains('Submit', { matchCase: false })
        .click()

      cy.fixture('approvals/bulk__plus_one__request.json').then((request) => {
        cy.wait('@bulk').its('request.body').should('deep.eq', request)
      })

      cy.wait(['@denied', '@disciplines'])
    })

    it('Lets you add disciplines to the bulk approval list', () => {
      cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { body: '' })
        .as('afam')
      cy.intercept('GET', routes.journals.get('law-discipline'), { body: '' })
        .as('law')
      cy.intercept('GET', routes.journals.get('criminologycriminaljustice-discipline'), { body: '' })
        .as('crim')

      cy.get('.search-facets pep-pharos-button')
        .contains('Show 68 More', { matchCase: false })
        .click()

      cy.get('.search-facets')
        .contains('African American Studies', { matchCase: false })
        .click()

      // The page rerenders after each search, and triggers a search after each
      // click of a discipline filter; we need to make sure all these rerenders
      // have completed for the button to be present & clickable.
      cy.wait(['@search', '@afam'])
      cy.contains('Mary McLeod Bethune', { matchCase: false })

      cy.get('.search-facets')
        .contains('Criminology & Criminal Justice')
        .click()
      cy.wait(['@search', '@crim'])
      cy.contains('Clarifying our Vision with the Facts', { matchCase: false })

      cy.get('.search-facets')
        .contains('Law')
        .click()
      cy.wait(['@search', '@law'])
      cy.contains('We Specialize in the Wholly Impossible', { matchCase: false })

      cy.get('pep-pharos-button')
        .contains('Approve all', { matchCase: false })
        .click()

      cy.get('#approve-all-modal')
        .contains('This will add all material in African American Studies, Criminology & Criminal Justice, and Law from all journals.')

      cy.get('#approve-all-modal pep-pharos-button')
        .contains('Submit', { matchCase: false })
        .click()

      cy.fixture('approvals/bulk__disciplines__request.json').then((request) => {
        cy.wait('@bulk').its('request.body').should('deep.eq', request)
      })

      cy.wait(['@denied', '@disciplines'])
    })

    it('Lets you add journals to the bulk approval list', () => {
      cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { fixture: 'disciplines/afam__response.json' })
        .as('afam')

      // Select a discipline from the dropdown to access a journal list
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .scrollIntoView()
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .should('be.visible')
        .shadow()
        .find('input')
        .click()
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .should('be.visible')
        .shadow()
        .find('input')
        .type('{downarrow}{enter}')
      cy.wait('@afam')

      cy.get('.search-facets pep-pharos-button')
        .contains('Show 13 More', { matchCase: false })
        .click()

      cy.get('pep-pharos-checkbox')
        .contains('Fire!!!')
        .click()

      cy.wait(['@search'])
      cy.contains('Mary McLeod Bethune')

      cy.get('pep-pharos-button')
        .contains('Approve all', { matchCase: false })
        .click()

      cy.get('#approve-all-modal')
        .contains('This will add all material in all subjects from Fire!!!')

      cy.get('#approve-all-modal pep-pharos-button')
        .contains('Submit', { matchCase: false })
        .click()

      cy.fixture('approvals/bulk__journals__request.json').then((request) => {
        cy.wait('@bulk').its('request.body').should('deep.eq', request)
      })

      cy.wait(['@denied', '@disciplines'])
    })

    it('Displays an indicator for bulk approved disciplines', () => {
      cy.intercept('POST', routes.disciplines.get, { fixture: 'disciplines/with_bulk_approval__response.json' })

      cy.get('.search-facets pep-pharos-button')
        .contains('Show 68 More', { matchCase: false })
        .click()

      cy.get('.search-facets span')
        .contains(/^History$/)
        .parents('div[slot="label"]')
        .find('[data-tooltip-id="approval_history-discipline"]')
        .scrollIntoView()

      cy.get('.search-facets span')
        .contains(/^History$/)
        .parents('div[slot="label"]')
        .find('[data-tooltip-id="approval_history-discipline"]')

        .should('be.visible')
    })

    it.only('Displays an indicator for bulk approved journals', () => {
      cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { fixture: 'disciplines/afam__response.json' })
        .as('afam')

      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .scrollIntoView()
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .should('be.visible')
        .shadow()
        .find('input')
        .click()
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .should('be.visible')
        .shadow()
        .find('input')
        .type('{downarrow}{enter}')
      cy.wait('@afam')

      // Click on the first journal
      cy.get('pep-pharos-checkbox')
        .contains('African American Review')
        .parents('pep-pharos-checkbox')

      cy.get('[data-cy="filter-checkbox-label"]')
        .contains('African American Review')
        .parents('div[slot="label"]')
        .find('[data-tooltip-id="approval_abb70559-9665-3b42-aa8a-42535bf6f3c0"]')
    })

    it('Has a bulk undo feature', () => {
      cy.intercept('POST', routes.approvals.bulkUndo, { body: '' })
        .as('bulkUndo')
      cy.get('.search-facets pep-pharos-button')
        .contains('Show 68 More', { matchCase: false })
        .click()

      cy.get('.search-facets span')
        .contains(/^History$/)
        .parents('div[slot="label"]')
        .find('pep-pharos-icon')
        .scrollIntoView()

      cy.get('.search-facets span')
        .contains(/^History$/)
        .parents('div[slot="label"]')
        .find('pep-pharos-icon')
        .click()
      cy.get('#bulk-history-discipline-modal')
        .contains('The record will show that Test Admin revoked approval for History')
      cy.get('#bulk-history-discipline-modal')
        .contains('Submit')
        .click()

      cy.fixture('approvals/bulk_undo__request.json').then((request) => {
        cy.wait('@bulkUndo').its('request.body').should('deep.eq', request)
      })

      cy.wait('@disciplines')
    })

  })
  context('As an admin with multiple groups', ()=>{
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_bulk_approve__response.json' })
        .as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
        .as('disciplines')
      cy.intercept('POST', routes.search.basic, { fixture: 'admin_search/term_given__response.json' })
        .as('search')
      cy.intercept('POST', routes.search.status('denied'), { fixture: 'admin_search/denied__response.json' })
        .as('denied')
      cy.intercept('POST', routes.approvals.bulk, { body: '' })
        .as('bulk')
      cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
      cy.intercept('GET', routes.alerts.get, { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      handleLocation('/search?term=&page=1', cy, 'searchPage', 'pep-admin')
      cy.visit('/search?term=&page=1')
      cy.wait(['@searchPage', '@alerts', '@env', '@auth', '@features', '@disciplines', '@search'])
    })

    it('Approves all disciplines in both groups when no journals or disciplines are selected', () => {
      cy.get('pep-pharos-button')
        .contains('Approve All', { matchCase: false })
        .click()
      cy.wait('@denied')


      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .should('be.visible')
      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .click()
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .should('have.length', 3)
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(0)
        .contains('All Groups', { matchCase: false })
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(1)
        .contains('Ilium', { matchCase: false })
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(2)
        .contains('Ithaka', { matchCase: false })


      cy.get('#approve-all-modal pep-pharos-button')
        .contains('Submit', { matchCase: false })
        .click()
      cy.fixture('approvals/bulk__two_groups__request.json').then((request) => {
        cy.wait('@bulk').its('request.body').should('deep.eq', request)
      })
      cy.wait('@disciplines')
    })


    it('Lets you add disciplines to the bulk approval list', () => {
      cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { body: '' })
        .as('afam')
      cy.intercept('GET', routes.journals.get('law-discipline'), { body: '' })
        .as('law')
      cy.intercept('GET', routes.journals.get('criminologycriminaljustice-discipline'), { body: '' })
        .as('crim')

      cy.get('.search-facets pep-pharos-button')
        .contains('Show 68 More', { matchCase: false })
        .click()

      cy.get('.search-facets')
        .contains('African American Studies', { matchCase: false })
        .click()

      cy.wait(['@search', '@afam'])
      cy.contains('Mary McLeod Bethune', { matchCase: false })

      cy.get('.search-facets')
        .contains('Criminology & Criminal Justice')
        .click()
      cy.wait(['@search', '@crim'])
      cy.contains('Clarifying our Vision with the Facts', { matchCase: false })

      cy.get('.search-facets')
        .contains('Law')
        .click()
      cy.wait(['@search', '@law'])
      cy.contains('We Specialize in the Wholly Impossible', { matchCase: false })

      cy.get('pep-pharos-button')
        .contains('Approve all', { matchCase: false })
        .click()

      cy.get('#approve-all-modal')
        .contains('This will add all material in African American Studies, Criminology & Criminal Justice, and Law from all journals.')

      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .should('be.visible')
      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .click()
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .should('have.length', 3)
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(0)
        .contains('All Groups', { matchCase: false })
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(1)
        .contains('Ilium', { matchCase: false })
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(2)
        .contains('Ithaka', { matchCase: false })


      cy.get('#approve-all-modal pep-pharos-button')
        .contains('Submit', { matchCase: false })
        .click()

      cy.fixture('approvals/bulk__two_groups_disciplines__request.json').then((request) => {
        cy.wait('@bulk').its('request.body').should('deep.eq', request)
      })

      cy.wait(['@denied', '@disciplines'])
    })

    it('Lets you add journals to the bulk approval list', () => {
      cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { fixture: 'disciplines/afam__response.json' })
        .as('afam')

      // Select a discipline from the dropdown to access a journal list
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .scrollIntoView()
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .should('be.visible')
        .shadow()
        .find('input')
        .click()
      cy.get('pep-pharos-combobox[placeholder="Select a subject"]')
        .should('be.visible')
        .shadow()
        .find('input')
        .type('{downarrow}{enter}')
      cy.wait('@afam')

      cy.get('.search-facets pep-pharos-button')
        .contains('Show 13 More', { matchCase: false })
        .click()

      cy.get('pep-pharos-checkbox')
        .contains('Fire!!!')
        .click()

      cy.wait(['@search'])
      cy.contains('Mary McLeod Bethune')

      cy.get('pep-pharos-button')
        .contains('Approve all', { matchCase: false })
        .click()

      cy.get('#approve-all-modal')
        .contains('This will add all material in all subjects from Fire!!!')

      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .should('be.visible')
      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .click()
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .should('have.length', 3)
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(0)
        .contains('All Groups', { matchCase: false })
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(1)
        .contains('Ilium', { matchCase: false })
      cy.get('pep-pharos-modal:visible .group-selector-combobox option')
        .eq(2)
        .contains('Ithaka', { matchCase: false })

      cy.get('#approve-all-modal pep-pharos-button')
        .contains('Submit', { matchCase: false })
        .click()

      cy.fixture('approvals/bulk__two_groups_journals__request.json').then((request) => {
        cy.wait('@bulk').its('request.body').should('deep.eq', request)
      })

      cy.wait(['@denied', '@disciplines'])
    })

  })
  context('As an admin without access', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_get_users__response.json' })
        .as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/with_bulk_approval__response.json' })
        .as('disciplines')
      cy.intercept('POST', routes.search.basic, { fixture: 'admin_search/term_given__response.json' })
        .as('search')
      cy.intercept('POST', routes.search.status('denied'), { fixture: 'admin_search/denied__response.json' })
        .as('denied')
      cy.intercept('POST', routes.approvals.bulk, { body: '' })
        .as('bulk')
      cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
        .as('features')
      cy.intercept('GET', routes.alerts.get, { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      handleLocation('/search?term=&page=1', cy, 'searchPage', 'pep-admin')
      cy.visit('/search?term=&page=1')
      cy.wait(['@searchPage', '@alerts', '@env', '@auth', '@features', '@disciplines', '@search'])
    })

    context('The approve all button', () => {
      it('Does not display when admin does not have access', () => {
        // Approve All button does not appear
        cy.get('pep-pharos-button')
          .contains('Approve All', { matchCase: false })
          .should('not.exist')
      })
    })

    context('The bulk unto option', () => {
      it('Does not appear when admin does not have access', () => {
        cy.get('.search-facets pep-pharos-button')
          .contains('Show 68 More', { matchCase: false })
          .click()
        cy.get('.search-facets span')
          .contains(/^History$/)
          .parents('div[slot="label"]')
          .find('pep-pharos-icon')
          .click()
        cy.get('#bulk-history-discipline-modal')
          .should('not.exist')
      })
    })
  })
})
