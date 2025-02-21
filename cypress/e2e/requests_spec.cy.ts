import { handleLocation } from './helpers'

describe('Requests page', () => {
  context('General', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', { fixture: 'auth/users/student__one_group_no_features__response.json' })
        .as('auth')
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/completed__response.json' } )
        .as('completed')
      cy.intercept('GET', '/api/auth/alerts', { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      handleLocation("/requests?term=&page=1", cy, 'requestsPage', 'pep')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@requestsPage', '@alerts', '@auth', '@completed'])
    })

    it('Can sort by date', () => {
      // Sort by oldest
      cy.get('pep-pharos-button').contains('Sort By:', { matchCase: false }).click()
      cy.get('pep-pharos-dropdown-menu').contains('Oldest', { matchCase: false }).click()

      cy.fixture('search/pending__request.json').then(() => {
        cy.wait('@completed')
          .its('request.body')
          .its('sort')
          .should('eq', 'old')
      })

      // Back to newest
      cy.get('pep-pharos-button').contains('Sort By:', { matchCase: false }).click()
      cy.get('pep-pharos-dropdown-menu').contains('Newest', { matchCase: false }).click()

      cy.fixture('search/pending__request.json').then(() => {
        cy.wait('@completed')
          .its('request.body')
          .its('sort')
          .should('eq', 'new')
      })
    })

    it.only('Can filter by date reviewed', () => {
      // Open date picker
      cy.get('pep-pharos-button[id="datepicker-button"')
        .click()
      cy.get('.dp--preset-dates').contains('Today', { matchCase: false }).should('be.visible')
      cy.get('.dp--preset-dates').contains('Last 30 Days', { matchCase: false }).should('be.visible')
      cy.get('.dp--preset-dates').contains('Last 60 Days', { matchCase: false }).should('be.visible')
      cy.get('.dp--preset-dates').contains('Last 90 Days', { matchCase: false }).should('be.visible')

      // // This test needs to use a date range wholly in the past, because prior
      // // to the 10th, the specified dates won't be selectable.
      cy.get('button[aria-label$="pen years overlay"').click()
      cy.get('div[role="gridcell"]').contains('2022').click()

      cy.get('button[aria-label$="pen months overlay"').click()
      cy.get('div[role="gridcell"]').contains('Jan').click()
      
      // Using regex to ensure that the number is the only value in the cell to avoid
      // selecting 31 when we want 1.
      cy.get('div[role="gridcell"]').contains(/^1$/).click()
      cy.get('div[role="gridcell"]').contains(/^2$/).click()
      cy.get('pep-pharos-button').contains('Select').first().click()

      cy.wait('@completed').then((request) => {
        const req = request.request.body
        // NOTE: This will likely fail when running locally, because of UTC issues.
        expect(req.statusStartDate).to.contain(`2022-01-01`)
        expect(req.statusEndDate).to.contain(`2022-01-02`)
      })
    })

    it('Can filter by status', () => {
      cy.intercept('POST', '/api/search/pending', { fixture: 'search/pending__response.json' } )
        .as('pending')

      // The responses here will have the same format, so we can just reuse the same fixture.
      cy.intercept('POST', '/api/search/denied', { fixture: 'search/pending__response.json' } )
        .as('denied')
      cy.intercept('POST', '/api/search/approved', { fixture: 'search/pending__response.json' } )
        .as('approved')

        // Filter for pending items
      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Pending', { matchCase: false })
        .click()


      cy.wait('@pending')  // it fires a request to the pending endpoint 
      cy.contains('Christmas Books')  // it contains pending content

      // Filter for completed items
      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Completed', { matchCase: false })
        .click()

      cy.wait('@completed')  // it fires a request to the completed endpoint 
      cy.contains('Sacrifices and Achievements')  // it contains completed content

      // Filter for approved items
      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Approved', { matchCase: false })
        .click()

      cy.wait('@approved')  // it fires a request to the completed endpoint 
      cy.contains('Christmas Books')  // it contains completed content

      // Filter for denied items
      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Denied', { matchCase: false })
        .click()

      cy.wait('@denied')  // it fires a request to the completed endpoint 
      cy.contains('Christmas Books')  // it contains completed content
    })
  })

  context('Student', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', { fixture: 'auth/users/student__one_group_media_access__response.json' })
        .as('auth')
      cy.intercept('GET', '/api/auth/alerts', { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      handleLocation("/requests?term=&page=1", cy, 'requestsPage', 'pep')
    })

    it('Lets students re-request denied articles', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/completed__response.json' } )
        .as('completed')
        
      cy.visit('/requests?term=&page=1')
      cy.wait(['@requestsPage', '@alerts', '@auth', '@completed'])

      cy.get('.search-result')
        .first()
        .contains('Status: Denied')
      
      cy.get('.search-result')
        .first()
        .find('pep-pharos-button')
        .contains('Request this', { matchCase: false })
    })

    it('Lets students re-request incomplete articles', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/incomplete__response.json' } )
        .as('completed')

      cy.visit('/requests?term=&page=1')
      cy.wait(['@requestsPage', '@alerts', '@auth', '@completed'])

      cy.get('.search-result')
        .first()
        .contains('Status: Incomplete')
      
      cy.get('.search-result')
        .first()
        .find('pep-pharos-button')
        .contains('Request this', { matchCase: false })
    })

    it('Lets students read approved articles', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/completed__response.json' } )
        .as('completed')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@auth', '@alerts', '@completed'])

      cy.get('.search-result')
        .eq(1)
        .contains('Status: Approved')
      
      cy.get('.search-result')
        .eq(1)
        .find('pep-pharos-button')
        .contains('Read', { matchCase: false })
    })

    it('Lets students download approved articles', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/completed__response.json' } )
        .as('completed')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@auth', '@alerts', '@completed'])

      cy.get('.search-result')
        .eq(1)
        .contains('Status: Approved')
      
      cy.get('.search-result')
        .eq(1)
        .find('pep-pharos-button')
        .contains('Download', { matchCase: false })
    })

    it('Lets students print approved articles', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/completed__response.json' } )
        .as('completed')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@auth', '@alerts', '@completed'])

      cy.get('.search-result')
        .eq(1)
        .contains('Status: Approved')
      
      cy.get('.search-result')
        .eq(1)
        .find('pep-pharos-button')
        .contains('Print', { matchCase: false })
    })

    it('Does not have a button for pending articles', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/completed__response.json' } )
        .as('completed')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@requestsPage', '@alerts', '@auth', '@completed'])

      cy.intercept('POST', '/api/search/pending', { fixture: 'search/pending__response.json' })
        .as('pending')

      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Pending', { matchCase: false })
        .click()

      cy.wait('@pending')

      cy.get('.search-result')
        .first()
        .contains('Status: Pending')
      
      cy.get('.search-result pep-pharos-button')
        .should('have.length', 0)
    })
    it('Has no groups', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'search/completed__response.json' } )
        .as('completed')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@requestsPage', '@auth', '@completed'])

      cy.get('pep-pharos-heading')
      .contains('GROUP', { matchCase: false })
      .should('not.exist')
    })
  })

  context('Admin', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', { fixture: 'auth/users/admin__one_group_media_review__response.json' })
        .as('auth')
      cy.intercept('POST', '/api/search/pending', { fixture: 'admin_search/completed__response.json' })
        .as('pending')
      cy.intercept('POST', '/api/auth/features/basic/get', { fixture: 'auth/features/basic_features.json' })
          .as('features')
      cy.intercept('GET', '/api/auth/alerts', { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      handleLocation("/requests?term=&page=1", cy, 'requestsPage', 'pep-admin')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@requestsPage', '@alerts', '@auth', '@features', '@pending'])
    })

    it('Includes metadata for pending results', () => {
      cy.get('pep-pharos-button')
        .contains('History')
        .should('be.visible')
        .click()

      cy.get('[id^=history-modal]')
        .first()
        .shadow()
        // This component is in the shadow DOM, and so is a pharos-heading, not pep-pharos-heading
        .find('pharos-heading')
        .contains('History')
        .should('be.visible')

      cy.get('[id^=history-modal]')
        .should('be.visible')
        .first()
        .shadow()
        .find('focus-trap')
        // This component is in the shadow DOM, and so is a pharos-button, not pep-pharos-button
        .find('pharos-button[a11y-label="Close modal"]')
        .click()
      // // Inside of this block, result is a jQuery object, so only jQuery
      // // functions can be chained off it.
      cy.get('.search-result').first().should((result) => {
        expect(result).to.contain('Starting a Conversation on Racism, one Book Club at a Time')
        expect(result).to.contain('Ithaka')
        expect(result).to.contain('Deny')
        expect(result).to.contain('Read')
      })
      cy.get('.search-result').eq(1).should((result) => {
        expect(result).to.contain('Approve')
      })
    })

    it('Has no groups', () => {
      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .should('not.exist')
    })

    it('Approves with the approve button', () => {
      cy.intercept('POST', '/api/approvals/approve', { body: '' })
        .as('approve')

      cy.get('.search-result').eq(1).find('pep-pharos-button')
        .contains('Approve')
        .click()

      cy.fixture('admin_requests/approve__request.json').then((request) => {
        cy.wait('@approve').its('request.body').should('deep.eq', request)
      })

      cy.wait('@pending')
    })

    it('Denies with the deny button', () => {
      cy.intercept('POST', '/api/approvals/deny', { body: '' })
        .as('deny')

      cy.get('.search-result')
        .first()
        .find('pep-pharos-button')
        .contains('Deny')
        .click()
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-radio-button')
        .eq(3)
        .click()
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-textarea')
        .shadow()
        .find('textarea')
        // This is only a single letter because occasionally the Cypress
        // type command seems to scramble the letters.
        .type('t')
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-button')
        .contains('Deny')
        .click()
  
      cy.fixture('admin_requests/deny__request.json').then((request) => {
        cy.wait('@deny').its('request.body').should('deep.eq', request)
      })

      cy.wait('@pending')
    })

    it('Has no groups in the deny modal', () => {
      cy.intercept('POST', '/api/approvals/deny', { body: '' })
        .as('deny')

      cy.get('.search-result')
        .first()
        .find('pep-pharos-button')
        .contains('Deny')
        .click()
      cy.get('[id^=deny-modal]')
        .first()
        .contains('GROUP', { matchCase: false })
        .should('not.exist')
    })

    it('Includes metadata for completed results', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'admin_search/completed__response.json' })
        .as('completed')
        
      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Completed', { matchCase: false })
        .click()

      cy.wait('@completed')
      cy.get('.search-result')
        .first()
      
      cy.get('.search-result').first().should((result) => {
        expect(result).to.contain('Starting a Conversation on Racism, one Book Club at a Time')
        expect(result).to.contain('DAVID CLINE')
        expect(result).to.contain('Approved')
        expect(result).to.contain('Ithaka')
      })  
    })

    it('Links to review history for pending items for that location only', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'admin_search/pending__response.json' })
        .as('pending')

      cy.get('.search-result')
      .contains('History')
      .click()
      cy.get('[id^=history-modal]')
        .first()
        .shadow()
        // This component is in the shadow DOM, and so is a pharos-heading, not pep-pharos-heading
        .find('pharos-heading')
        .contains('History')
        .should('be.visible')

      cy.get('[id^=history-modal]')
        .first()
        .shadow()
        // This component is in the shadow DOM, and so is a pharos-heading, not pep-pharos-heading
        .find('pharos-heading')
        .contains('History')
        .should('be.visible')

      cy.get('[id^=history-modal]')
        .first()
        .find('table')
        .contains('Ithaka')
        .should('be.visible')


      cy.get('[id^=history-modal]')
      .first()
      .find('table')
      .contains('Ilium')
      .should('not.exist')
    })

    it('Links to review history for completed items for that location only', () => {
      cy.intercept('POST', '/api/search/completed', { fixture: 'admin_search/completed__response.json' })
      .as('completed')
  
      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Completed', { matchCase: false })
        .click()

      cy.wait('@completed')

      cy.get('.search-result')  
        .first()
        .contains('History')
        .click()

      cy.get('[id^=history-modal]')
        .first()
        .shadow()
        // This component is in the shadow DOM, and so is a pharos-heading, not pep-pharos-heading
        .find('pharos-heading')
        .contains('History')
        .should('be.visible')

      cy.get('[id^=history-modal]')
        .first()
        .find('table')
        .contains('Ithaka')
        .should('be.visible')


      cy.get('[id^=history-modal]')
      .first()
      .find('table')
      .contains('Ilium')
      .should('not.exist')
    })

    it('Links to review history for incomplete items for that location only', () => {
      cy.intercept('POST', '/api/search/incomplete', { fixture: 'admin_search/incomplete__response.json' })
        .as('incomplete')
  
      cy.get('pep-pharos-button')
        .contains('Status:', { matchCase: false })
        .click()

      cy.get('pep-pharos-dropdown-menu')
        .contains('Incomplete', { matchCase: false })
        .click()

      cy.wait('@incomplete')

      cy.get('.search-result')  
        .first()
        .contains('History')
        .click()

      cy.get('[id^=history-modal]')
        .first()
        .shadow()
        // This component is in the shadow DOM, and so is a pharos-heading, not pep-pharos-heading
        .find('pharos-heading')
        .contains('History')
        .should('be.visible')

      cy.get('[id^=history-modal]')
        .first()
        .find('table')
        .contains('Ithaka')
        .should('be.visible')


      cy.get('[id^=history-modal]')
      .first()
      .find('table')
      .contains('Ilium')
      .should('not.exist')
    })

    context('History dialog', () => {
      beforeEach(() => {
        cy.get('.search-result')
          .contains('History')
          .click()
      })

      it('Contains article metadata', () => {
        cy.get('.search-result')
          .contains('Starting a Conversation on Racism, one Book Club at a Time')
        
        cy.get('.search-result')
          .contains('National Civic Review, Vol. 111, No. 4 (Winter 2023), pp. 42-49')
      })

      it('Contains a table of review actions', () => {
        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(1)
          .contains('Approved')
          .should('be.visible')

        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(1)
          .contains('Inspector Javert')
          .should('be.visible')

        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(1)
          .contains('Ithaka')
          .should('be.visible')

        // We're trying to make sure the time is displayed correctly, but that means using the user's local time.
        // In the case of the test, we can't be sure what the server time will be when the test runs, so we need to
        // calculate the expected value from the time in the fixture.
        const dateOptions: Intl.DateTimeFormatOptions = {
          dateStyle: "medium",
          timeStyle: "short"
        }
        const time = new Date("2023-06-10T03:41:40.591448Z").toLocaleString("en", dateOptions)

        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(1)
          .contains(time)
          .should('be.visible')


        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(1)
          .contains('No Notes')
          .should('be.visible')


        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(2)
          .contains('Denied')
          .should('be.visible')

        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(2)
          .contains('Inspector Javert')
          .should('be.visible')

        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(2)
          .contains('Ithaka')
          .should('be.visible')

        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(2)
          .contains(time)
          .should('be.visible')


        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(2)
          .contains('Sexually explicit/pornographic')
          .should('be.visible')
  
        cy.get('[id^=history-modal]')
          .first()
          .find('table tr')
          .eq(2)
          .contains('Test')
          .should('be.visible')
      })

      it('Contains a local/global toggle button', () => {
        cy.get('[id^=history-modal]')
          .contains('Global Statuses')
          .click()

        cy.get('[id^=history-modal]')
          .contains('Local History')
          .click()
      })

      it('Local history includes all changes for the specified group only', () => {
        cy.get('[id^=history-modal] table tr').should('have.length', 14)
        cy.get('[id^=history-modal] table tr').contains('Ithaka')
        cy.get('[id^=history-modal] table tr').contains('Ilium').should('have.length', 0)
      })

      it('Global history includes only current approved/denied statuses', () => {
        cy.get('[id^=history-modal]')
          .contains('Global Statuses')
          .click()

        cy.get('[id^=history-modal] table tr').should('have.length', 2)
        cy.get('[id^=history-modal] table').contains('Approved')
        cy.get('[id^=history-modal] table').contains('Ithaka')
        cy.get('[id^=history-modal] table').contains('Pending').should('have.length', 0)
        cy.get('[id^=history-modal] table').contains('Denied').should('have.length', 0)
      })
    })
  })

  context('Admin with two groups', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', { fixture: 'auth/users/admin__two_groups_media_review__response.json' })
        .as('auth')
      cy.intercept('POST', '/api/search/pending', { fixture: 'admin_search/completed__response.json' })
        .as('pending')
      cy.intercept('POST', '/api/auth/features/basic/get', { fixture: 'auth/features/basic_features.json' })
          .as('features')
      cy.intercept('GET', '/api/auth/alerts', { statusCode: 204, body: '' }) // no alerts
        .as('alerts')
      handleLocation("/requests?term=&page=1", cy, 'requestsPage', 'pep-admin')
      cy.visit('/requests?term=&page=1')
      cy.wait(['@requestsPage', '@alerts', '@auth', '@features', '@pending'])
    })
  
    it('Has two groups', () => {
      cy.get('.group-selector-combobox')
        .first()
        .should('be.visible')
      cy.get('.group-selector-combobox')
        .first()
        .click()
      cy.get('.group-selector-combobox')
        .first()
        .find('option')
        .should('have.length', 3)
      cy.get('.group-selector-combobox')
        .first()
        .find('option')
        .eq(0)
        .contains('All Groups', { matchCase: false })
      cy.get('.group-selector-combobox')
        .first()
        .find('option')
        .eq(1)
        .contains('Ilium', { matchCase: false })
      cy.get('.group-selector-combobox')
        .first()
        .find('option')
        .eq(2)
        .contains('Ithaka', { matchCase: false })
    })


    it('Requires group selection', () => {
      cy.get('.search-result')
        .first()
        .find('pep-pharos-button')
        .contains('Deny')
        .click()
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-radio-button')
        .eq(3)
        .click()
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-textarea')
        .shadow()
        .find('textarea')
        // This is only a single letter because occasionally the Cypress
        // type command seems to scramble the letters.
        .type('t')
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-button')
        .contains('Deny')
        .should('be.disabled')
    })

    it('Can deny for two groups', () => {
      cy.intercept('POST', '/api/approvals/deny', { body: '' })
        .as('deny')

      cy.get('.search-result')
        .first()
        .find('pep-pharos-button')
        .contains('Deny')
        .click()

      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .should('be.visible')
      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .click()
      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .find('option')
        .should('have.length', 3)
      cy.get('pep-pharos-modal:visible .group-selector-combobox')
        .shadow()
        .find('li[role="option"]')
        .contains('all groups', { matchCase: false })
        .click()

      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-radio-button')
        .eq(3)
        .click()
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-textarea')
        .shadow()
        .find('textarea')
        // This is only a single letter because occasionally the Cypress
        // type command seems to scramble the letters.
        .type('t')
      cy.get('[id^=deny-modal]')
        .first()
        .find('pep-pharos-button')
        .contains('Deny')
        .click()
  
      cy.fixture('admin_requests/deny__two_groups__request.json').then((request) => {
        cy.wait('@deny').its('request.body').should('deep.eq', request)
      })

      cy.wait('@pending')
    })


    it('Can approve for two groups', () => {
      cy.intercept('POST', '/api/approvals/approve', { body: '' })
        .as('approve')

      cy.get('.search-result')
        .eq(1)
        .find('pep-pharos-button')
        .contains('Approve')
        .click()
        
      cy.get('[id^=approve-modal] .group-selector-combobox')
        .should('be.visible')
      cy.get('[id^=approve-modal]')
        .contains('Recent Developments in Alternatives to Animal Testing')
        .parents('[id^=approve-modal]')
        .find('pep-pharos-button')
        .contains('Approve')
        .click()

      cy.fixture('admin_requests/approve__two_groups__request.json').then((request) => {
        cy.wait('@approve').its('request.body').should('deep.eq', request)
      })

      cy.wait('@pending')
    })
  })

})