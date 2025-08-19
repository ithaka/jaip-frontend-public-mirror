import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

const resizeObserverNotificationErrRe = /^[^(ResizeObserver loop completed with undelivered notifications.)]/
Cypress.on('uncaught:exception', (err) => {
  // returning false here prevents Cypress from
  // failing the test
  if (resizeObserverNotificationErrRe.test(err.message)) {
    console.log('Cypress detected uncaught exception: ', err.message);
    return false
  }
  return true;
});

function updateYear (arr: string[]) {
  return arr.map(filter=>{
    if (filter.startsWith("year:")) {
      return filter.replace(new RegExp('2022', 'g'), new Date().getFullYear().toString())
    } else {
      return filter
    }
  })

}

describe('Search', () => {

  beforeEach(() => {
    // Each load of the search page makes 3 external calls:
    // 1 - to get a list of disciplines for the filter
    // 2 - to get authorization
    // 3 - to perform the search
    // 1 and 2 can be the same for each test. 3 needs to be set in the test
    // with the appropriate fixture(s).
    cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
      .as('disciplines')
    cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/student__one_group_no_features__response.json' })
      .as('auth')
    cy.intercept('GET', routes.alerts.get, { statusCode: 204, body: '' }) // no alerts
      .as('alerts')
    cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
      .as('env')
    handleLocation("/search?term=&page=1", cy, 'searchPage', 'pep')
  })
  context('General', () => {

    context('Sorting', () => {
      context('When no search term is given', () => {
        beforeEach(() => {
          cy.intercept('POST', routes.search.basic, { fixture: 'search/no_term_given__response.json' })
            .as('search')
          cy.visit('/search?term=&page=1')
          // Not also waiting on @search here, even though it's fired by the
          // cy.visit(), because we wait for it in some of the tests to check
          // the requests.
          cy.wait(['@searchPage', '@auth', '@alerts', '@env', '@disciplines'])
        })

        it('Sorts by date (newest first)', () => {
          // The expected params are sent to the API
          cy.fixture('search/no_term_given__request.json').then((request) => {
            request.filters = updateYear(request.filters)
            cy.wait('@search').its('request.body').should('deep.eq', request)
          })
          // Search box indicates date sort
          cy.get('pep-pharos-button').contains('Sort By:', { matchCase: false }).click()
          cy.get('pep-pharos-dropdown-menu').contains('Newest', { matchCase: false }).click()
          // // Date sort has actually been performed
          cy.get('.document-title').first()
            .should('contain.text', 'Civil Rights Litigation in the Lower Courts')
        })

        it('Suppresses relevance sorting when no search term given', () => {
          cy.fixture('search/no_term_given__request.json').then((request) => {
            request.filters = updateYear(request.filters)
            cy.wait('@search').its('request.body').should('deep.eq', request)
          })
          cy.get('pep-pharos-button').contains('Sort By:', { matchCase: false }).click()
          cy.get('pep-pharos-dropdown-menu').contains('Relevance', { matchCase: false }).should('not.exist')
        })

        it('Switches to relevance sort when switching from no term to a term', () => {
          cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__response.json' })
            .as('search')
          cy.visit('/search?term=&page=1')
          cy.wait(['@searchPage', '@auth', '@alerts', '@env', '@search', '@disciplines'])
          cy.get('#main_search').shadow().find('input').type('mary mcleod bethune{enter}')

          cy.contains('Sort by: Relevance', { matchCase: false }).should('be.visible')
        })
      })


      context('When there is a search term', () => {
        beforeEach(() => {
          cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__response.json' })
            .as('search')
          cy.intercept('GET', routes.alerts.get, { statusCode: 204, body: '' }) // no alerts
            .as('alerts')
          handleLocation("/search?term=mary+mcleod+bethune", cy, 'searchPageWithQuery', 'pep')
        })

        it('Defaults to relevance sorting', () => {
          cy.visit('/search?term=mary+mcleod+bethune')
          cy.fixture('search/term_given__request.json').then((request) => {
            request.filters = updateYear(request.filters)
            cy.wait('@search').its('request.body').should('deep.eq', request)
          })
          cy.contains('Sort by: Relevance', { matchCase: false }).should('be.visible')

          cy.wait(['@searchPageWithQuery', '@auth', '@alerts', '@env', '@disciplines'])
        })

        it('Lets users choose newest-first sort', () => {
          // Initial page visit.
          cy.visit('/search?term=mary+mcleod+bethune')
          // Interact with page to trigger new sort.
          cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__newest__response.json' })
            .as('search')
          cy.wait('@search')
          cy.get('pep-pharos-button')
            .contains('Sort By:', { matchCase: false })
            .click()
          cy.get('pep-pharos-dropdown-menu')
            .contains('Newest', { matchCase: false })
            .should('be.visible')
            .shadow()
            .find('button')
            .click()

          cy.fixture('search/term_given__newest__request.json').then((request) => {
            request.filters = updateYear(request.filters)
            // We need to wait for search twice here, because the first one is on page load, and
            // won't have the same request body.
            cy.wait('@search').its('request.body').should('deep.eq', request)
          })
          cy.get('.document-title').first()
            .should('contain.text', 'Rooted in DC')

            cy.wait(['@searchPageWithQuery', '@auth', '@alerts', '@env', '@disciplines'])
          })

        it('Lets users choose oldest-first sort', () => {
          // Initial page visit.
          cy.visit('/search?term=mary+mcleod+bethune')
          // Interact with page to trigger new sort.
          cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__oldest__response.json' })
            .as('search')
          cy.wait('@search')
          cy.get('pep-pharos-button').contains('Sort By:', { matchCase: false }).click()
          cy.get('pep-pharos-dropdown-menu').contains('Oldest', { matchCase: false }).click()

          cy.fixture('search/term_given__oldest__request.json').then((request) => {
            request.filters = updateYear(request.filters)
            cy.wait('@search').its('request.body').should('deep.eq', request)
          })
          cy.get('.document-title').first()
            .should('contain.text', "The Fifty Years' Work of the Royal Geographical Society")

          cy.wait(['@searchPageWithQuery', '@auth', '@alerts', '@env', '@disciplines'])
        })

        it('Lets users choose relevance sort', () => {
          cy.visit('/search?term=mary+mcleod+bethune')
          cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__relevance__response.json' })
            .as('search')
          // The default request with a term given is relevance sort.
          cy.fixture('search/term_given__request.json').then((request) => {
            request.filters = updateYear(request.filters)
            cy.wait('@search').its('request.body').should('deep.eq', request)
          })
          cy.get('.document-title').first()
            .should('contain.text', 'MARY McLEOD BETHUNE')

            cy.wait(['@searchPageWithQuery', '@auth', '@alerts', '@env', '@disciplines'])
          })
      })
    })


    context('Filtering', () => {
      // it('Lets users filter by content type', () => {
      //   const contentTypes = {
      //     'journal': ' Journal Article ',
      //     'chapter': ' Book Chapter ',
      //     'research_report': ' Research Report '
      //   }
      //   Object.entries(contentTypes).forEach( ([key, value] ) => {
      //     cy.intercept('POST', routes.search.basic, { fixture: `search/no_term_given__${key}__response.json` })
      //       .as('search')
      //     cy.visit('/search')
      //     cy.get(`#filters-col input[value="${key}"]`)
      //       .first()
      //       .click({ force: true })

      //     cy.fixture(`search/no_term_given__${key}__request.json`).then((request) => {
      //       // Initial page visit.
      //       cy.wait(['@search', '@auth', '@disciplines'])
      //       request.filters = updateYear(request.filters)
      //       // The POST request fired off once filters are applied.
      //       cy.wait('@search').its('request.body').should('deep.eq', request)
      //     })
      //     cy.get('#results .text-subtitle-2').each((span) => {
      //       cy.wrap(span).should('have.text', value)
      //     })
      //   })
      // })

      it('Lets users filter by publication year (max only)', () => {
        cy.intercept('POST', routes.search.basic, { fixture: `search/no_term_given__max_year__response.json` })
          .as('search')
        cy.visit('/search?term=&page=1')
        cy.wait(['@searchPage', '@search'])
        cy.get('pep-pharos-input-group[name="search-within-max"]')
          .scrollIntoView()
        cy.get('pep-pharos-input-group[name="search-within-max"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .clear()
        cy.get('pep-pharos-input-group[name="search-within-max"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .type('1999{enter}')

        cy.fixture('search/no_term_given__max_year__request.json').then((request) => {
          cy.wait(['@alerts', '@env', '@auth', '@disciplines'])
          cy.wait('@search').its('request.body').should('deep.eq', request)
        })
        cy.get('.document-title').first()
          .should('have.text', '[INDEX OF AUTHORS]')
      })

      it('Lets users filter by publication year (min only)', () => {
        cy.intercept('POST', routes.search.basic, { fixture: `search/no_term_given__min_year__response.json` })
          .as('search')
        cy.visit('/search?term=&page=1')
        cy.wait(['@searchPage', '@search'])
        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .scrollIntoView()
        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .clear()
        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .type('1999{enter}')

        cy.fixture('search/no_term_given__min_year__request.json').then((request) => {
          cy.wait(['@alerts', '@env', '@auth', '@disciplines'])
          request.filters = updateYear(request.filters)
          cy.wait('@search').its('request.body').should('deep.eq', request)
        })
        cy.get('.document-title').first()
          .should('have.text', 'Policing Suspicion')
      })

      it('Lets users filter by publication year (max and min)', () => {
        cy.intercept('POST', routes.search.basic, { fixture: `search/no_term_given__min_max_year__response.json` })
          .as('search')
        cy.visit('/search?term=&page=1')
        cy.wait(['@searchPage', '@search'])
        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .scrollIntoView()

        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .clear()
        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .type('1667')

        cy.get('pep-pharos-input-group[name="search-within-max"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .clear()
        cy.get('pep-pharos-input-group[name="search-within-max"]')
          .should("be.visible")
          .shadow()
          .find('input')
          .type('1792{enter}')

        cy.fixture('search/no_term_given__min_max_year__request.json').then((request) => {
          cy.wait(['@alerts', '@env', '@auth', '@disciplines'])
          cy.wait('@search').its('request.body').should('deep.eq', request)
        })
        cy.get('.document-title').first()
          .should('have.text', 'Observations on the Atmospheres of Venus and the Moon, Their Respective Densities, Perpendicular Heights, and the Twi-Light Occasioned by Them. By John Jerome Schroeter, Esq. of Lilienthal, in the Dutchy of Bremen. Translated from the German')
      })

      it('Lets users filter by discipline', () => {
        cy.intercept('POST', routes.search.basic, { fixture: `search/no_term_given__discipline__response.json` })
          .as('search')
        cy.visit('/search?term=&page=1')
        cy.wait(['@searchPage', '@search'])
        cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { fixture: 'disciplines/afam__response.json' })
          .as('afam')
        cy.get('pep-pharos-checkbox[value="africanamericanstudies-discipline"]').first().click()

        cy.fixture('search/no_term_given__discipline__request.json').then((request) => {
          cy.wait(['@alerts', '@env', '@auth', '@disciplines', '@afam'])
          request.filters = updateYear(request.filters)
          cy.wait('@search').its('request.body').should('deep.eq', request)
        })
        cy.get('.document-title').first()
          .should('have.text', 'ACADEMIC PATHWAYS FOR FORMERLY INCARCERATED STUDENTS')
      })

      it('Lets users filter by journal', () => {
        cy.intercept('POST', routes.search.basic, { fixture: `search/no_term_given__journal__response.json` })
          .as('search')
        cy.intercept('GET', routes.journals.get('africanamericanstudies-discipline'), { fixture: `disciplines/journals__response.json` })
          .as('afam')
        cy.visit('/search?term=&page=1')
        cy.wait(['@searchPage', '@search', '@auth', '@disciplines', '@alerts'])
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
        cy.get('pep-pharos-checkbox[value="abb70559-9665-3b42-aa8a-42535bf6f3c0"]')
          .first()
          .click()

        cy.fixture('search/no_term_given__specific_journal__request.json').then((request) => {
          request.filters = updateYear(request.filters)
          cy.wait('@search').its('request.body').should('deep.eq', request)
        })
        // cy.get('.document-title').first()
        //   .should('contain.text', 'The Black Communications Movement')
      })
    })

    // The testing spreadsheet includes tasks about correctly setting start
    // and end dates, but these are implied by testing the request parameters
    // in the max/min date filtering tests above.

    context('Validation', () => {
      beforeEach(() => {
        cy.intercept('POST', routes.search.basic, { fixture: `search/no_term_given__response.json` })
          .as('search')
        cy.visit('/search?term=&page=1')
        cy.wait('@searchPage')
        cy.wait(['@search', '@alerts', '@env', '@auth', '@disciplines'])
      })

      it('Requires start year to be an integer', () => {
        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .scrollIntoView()
        cy.get('pep-pharos-input-group[name="search-within-min"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .clear()
        cy.get('pep-pharos-input-group[name="search-within-min"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .type('a{enter}')
        cy.get('[data-cy="date-filters-error"]')
          .first()
          .should('be.visible')
          .contains('Enter numeric values only')
      })

      it('Requires end year to be an integer', () => {
        cy.get('pep-pharos-input-group[name="search-within-max"]')
          .scrollIntoView()

        cy.get('pep-pharos-input-group[name="search-within-max"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .clear()
        cy.get('pep-pharos-input-group[name="search-within-max"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .type('1a{enter}')
        cy.get('[data-cy="date-filters-error"]')
          .first()
          .should('be.visible')
          .contains('Enter numeric values only')
      })

      it('Requires start year to precede end year', () => {
        cy.get('pep-pharos-input-group[name="search-within-min"]')
          .scrollIntoView()

        cy.get('pep-pharos-input-group[name="search-within-min"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .clear()
        cy.get('pep-pharos-input-group[name="search-within-min"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .type('1990')
        cy.get('pep-pharos-input-group[name="search-within-max"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .clear()
        cy.get('pep-pharos-input-group[name="search-within-max"]')
        .should("be.visible")
        .shadow()
        .find('input')
        .type('1980{enter}')
        cy.get('[data-cy="date-filters-error"]')
          .first()
          .should('be.visible')
          .contains('Start date must come before end date.')
      })
    })
  })
})
