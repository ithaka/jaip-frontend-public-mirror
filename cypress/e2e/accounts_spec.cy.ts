
import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Account Management', () => {
  context('For admins', () => {
    beforeEach(() => {
      handleLocation('/account?term=&page=1', cy, 'accountPage', 'pep-admin')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
        .as('features')
        cy.intercept('GET', routes.environment.get, { environment: 'test' })
          .as('env')

    })
    context('When logged in', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_bulk_approve__response.json' })
          .as('auth')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features'])
      })

      it('Shows no access to account management', () => {
        cy.contains('Page Not Found', { matchCase: false })
      })
    })


    context('When logged in with get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_get_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__response.json' })
          .as('users')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })
      it('Does not show group selection', () => {
        cy.get('.group-selector-combobox')
          .should('not.exist')
      })
      it('Shows access to users only', () => {
        cy.contains('Add User', { matchCase: false }).should('not.exist')
        cy.get('pep-pharos-toggle-button')
          .should('not.exist')
        cy.get('span')
          .contains('User Management', { matchCase: false })
          .should('be.visible')
      })
    })

    context('When logged in with get_facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_get_facilities__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('facilities')
          cy.visit('/account?term=&page=1')
          cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@facilities'])
      })

      it('Shows access to facilities only', () => {
          cy.contains('Add Facility', { matchCase: false }).should('not.exist')
          cy.get('pep-pharos-toggle-button')
            .should('not.exist')
          cy.get('span')
            .contains('Facility Management', { matchCase: false })
            .should('be.visible')
      })
    })

    context('When logged in with get_facilities and get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_get_facilities_and_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__response.json' })
          .as('users')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('facilities')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      it('Shows access to users and facilities', () => {
        cy.contains('You do not have access to account management tools.', { matchCase: false }).should('not.exist')
        cy.get('span').contains('User Management', { matchCase: false }).should('be.visible')
        cy.get('pep-pharos-toggle-button')
          .contains('Users')
          .should('be.visible')

        cy.get('pep-pharos-toggle-button')
          .contains('Facilities')
          .should('be.visible')
          .click()
        cy.wait(['@facilities'])  
      })
    })

    context('When user can add or edit users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_add_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__response.json' })
          .as('users')
        cy.intercept('PATCH', routes.entities.edit('users'), { fixture: 'account/edit_user__one_group__request.json' })
          .as('editUser')
        cy.intercept('POST', routes.entities.add('users'), { fixture: 'account/add_user__one_group__request.json' })
          .as('addUser')
  
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      it('Shows add user button', () => {
        cy.get('pep-pharos-button')
          .contains('Add User', { matchCase: false })
          .should('be.visible')
      })

      it('Submits add user', () => {
        cy.get('pep-pharos-button')
          .contains('Add User', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="users_name"]')
          .shadow()
          .find('input')
          .type('t')

        // NOTE: This test may occasionally fail because cypress typing into Pharos inputs sometimes
        // gets things out of order. If this happens, just run the test again.
        cy.get('pep-pharos-input-group[id="users_contact"]')
          .shadow()
          .find('input')
          .type('t@t.com')

          cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        cy.fixture('account/add_user__one_group__request.json').then((request) => {
          cy.wait('@addUser').its('request.body').should('deep.eq', request)
        })
      })
      it('Shows edit user button', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .should('be.visible')
      })  
      it('Submits user edit', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('not.exist')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/edit_user__one_group__request.json').then((request) => {
          cy.wait('@editUser').its('request.body').should('deep.eq', request)
        })
      })      
    })
  
    context('When user can remove users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_remove_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__response.json' })
          .as('users')
        cy.intercept('DELETE', routes.entities.remove('users'), { fixture: 'account/remove_user__one_group__request.json' })
          .as('removeUser')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      it('Shows remove user button', () => {
        cy.get('pep-pharos-button')
          .contains('Remove', { matchCase: false })
      })

      it('Submits user removal', () => {
        cy.get('pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible')
          .contains('GROUP', { matchCase: false })
          .should('not.exist')

  
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()

        cy.fixture('account/remove_user__one_group__request.json').then((request) => {
          cy.wait('@removeUser').its('request.body').should('deep.eq', request)
        })
      })   
    })

    context('When user can edit facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_edit_facilities__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('users')
        cy.intercept('PATCH', routes.entities.edit('facilities'), { fixture: 'account/edit_facility__one_group__request.json' })
          .as('editFacility')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      it('Shows edit facility button', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
      })

      it('Only allows feature editing', () => {
        // This ensures that there are no text input fields in the modal dialog (e.g., email or name) 
        cy.get('pep-pharos-input-group[id="4_name"]')
          .should('not.exist')
        cy.get('pep-pharos-input-group[id="4_contact"]')
          .should('not.exist')
      })

      it('Submits facility edit', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('not.exist')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/edit_facility__one_group__request.json').then((request) => {
          cy.wait('@editFacility').its('request.body').should('deep.eq', request)
        })
      })    
    })
 
    context('When user can manage facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_manage_facilities__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('facilities')
        cy.intercept('PATCH', routes.entities.edit('facilities'), { fixture: 'account/manage_facility__one_group__request.json' })
          .as('manageFacility')
        cy.intercept('DELETE', routes.entities.remove('facilities'), { fixture: 'account/remove_facility__one_group__request.json' })
          .as('removeFacility')
        cy.intercept('POST', routes.entities.add('facilities'), { fixture: 'account/add_facility__one_group__request.json' })
          .as('addFacility')
        cy.intercept('POST', routes.subdomains.get, { fixture: 'subdomains/get_subdomains__all_active__response.json' })
          .as('getSubdomains')

        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@facilities'])
      })

      it('Shows edit facility button', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
      })

      it('Allows editing name', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]')
          .should('be.visible')
      })

      it('Allows editing sitename', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_contact"]')
          .should('be.visible')
      })

      it('Submits facility management', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('not.exist')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/manage_facility__one_group__request.json').then((request) => {
          cy.wait('@manageFacility').its('request.body').should('deep.eq', request)
        })
      })  


      it('Submits facility management with subdomain', () => {
        cy.wait(['@getSubdomains'])

        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('not.exist')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()
          
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        
        cy.get('pep-pharos-modal:visible')
        .find('#4_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
            .should('have.prop', 'invalidated')
  
        cy.get('pep-pharos-modal:visible')
          .find('#4_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')
    
        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
          .click()

        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
          .shadow()
          .find('ul>li')
          .first()
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/manage_facility__one_group_subdomain__request.json').then((request) => {
          cy.wait('@manageFacility').its('request.body').should('deep.eq', request)
        })
      })  




      it('Shows remove button', () => {
        cy.get('pep-pharos-button')
          .contains('Remove', { matchCase: false })
      })

      it('Submits facility removal', () => {
        cy.get('pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('remove', { matchCase: false })
          .click()
        cy.fixture('account/remove_facility__one_group__request.json').then((request) => {
          cy.wait('@removeFacility').its('request.body').should('deep.eq', request)
        })
      })


      it('Shows Add Facility button', () => {
        cy.get('pep-pharos-button')
          .contains('Add Facility', { matchCase: false })
      })

      it('Submits add facility', () => {
        cy.get('pep-pharos-button')
          .contains('Add Facility', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="facilities_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-input-group[id="facilities_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        cy.fixture('account/add_facility__one_group__request.json').then((request) => {
          cy.wait('@addFacility').its('request.body').should('deep.eq', request)
        })
      })

      it('Submits add facility with subdomain', () => {
        cy.wait(['@getSubdomains'])
        cy.get('pep-pharos-button')
          .contains('Add Facility', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-input-group[id="facilities_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-input-group[id="facilities_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()
          
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        
        cy.get('pep-pharos-modal:visible')
        .find('#facilities_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
            .should('have.prop', 'invalidated')
  
        cy.get('pep-pharos-modal:visible')
          .find('#facilities_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')
    
        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
          .click()

        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .first()
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        cy.fixture('account/add_facility__one_group_subdomain__request.json').then((request) => {
          cy.wait('@addFacility').its('request.body').should('deep.eq', request)
        })
      })
    })
  })

  context('For admins in multiple groups', () => {
    beforeEach(() => {
      handleLocation('/account?term=&page=1', cy, 'accountPage', 'pep-admin')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
        .as('features')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
    })
    context('When logged in', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_bulk_approve__response.json' })
          .as('auth')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features'])
      })

      it('Shows no access to account management', () => {
        cy.contains('Page Not Found', { matchCase: false })
      })
    })


    context('When logged in with get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_get_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__response.json' })
          .as('users')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      it('Shows group selection', () => {
        cy.get('.group-selector-combobox')
          .should('be.visible')
        cy.get('.group-selector-combobox')
          .click()
        cy.get('.group-selector-combobox option')
          .should('have.length', 3)
        cy.get('.group-selector-combobox option')
          .eq(0)
          .contains('All Groups', { matchCase: false })
        cy.get('.group-selector-combobox option')
          .eq(1)
          .contains('Ilium', { matchCase: false })
        cy.get('.group-selector-combobox option')
          .eq(2)
          .contains('Ithaka', { matchCase: false })
      })
    })

    context('When logged in with get_facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_get_facilities__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('facilities')
          cy.visit('/account?term=&page=1')
          cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@facilities'])
      })

      it('Shows group selection', () => {
        cy.get('.group-selector-combobox')
          .should('be.visible')
        cy.get('.group-selector-combobox')
          .click()
        cy.get('.group-selector-combobox option')
          .should('have.length', 3)
        cy.get('.group-selector-combobox option')
          .eq(0)
          .contains('All Groups', { matchCase: false })
        cy.get('.group-selector-combobox option')
          .eq(1)
          .contains('Ilium', { matchCase: false })
        cy.get('.group-selector-combobox option')
          .eq(2)
          .contains('Ithaka', { matchCase: false })
      })
    })

    context('When logged in with get_facilities and get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_get_facilities_and_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__response.json' })
          .as('users')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('facilities')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      it('Shows access to group selection for users and facilities', () => {
        cy.contains('You do not have access to account management tools.', { matchCase: false }).should('not.exist')
        cy.get('span').contains('User Management', { matchCase: false }).should('be.visible')
        cy.get('pep-pharos-toggle-button')
          .contains('Users')
          .should('be.visible')

        it('Shows group selection for users', () => {
          cy.get('.group-selector-combobox')
            .should('be.visible')
          cy.get('.group-selector-combobox')
            .click()
          cy.get('.group-selector-combobox option')
            .should('have.length', 3)
          cy.get('.group-selector-combobox option')
            .eq(0)
            .contains('All Groups', { matchCase: false })
          cy.get('.group-selector-combobox option')
            .eq(1)
            .contains('Ilium', { matchCase: false })
          cy.get('.group-selector-combobox option')
            .eq(2)
            .contains('Ithaka', { matchCase: false })
        })

        cy.get('pep-pharos-toggle-button')
          .contains('Facilities')
          .should('be.visible')
          .click()
        cy.wait(['@facilities'])  
    
        it('Shows group selection for facilities', () => {
          cy.get('.group-selector-combobox')
            .should('be.visible')
          cy.get('.group-selector-combobox')
            .click()
          cy.get('.group-selector-combobox option')
            .should('have.length', 3)
          cy.get('.group-selector-combobox option')
            .eq(0)
            .contains('All Groups', { matchCase: false })
          cy.get('.group-selector-combobox option')
            .eq(1)
            .contains('Ilium', { matchCase: false })
          cy.get('.group-selector-combobox option')
            .eq(2)
            .contains('Ithaka', { matchCase: false })
        })

      })
    })

    context('When user can add or edit users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_add_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__response.json' })
          .as('users')

        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      context('When editing users', () => {
        beforeEach(() => {
          cy.intercept('PATCH', routes.entities.edit('users'), { fixture: 'account/edit_user__two_groups__request.json' })
          .as('editUser')

          cy.get('pep-pharos-button')
            .contains('Edit', { matchCase: false })
            .should('be.visible')
            .click()
        })
        it('Does not show selection for edit users', () => {
          cy.get('pep-pharos-modal:visible pep-pharos-heading')
            .contains('GROUP', { matchCase: false })
            .should('not.exist')
        })

        
        it('Submits user edit', () => {  
          cy.get('pep-pharos-modal:visible .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal:visible pep-pharos-button')
            .contains('ithaka', { matchCase: false })
            .click()
  
          cy.get('pep-pharos-modal:visible pep-pharos-dropdown-menu-item')
            .contains('ilium', { matchCase: false })
            .click()
          
          cy.get('pep-pharos-modal:visible .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()
  
          cy.get('pep-pharos-modal:visible pep-pharos-button')
            .contains('submit', { matchCase: false })
            .click()
  
          cy.fixture('account/edit_user__two_groups__request.json').then((request) => {
            cy.wait('@editUser').its('request.body').should('deep.eq', request)
          })
        })    
      })


      context('When adding users', () => {
        beforeEach(() => {
          cy.intercept('POST', routes.entities.add('users'), { fixture: 'account/add_user__two_groups__request.json' })
          .as('addUser')

          cy.get('pep-pharos-button')
            .contains('Add User', { matchCase: false })
            .should('be.visible')
            .click()
        })
        it('Shows group selection for add users', () => {
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
        })
        it('Submits add user', () => {
          cy.get('pep-pharos-modal:visible .group-selector-combobox')
            .should('be.visible')
  
          cy.get('pep-pharos-modal:visible .group-selector-combobox')
            .click()
          
          cy.get('pep-pharos-modal:visible .group-selector-combobox option')
            .eq(0)
            .contains('All Groups', { matchCase: false })
  
          cy.get('pep-pharos-modal:visible .group-selector-combobox')
            .shadow()
            .find('li[role="option"]')
            .contains('all groups', { matchCase: false })
            .click()

          cy.get('pep-pharos-input-group[id="users_name"]')
            .shadow()
            .find('input')
            .type('t')
  
          // NOTE: This test may occasionally fail because cypress typing into Pharos inputs sometimes
          // gets things out of order. If this happens, just run the test again.
          cy.get('pep-pharos-input-group[id="users_contact"]')
            .shadow()
            .find('input')
            .type('t@t.com')

          cy.get('pep-pharos-modal:visible .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal:visible pep-pharos-button')
            .contains('ilium', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal:visible pep-pharos-dropdown-menu-item')
            .contains('ithaka', { matchCase: false })
            .click()
          
          cy.get('pep-pharos-modal:visible .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()
  
          cy.get('pep-pharos-modal:visible pep-pharos-button')
            .contains('submit', { matchCase: false })
            .click()
  
          cy.fixture('account/add_user__two_groups__request.json').then((request) => {
            cy.wait('@addUser').its('request.body').should('deep.eq', request)
          })
        })    

      })


  })
  
    context('When user can remove users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_remove_users__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('users'), { fixture: 'account/get_users__two_groups__response.json' })
          .as('users')
        cy.intercept('DELETE', routes.entities.remove('users'), { fixture: 'account/remove_user__two_groups__request.json' })
          .as('removeUser')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@users'])
      })

      it('Shows group selection for remove users', () => {
        cy.get('pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()
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
      })

      it('Submits user removal', () => {
        cy.get('pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()
  
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()

        cy.fixture('account/remove_user__two_groups__request.json').then((request) => {
          cy.wait('@removeUser').its('request.body').should('deep.eq', request)
        })
      })  
    })

    context('When user can edit facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_edit_facilities__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('facilities')
        cy.intercept('PATCH', routes.entities.edit('facilities'), { fixture: 'account/edit_facility__one_group__request.json' })
          .as('editFacility')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@facilities'])
      })

      // Facilities can only be in one group, so there should be no group selection
      it('Does not show group selection for edit facilities', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()
        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('not.exist')
      })

      // NOTE: Facilities can only be in one group, so there should be no group selection
      it('Submits facility edit', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
            .should('not.exist')
  
        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/edit_facility__one_group__request.json').then((request) => {
          cy.wait('@editFacility').its('request.body').should('deep.eq', request)
        })
      }) 
    })

    context('When user can manage facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__two_groups_manage_facilities__response.json' })
          .as('auth')
        cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
          .as('features')
        cy.intercept('POST', routes.entities.get('facilities'), { fixture: 'account/get_facilities__response.json' })
          .as('facilities')
          cy.intercept('PATCH', routes.entities.edit('facilities'), { fixture: 'account/manage_facility__one_group__request.json' })
          .as('manageFacility')
        cy.intercept('DELETE', routes.entities.remove('facilities'), { fixture: 'account/remove_facility__one_group__request.json' })
          .as('removeFacility')
        cy.intercept('POST', routes.entities.add('facilities'), { fixture: 'account/add_facility__one_group__request.json' })
          .as('addFacility')
        cy.intercept('POST', routes.subdomains.get, { fixture: 'subdomains/get_subdomains__all_active__response.json' })
          .as('getSubdomains')

        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env',  '@auth', '@features', '@facilities'])
      })

      // Facilities can only be in one group, so there should be no group selection for anything
      // except adding facilities
      it('Does not show group selection for edit facilities', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()
        cy.get('pep-pharos-modal:visible pep-pharos-heading')
          .contains('GROUP', { matchCase: false })
          .should('not.exist')
      })

      it('Submits facility management', () => {
        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-heading')
          .contains('GROUP', { matchCase: false })
          .should('not.exist')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/manage_facility__one_group__request.json').then((request) => {
          cy.wait('@manageFacility').its('request.body').should('deep.eq', request)
        })
      })



      it('Submits facility management with subdomain', () => {
        cy.wait(['@getSubdomains'])

        cy.get('pep-pharos-button')
          .contains('Edit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('not.exist')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()
          
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        
        cy.get('pep-pharos-modal:visible')
        .find('#4_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
            .should('have.prop', 'invalidated')
  
        cy.get('pep-pharos-modal:visible')
          .find('#4_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')
    
        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
          .click()

        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal:visible')
          .find('#4_subdomain')
          .shadow()
          .find('ul>li')
          .first()
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/manage_facility__one_group_subdomain__request.json').then((request) => {
          cy.wait('@manageFacility').its('request.body').should('deep.eq', request)
        })
      })  




      it('Submits facility removal', () => {
        cy.get('pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('remove', { matchCase: false })
          .click()
        cy.fixture('account/remove_facility__one_group__request.json').then((request) => {
          cy.wait('@removeFacility').its('request.body').should('deep.eq', request)
        })
      })


      it('Shows group radio buttons when adding facility', () => {
        cy.get('pep-pharos-button')
          .contains('Add Facility', { matchCase: false })
          .click()

          cy.get('pep-pharos-modal:visible .group-selector-combobox')
            .should('be.visible')
  
          cy.get('pep-pharos-modal:visible .group-selector-combobox option')
            .should('have.length', 2)
    
          cy.get('pep-pharos-modal:visible .group-selector-combobox option')
            .eq(0)
            .contains('Ilium', { matchCase: false })

          cy.get('pep-pharos-modal:visible .group-selector-combobox option')
            .eq(1)
            .contains('Ithaka', { matchCase: false })
      })

      it('Submits add facility', () => {
        cy.get('pep-pharos-button')
          .contains('Add Facility', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-input-group[id="facilities_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-input-group[id="facilities_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('be.visible')

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .click()
        
        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .shadow()
          .find('li[role="option"]')
          .contains('ithaka', { matchCase: false })
          .click()
          
        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        cy.fixture('account/add_facility__one_group__request.json').then((request) => {
          cy.wait('@addFacility').its('request.body').should('deep.eq', request)
        })
      })

      it('Submits add facility with subdomain', () => {
        cy.wait(['@getSubdomains'])
        cy.get('pep-pharos-button')
          .contains('Add Facility', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-input-group[id="facilities_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-input-group[id="facilities_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()
          
        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        
        cy.get('pep-pharos-modal:visible')
        .find('#facilities_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
            .should('have.prop', 'invalidated')
  
        cy.get('pep-pharos-modal:visible')
          .find('#facilities_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')
    
        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
          .click()

        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal:visible')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .first()
          .click()

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .should('be.visible')

        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .click()
        
        cy.get('pep-pharos-modal:visible .group-selector-combobox')
          .shadow()
          .find('li[role="option"]')
          .contains('ithaka', { matchCase: false })
          .click()
          
        cy.get('pep-pharos-modal:visible pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal:visible pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        cy.fixture('account/add_facility__one_group_subdomain__request.json').then((request) => {
          cy.wait('@addFacility').its('request.body').should('deep.eq', request)
        })
      })
    })
  })
})