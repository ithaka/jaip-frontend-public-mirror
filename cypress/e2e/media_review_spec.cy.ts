import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Media Review', () => {
  context('As a student', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/student__one_group_view_document_submit_requests__response.json' })
        .as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
        .as('disciplines')
      cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__response.json' })
        .as('search')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
    })

    context('With default search response', () => {
      beforeEach(() => {
        handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep')
        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage','@alerts', '@env', '@search', '@auth', '@disciplines'])  
      })
      
      it('Lacks a warning alert', () => {
        cy.get('.alert')
          .should('not.exist')
      }) 
      
      it('Displays the cart button when there is something in the cart', () => {
        cy.get('.search-result')
          .contains('Request this', { matchCase: false })
          .first()
          .click()      
        cy.get('#requests-button')
          .scrollIntoView()
        cy.get('#requests-button')
          .should('be.visible')
        cy.get('#requests-button').should('not.be.disabled')
      })
  
      it('Does not display the cart button when there is nothing in the cart', () => {
        cy.get('#requests-button').should('not.exist')
      })
  
      it('Adds articles to the cart', () => {
        cy.get('.search-result')
        .contains('Request this', { matchCase: false })
        .first()
        .click()   

        cy.get('#requests-button')
          .scrollIntoView()
        cy.get('#requests-button')
          .click()
        cy.get('#requests-modal .search-result')
          .should('have.length', 1)
  
        cy.get('#requests-modal')
          .shadow()
          .find('focus-trap')
          // This component is in the shadow DOM, and so is a pharos-button, not pep-pharos-button
          .find('pharos-button[a11y-label="Close modal"]')
          .click()
        cy.get('.search-result')
          .contains('Request this', { matchCase: false })
          .first()
          .click()

        cy.get('#requests-button')
          .scrollIntoView()
        cy.get('#requests-button')
          .click()
        cy.get('#requests-modal .search-result')
          .should('have.length', 2)
      })
  
      it('Closes the cart dialog when all requests are removed', () => {
        // Add two objects.
        cy.get('.search-result')
          .contains('Request this', { matchCase: false })
          .first()
          .click()
        cy.get('.search-result')
          .contains('Request this', { matchCase: false })
          .first()
          .click()
  
        // Open the requests modal
        cy.get('#requests-button')
          .scrollIntoView()
        cy.get('#requests-button')
          .click()

        // Removing the first object does not close the dialog.
        cy.get('#requests-modal')
          .contains('Remove')
          .first()
          .click()
        cy.get('#requests-modal')
          .should('be.visible')
  
        // Removing the last object does close the dialog.
        cy.get('#requests-modal')
          .contains('Remove')
          .first()
          .click()
        cy.get('#requests-modal')
          .should('not.exist')
      })  

      it('Does not let students re-request approved articles', () => {
        // There exists an approved item
        cy.get('.search-result')
          .contains('Status: Approved by Discipline')
  
        // It includes a document link
        cy.get('.search-result')
          .contains('Status: Approved by Discipline')
          .first()
          .parents('.search-result')
          .should('contain', 'Read')
  
        // It does not include a request button
        cy.get('.search-result')
          .contains('Status: Approved by Discipline')
          .first()
          .parents('.search-result')
          .find('pep-pharos-button')
          .contains('Request this', { matchCase: false })
          .should('not.exist')      
      })


      it('Does not let students access restricted items', () => {
        // There exists a restricted
        cy.get('.search-result')
          .contains('Item unavailable', { matchCase: false })
          .parents('.search-result')
          .contains('Request this', { matchCase: false })
          .should('not.exist')

        cy.get('.search-result')
          .contains('Item unavailable', { matchCase: false })
          .parents('.search-result')
          .contains('Read', { matchCase: false })
          .should('not.exist')
      })

      it('Does not let students restrict or unrestrict items', () => {
        cy.get('.search-result')
          .find('pep-pharos-button')
          .contains('Restrict', { matchCase: false })
          .should('not.exist')

        cy.get('.search-result')
          .find('pep-pharos-button')
          .contains('Unrestrict', { matchCase: false })
          .should('not.exist')
      })
    })

    context('With alternate search response', () => {
      beforeEach(() => {
        cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__with_denial__response.json' })
          .as('search')
        cy.intercept('POST', routes.approvals.request, { body: '' }).as('request')
        handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep')
        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage', '@alerts', '@env', '@search', '@auth', '@disciplines'])  
      })

      it('Lets students re-request denied articles', () => {
        // There exists a denied item
        cy.get('#results .search-result')
          .contains('The Sacrifices and Achievements of African-American Women')
          .first()
          .parents('.search-result')
          .contains('Status: Denied')
  
        // It includes a request button
        cy.get('#results .search-result')
          .eq(4)
          .contains('The Sacrifices and Achievements of African-American Women')
          .parents('.search-result')
          .find('pep-pharos-button')
          .contains('Request this', { matchCase: false })
          .should('be.visible')
          // Let's click that button
          .click()
  
        // Its state has changed
        // This is now at index 5 in the results because adding the search result to the requests modal made that
        // instance 0
        cy.get('#results .search-result')
          .eq(4)
          .contains('The Sacrifices and Achievements of African-American Women')
          .parents('.search-result')
          .find('pep-pharos-button')
          .contains('Cancel', { matchCase: false })
          .should('be.visible')
        
        // Now there's a cart
        cy.get('#requests-button')
          .should('be.visible')

        // Let's finalize the submission
        cy.get('#requests-button')
          .click()

        cy.get('#requests-modal')
          .contains('Submit')
          .click()

        cy.fixture('approvals/request.json').then((request) => {
          cy.wait('@request').its('request.body').should('deep.eq', request)
        })
      })
  
      it('Does not let students re-request pending articles', () => {
        cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__pending__response.json' })
          .as('search')
  
        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage', '@alerts', '@env', '@search', '@auth', '@disciplines'])  
  
        // There exists a pending item
        cy.get('.search-result')
          .contains('The Sacrifices and Achievements of African-American Women')
          .parents('.search-result')
          .contains('Status: Pending')
  
        // It does not include a request button
        cy.get('.search-result')
          .contains('The Sacrifices and Achievements of African-American Women')
          .parents('.search-result')
          .find('pep-pharos-button')
          .should('not.exist')
      })

    })

    context('With full cart', () => {
      beforeEach(() => {
        handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep')
        cy.intercept('POST', routes.search.basic, { fixture: '/search/no_term_given__no_statuses__response.json' })
          .as('search')
        cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/with_no_bulk_approval__response.json' })
          .as('disciplines')

        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage','@alerts', '@env', '@search', '@auth'])  
      })

      it('Displays warning when the cart is full', () => {
        // We first fill the cart with 10 requests, then try to add one more. The expected result
        // is a visible modal with a warning message.
        const cartLimit:number = 10;
        [...Array(cartLimit + 1)].forEach(() => {
          cy.get('.search-result')
          .contains('Request this', { matchCase: false })
          .first()
          .click()   
        });

        cy.get('pep-pharos-modal#excessive-requests-warning-modal')
          .should('be.visible')

      })
    })
  })

  context('As a student who cannot submit requests', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/student__one_group_view_document__response.json' })
        .as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
        .as('disciplines')
      cy.intercept('POST', routes.search.basic, { fixture: 'search/term_given__response.json' })
        .as('search')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
    })

    context('With default search response', () => {
      beforeEach(() => {
        handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep')
        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage','@alerts', '@env', '@search', '@auth', '@disciplines'])  
      })
      it('Shows a warning alert', () => {
        cy.get('.alert')
          // .contains('Requests are temporarily disabled at this site.')
          // .should('be.visible')
      }) 
      it('Does not display the Request this button', () => {
        cy.get('.search-result')
          .contains('Request this', { matchCase: false })
          .should('not.exist')
      })
    })
  })
  context('As an admin', () => {
    beforeEach(() => {
      cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep-admin')
    })

    context('In multiple groups', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_media_review__response.json' })
          .as('auth')
      })

      context('From the search page', () => {
        beforeEach(() => {
          cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
            .as('disciplines')
          cy.intercept('POST', routes.search.basic, { fixture: 'admin_search/term_given__pending__response.json' })
            .as('search')
          cy.intercept('POST', routes.approvals.deny, { body: '' })
            .as('deny')
            
          cy.visit('/search?term=mary+mcleod+bethune')
          cy.wait(['@searchPage', '@alerts', '@env', '@search', '@auth', '@features', '@disciplines'])
        })

        it('Lets admins approve an article', () => {
          cy.intercept('POST', routes.approvals.approve, { body: '' }).as('approve')

          // The pending article has an approve button
          cy.get('.search-result')
            .contains('Status: Pending')
            .parents('.search-result')
            .contains('Approve')
            .click()

          // Clicking that launches the approval confirmation dialog
          cy.get('[id^=approve-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=approve-modal]')
            .contains('All Groups', { matchCase: false })

          cy.get('[id^=approve-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=approve-modal]')
            .contains('Approve')
            .should('not.be.disabled')
            .click()

          // // The expected params are sent to the API when we click
          cy.fixture('admin_requests/approve__two_groups__request.json').then((request) => {
            cy.wait('@approve').its('request.body').should('deep.eq', request)
          })

          // // This does not make assertions about the state of the page after
          // // this interaction because other tests assert that the response is
          // // properly handled when objects are approvable/deniable. It's outside
          // // the scope of this test to verify that the endpoint returns the
          // // appropriate response.
          cy.wait(['@search'])
        })
    
        it('Lets admins deny an article', () => {
          cy.intercept('POST', routes.approvals.deny, { body: '' })
            .as('deny')
  
          cy.get('.search-result')
            .contains('Status: Pending')
            .parents('.search-result')
            .contains('Deny')
            .click()

          cy.get('[id^=deny-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=deny-modal]')
            .find('.group-selector-combobox')
            .should('be.visible')
          cy.get('[id^=deny-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=deny-modal]')
            .find('.group-selector-combobox')
            .click()

          cy.get('[id^=deny-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=deny-modal]')
            .find('.group-selector-combobox')
            .shadow()
            .find('li[role="option"]')
            .contains('all groups', { matchCase: false })
            .click()
    
          cy.get('[id^=deny-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=deny-modal]')
            .find('pep-pharos-radio-button')
            .eq(3)
            .click()
          cy.get('[id^=deny-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=deny-modal]')
            .find('pep-pharos-textarea')
            .shadow()
            .find('textarea')
            // This is only a single letter because occasionally the Cypress
            // type command seems to scramble the letters.
            .type('ttt')
          cy.get('[id^=deny-modal]')
            .contains('The Sacrifices and Achievements of African-American')
            .parents('[id^=deny-modal]')
            .find('pep-pharos-button')
            .contains('Deny')
            .click()
    
          cy.fixture('admin_requests/deny__two_groups__request.json').then((request) => {
            cy.wait('@deny').its('request.body').should('deep.eq', request)
          })
  
          cy.wait('@search')
        })


        context('With an incomplete article', () => {
          beforeEach(() => {
            cy.intercept('POST', routes.search.basic, { fixture: 'admin_search/term_given__incomplete__response.json' })
              .as('search')
            cy.visit('/search?term=mary+mcleod+bethune')
            cy.wait(['@searchPage', '@alerts', '@env', '@search', '@auth', '@features', '@disciplines'])
          })
          it('Lets admins deny an incomplete article', () => {
            cy.intercept('POST', routes.approvals.deny, { body: '' })
              .as('deny')
    
            cy.get('.search-result')
              .contains('Status: Incomplete')
              .parents('.search-result')
              .contains('Deny')
              .click()

            cy.get('[id^=deny-modal]')
              .contains('The Sacrifices and Achievements of African-American')
              .parents('[id^=deny-modal]')
              .find('.group-selector-combobox')
              .should('be.visible')
            cy.get('[id^=deny-modal]')
              .contains('The Sacrifices and Achievements of African-American')
              .parents('[id^=deny-modal]')
              .find('.group-selector-combobox')
              .click()

            cy.get('[id^=deny-modal]')
              .contains('The Sacrifices and Achievements of African-American')
              .parents('[id^=deny-modal]')
              .find('.group-selector-combobox')
              .shadow()
              .find('li[role="option"]')
              .contains('all groups', { matchCase: false })
              .click()
      
            cy.get('[id^=deny-modal]')
              .contains('The Sacrifices and Achievements of African-American')
              .parents('[id^=deny-modal]')
              .find('pep-pharos-radio-button')
              .eq(3)
              .click()
            cy.get('[id^=deny-modal]')
              .contains('The Sacrifices and Achievements of African-American')
              .parents('[id^=deny-modal]')
              .find('pep-pharos-textarea')
              .shadow()
              .find('textarea')
              // This is only a single letter because occasionally the Cypress
              // type command seems to scramble the letters.
              .type('ttt')
            cy.get('[id^=deny-modal]')
              .contains('The Sacrifices and Achievements of African-American')
              .parents('[id^=deny-modal]')
              .find('pep-pharos-button')
              .contains('Deny')
              .click()
      
            cy.fixture('admin_requests/deny__two_groups__request.json').then((request) => {
              cy.wait('@deny').its('request.body').should('deep.eq', request)
          })
  
          cy.wait('@search')
        })

        })
        it("Offers only the deny option, when all the admin's groups have approved an article", () => {
          // Multiple groups have approved the first article
          cy.get('.search-result').first()
            .contains('Status: Approved by Discipline (Ithaka)')
            .should('be.visible')
          cy.get('.search-result').first()
            .contains('Status: Approved by Discipline (Ilium)')
            .should('be.visible')

          // No one has denied it
          cy.get('.search-result')
            .first()
            .contains('Status: Denied')
            .should('not.exist')

          // We see only a deny button
          cy.get('.search-result')
            .first()
            .find('pep-pharos-button')
            .contains('Deny')
            .should('be.visible')

          cy.get('.search-result')
            .first()
            .find('pep-pharos-button')
            .contains('Approve')
            .should('not.exist')
        })
    
        it("Offers only the approve option, when all the admin's groups have denied an article", () => {
          // It has been denied
          cy.contains('Langston Hughes and Mary McLeod Bethune', { matchCase: false })
            .parents('.search-result')
            .contains('Status: Denied')
            .should('be.visible')

          // It has not been approved
          cy.contains('Langston Hughes and Mary McLeod Bethune', { matchCase: false })
            .parents('.search-result')
            .contains('Status: Approved')
            .should('not.exist')

          // We see only an approve button
          cy.contains('Langston Hughes and Mary McLeod Bethune', { matchCase: false })
            .parents('.search-result')
            .contains('Approve')
            .should('be.visible')
          
          cy.contains('Langston Hughes and Mary McLeod Bethune', { matchCase: false })
            .parents('.search-result')
            .contains('Deny')
            .should('not.exist')          
        })

        it('Displays status for articles', () => {
          cy.get('.search-result')
            .first()
            .contains('Approved by discipline', { matchCase: false })
            .should('be.visible')
  
          cy.contains('The Sacrifices and Achievements', { matchCase: false })
            .parents('.search-result')
            .contains('Status: Denied')
            .should('be.visible')

          cy.contains('The Sacrifices and Achievements', { matchCase: false })
            .parents('.search-result')
            .contains('Status: Pending')
            .should('be.visible')
        })
  
        it('Displays group for articles', () => {
          cy.get('.search-result')
            .first()
            .contains('Ithaka', { matchCase: false })
        
          cy.get('.search-result')
            .first()
            .contains('Ilium', { matchCase: false })
        })
    
        it('Displays denial reason for articles', () => {
          cy.contains('Status: Denied')
            .parents('.search-result')
            .contains('t - Need to generate a denial for testing purposes')
        })

        it('Does not let admins restrict or unrestrict items', () => {
          cy.get('.search-result')
            .find('pep-pharos-button')
            .contains('Restrict', { matchCase: false })
            .should('not.exist')

          cy.get('.search-result')
            .find('pep-pharos-button')
            .contains('Unrestrict', { matchCase: false })
            .should('not.exist')
        })
      })
    })

    context('In one group', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_media_review__response.json' })
          .as('auth')
        cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
          .as('disciplines')
        cy.intercept('POST', routes.search.basic, { fixture: 'admin_search/term_given__pending__response.json' })
          .as('search')

        cy.intercept('POST', routes.approvals.approve, { body: '' }).as('approve')
        handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep-admin')
        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage', '@alerts', '@env', '@search', '@auth', '@features', '@disciplines'])  

      })

      it('Submits the approval, when an admin in only one group approves an article', () => {
        cy.get('pep-pharos-button').contains('Approve').click()
        cy.fixture('admin_requests/approve__request.json').then((request) => {
          cy.wait('@approve').its('request.body').should('deep.eq', request)
        })
        cy.wait('@search')
      })  
    })

    context('With manage restrictions', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__ungrouped_manage_restricted_list__response.json' })
          .as('auth')
        cy.intercept('GET', routes.disciplines.get, { fixture: 'disciplines/response.json' })
          .as('disciplines')
        cy.intercept('POST', routes.search.basic, { fixture: 'admin_search/term_given__response.json' })
          .as('search')
        cy.intercept('POST', routes.approvals.approve, { body: '' }).as('approve')
        cy.intercept('POST', routes.global_restricts.restrict, { body: '' }).as('restrict')
        cy.intercept('POST', routes.global_restricts.unrestrict, { body: '' }).as('unrestrict')
        handleLocation('/search?term=mary+mcleod+bethune', cy, 'searchPage', 'pep-admin')
        cy.visit('/search?term=mary+mcleod+bethune')
        cy.wait(['@searchPage', '@alerts', '@env', '@search', '@auth', '@features', '@disciplines'])  

      })

      it('Allows restrict', () => {
        cy.get('.search-result')
          .find('pep-pharos-button')
          .contains('Restrict', { matchCase: false })
          .click()

        cy.get('[id^=restrict-modal-]')
          .find('pep-pharos-button')
          .contains('Restrict')
          .click()
        cy.wait('@restrict')
      })

      it('Allows unrestrict', () => {
        cy.get('.search-result')
          .find('pep-pharos-button')
          .contains('Unrestrict', { matchCase: false })
          .click()
        cy.get('[id^=unrestrict-modal-]')
          .find('pep-pharos-button')
          .contains('Confirm')
          .click()

        cy.wait('@unrestrict')
      })  
    })

  })
})