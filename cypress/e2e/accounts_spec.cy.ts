import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'
import type { User } from '../../src/interfaces/Entities'

const interceptAuthWithFacilityAccess = (fixturePath: string) => {
  cy.fixture<User>(fixturePath).then((user) => {
    user.facilities = user.groups
      .filter((group) => group.features.edit_facilities || group.features.manage_facilities)
      .map((group, index) => ({
        id: index + 4,
        name: `Facility ${index + 4}`,
        type: 'facilities',
        groups: [group],
      }))
    cy.intercept('GET', routes.auth.get, { body: user }).as('auth')
  })
}

const assertFacilityPayloadWithFixture = (alias: string, fixturePath: string) => {
  cy.fixture(fixturePath).then((request) => {
    cy.wait(alias)
      .its('request.body')
      .then((body) => {
        const expectedFields: Record<string, unknown> = {}
        ;['id', 'name', 'contact', 'type', 'subdomain', 'primary_sitecode'].forEach((field) => {
          const value = (request as Record<string, unknown>)[field]
          if (value !== undefined) {
            expectedFields[field] = value
          }
        })

        expect(body).to.deep.include(expectedFields)

        const expectedGroups =
          (request as { groups?: Array<{ id: number; name: string }> }).groups || []
        expect(body.groups).to.have.length(expectedGroups.length)

        expectedGroups.forEach((group) => {
          expect(
            body.groups.some(
              (actualGroup: { id: number; name: string }) =>
                actualGroup.id === group.id && actualGroup.name === group.name,
            ),
          ).to.eq(true)
        })

        expect(
          body.groups.some((group: { features: Record<string, boolean> }) =>
            Object.values(group.features).every((isEnabled) => !isEnabled),
          ),
        ).to.eq(false)
      })
  })
}

describe('Account Management', () => {
  context('For admins', () => {
    beforeEach(() => {
      handleLocation('/account?term=&page=1', cy, 'accountPage', 'pep-admin')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
    })
    context('When logged in', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__one_group_bulk_approve__response.json',
        }).as('auth')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features'])
      })
      it('Shows no access to account management', () => {
        cy.contains('Page Not Found', { matchCase: false })
      })
    })

    context('When logged in with get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__one_group_get_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__response.json',
        }).as('users')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })
      it('Does not show group selection', () => {
        cy.get('.group-selector-combobox').should('not.exist')
      })
      it('Shows access to users only', () => {
        cy.contains('Add User', { matchCase: false }).should('not.exist')
        cy.get('pep-pharos-toggle-button').should('not.exist')
        cy.get('span').contains('User Management', { matchCase: false }).should('be.visible')
      })
    })

    context('When logged in with get_facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__one_group_get_facilities__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('facilities')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@facilities'])
      })

      it('Shows access to facilities only', () => {
        cy.contains('Add Facility', { matchCase: false }).should('not.exist')
        cy.get('pep-pharos-toggle-button').should('not.exist')
        cy.get('span').contains('Facility Management', { matchCase: false }).should('be.visible')
        cy.get('.request-permissions').should('not.exist')
      })
    })

    context('When logged in with get_facilities and get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__one_group_get_facilities_and_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__response.json',
        }).as('users')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('facilities')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      it('Shows access to users and facilities', () => {
        cy.contains('You do not have access to account management tools.', {
          matchCase: false,
        }).should('not.exist')
        cy.get('span').contains('User Management', { matchCase: false }).should('be.visible')
        cy.get('pep-pharos-toggle-button').contains('Users').should('be.visible')

        cy.get('pep-pharos-toggle-button').contains('Facilities').should('be.visible').click()
        cy.wait(['@facilities'])
      })
    })

    context('When user can add or edit users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__one_group_add_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__response.json',
        }).as('users')
        cy.intercept('PATCH', routes.entities.edit('users'), {
          fixture: 'account/edit_user__one_group__request.json',
        }).as('editUser')
        cy.intercept('POST', routes.entities.add('users'), {
          fixture: 'account/add_user__one_group__request.json',
        }).as('addUser')

        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      it('Shows add user button', () => {
        cy.get('pep-pharos-button').contains('Add User', { matchCase: false }).should('be.visible')
      })

      it('Submits add user', () => {
        cy.get('pep-pharos-button').contains('Add User', { matchCase: false }).click()

        cy.get('pep-pharos-input-group[id="users_name"]').shadow().find('input').type('t')

        // NOTE: This test may occasionally fail because cypress typing into Pharos inputs sometimes
        // gets things out of order. If this happens, just run the test again.
        cy.get('pep-pharos-input-group[id="users_contact"]').shadow().find('input').type('t@t.com')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        cy.fixture('account/add_user__one_group__request.json').then((request) => {
          cy.wait('@addUser').its('request.body').should('deep.eq', request)
        })
      })
      it('Shows edit user button', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).should('be.visible')
      })
      it('Submits user edit', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.fixture('account/edit_user__one_group__request.json').then((request) => {
          cy.wait('@editUser').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When user can remove users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__one_group_remove_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__response.json',
        }).as('users')
        cy.intercept('DELETE', routes.entities.remove('users'), {
          fixture: 'account/remove_user__one_group__request.json',
        }).as('removeUser')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      it('Shows remove user button', () => {
        cy.get('pep-pharos-button').contains('Remove', { matchCase: false })
      })

      it('Submits user removal', () => {
        cy.get('pep-pharos-button').contains('Remove', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open]').contains('GROUP', { matchCase: false }).should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()

        cy.fixture('account/remove_user__one_group__request.json').then((request) => {
          cy.wait('@removeUser').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When user can edit facilities', () => {
      beforeEach(() => {
        interceptAuthWithFacilityAccess(
          'auth/users/admin__one_group_edit_facilities__response.json',
        )
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('users')
        cy.intercept('PATCH', routes.entities.edit('facilities'), {
          fixture: 'account/edit_facility__one_group__request.json',
        }).as('editFacility')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      it('Shows edit facility button', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false })
      })

      it('Shows request settings for users who can edit facilities', () => {
        cy.get('.request-permissions').should('be.visible')
      })

      it('Only allows feature editing', () => {
        // This ensures that there are no text input fields in the modal dialog (e.g., email or name)
        cy.get('pep-pharos-input-group[id="4_name"]').should('not.exist')
        cy.get('pep-pharos-input-group[id="4_contact"]').should('not.exist')
      })

      it('Submits facility edit', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        assertFacilityPayloadWithFixture(
          '@editFacility',
          'account/edit_facility__one_group__request.json',
        )
      })
    })

    context('When user can manage facilities', () => {
      beforeEach(() => {
        interceptAuthWithFacilityAccess(
          'auth/users/admin__one_group_manage_facilities__response.json',
        )
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('facilities')
        cy.intercept('PATCH', routes.entities.edit('facilities'), {
          fixture: 'account/manage_facility__one_group__request.json',
        }).as('manageFacility')
        cy.intercept('DELETE', routes.entities.remove('facilities'), {
          fixture: 'account/remove_facility__one_group__request.json',
        }).as('removeFacility')
        cy.intercept('POST', routes.entities.add('facilities'), {
          fixture: 'account/add_facility__one_group__request.json',
        }).as('addFacility')
        cy.intercept('POST', routes.subdomains.get, {
          fixture: 'subdomains/get_subdomains__all_active__response.json',
        }).as('getSubdomains')

        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@facilities'])
      })

      ;[
        { width: 1280, height: 800, container: 'pep-pharos-modal' },
        { width: 390, height: 844, container: 'pep-pharos-sheet' },
      ].forEach(({ width, height, container }) => {
        it(`Shows a separate pause requests dialog at ${width}px`, () => {
          cy.viewport(width, height)
          cy.contains('pep-pharos-button', 'Pause requests').click()
          cy.get(
            `${container}[id="pause-requests-4-${container === 'pep-pharos-modal' ? 'modal' : 'sheet'}"]`,
          )
            .should('be.visible')
            .within(() => {
              cy.get('#pause-requests-datepicker-4').should('be.visible')
              cy.contains('What to expect:').should('be.visible')
              cy.contains('Users will be unable to submit new requests immediately').should(
                'be.visible',
              )
              cy.contains('You can continue to review pending requests').should('be.visible')
              cy.contains('Resume any time before the pause duration').should('be.visible')
              cy.contains('pep-pharos-button', 'Pause requests').should('have.attr', 'disabled')
              cy.contains('Turn off and delete requests').should('not.exist')
            })
          cy.get('#pause-requests-datepicker-4').click()
          cy.get('.datepicker__menu--teleported')
            .should('be.visible')
            .should(($menu) => {
              const bounds = $menu[0]!.getBoundingClientRect()
              expect(bounds.left).to.be.at.least(0)
              expect(bounds.top).to.be.at.least(0)
              expect(bounds.right).to.be.at.most(width)
              expect(bounds.bottom).to.be.at.most(height)
            })
          cy.contains('pep-pharos-button', 'Today').click()
          cy.get('.datepicker__action-row').contains('pep-pharos-button', 'Select').click()
          cy.get('.datepicker__menu--teleported').should('not.exist')
          cy.get(`${container}[open]`).contains('pep-pharos-button', 'Cancel').click()
          cy.get(`${container}[open]`).should('not.exist')
        })
      })

      it('Submits a bounded pause without deleting requests', () => {
        cy.viewport(1280, 800)
        cy.intercept('POST', routes.request_management.add(), { statusCode: 200, body: {} }).as(
          'pauseRequests',
        )
        cy.intercept('DELETE', routes.request_management.remove(), {
          statusCode: 200,
          body: {},
        }).as('deleteRequestPermissions')
        cy.contains('pep-pharos-button', 'Pause requests').click()
        cy.get('#pause-requests-datepicker-4').click()
        cy.contains('pep-pharos-button', 'Today').click()
        cy.get('.datepicker__action-row').contains('pep-pharos-button', 'Select').click()
        cy.get('#pause-requests-4-modal').contains('pep-pharos-button', 'Pause requests').click()
        cy.wait('@pauseRequests')
          .its('request.body')
          .then((body) => {
            expect(body.facility_id).to.eq(4)
            expect(body.end_date).to.be.a('string')
            expect(new Date(body.end_date).getTime()).to.be.greaterThan(
              new Date(body.start_date).getTime(),
            )
          })
        cy.get('#pause-requests-4-modal').should('not.exist')
        cy.get('@deleteRequestPermissions.all').should('have.length', 0)
      })

      it('Shows edit facility button', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false })
      })

      it('Allows editing name', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-input-group[id="4_name"]').should('be.visible')
      })

      it('Allows editing sitename', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-input-group[id="4_contact"]').should('be.visible')
      })

      it('Submits facility management', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]').shadow().find('input').type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]').shadow().find('input').type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        assertFacilityPayloadWithFixture(
          '@manageFacility',
          'account/manage_facility__one_group__request.json',
        )
      })

      it('Submits facility management with subdomain', () => {
        cy.wait(['@getSubdomains'])

        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]').shadow().find('input').type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]').shadow().find('input').type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open]')
          .find('#4_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]').find('#4_subdomain').should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]')
          .find('#4_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open]').find('#4_subdomain').click()

        cy.get('pep-pharos-modal[open]')
          .find('#4_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal[open]').find('#4_subdomain').shadow().find('ul>li').first().click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        assertFacilityPayloadWithFixture(
          '@manageFacility',
          'account/manage_facility__one_group_subdomain__request.json',
        )
      })

      it('Shows remove button', () => {
        cy.get('pep-pharos-button').contains('Remove', { matchCase: false })
      })

      it('Submits facility removal', () => {
        cy.get('pep-pharos-button').contains('Remove', { matchCase: false }).click()
        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('remove', { matchCase: false })
          .click()
        cy.fixture('account/remove_facility__one_group__request.json').then((request) => {
          cy.wait('@removeFacility').its('request.body').should('deep.eq', request)
        })
      })

      it('Shows Add Facility button', () => {
        cy.get('pep-pharos-button').contains('Add Facility', { matchCase: false })
      })

      it('Submits add facility', () => {
        cy.get('pep-pharos-button').contains('Add Facility', { matchCase: false }).click()

        cy.get('pep-pharos-input-group[id="facilities_name"]').shadow().find('input').type('t')

        cy.get('pep-pharos-input-group[id="facilities_contact"]').shadow().find('input').type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        assertFacilityPayloadWithFixture(
          '@addFacility',
          'account/add_facility__one_group__request.json',
        )
      })

      it('Submits add facility with subdomain', () => {
        cy.wait(['@getSubdomains'])
        cy.get('pep-pharos-button').contains('Add Facility', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] pep-pharos-input-group[id="facilities_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-input-group[id="facilities_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_subdomain')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open]').find('#facilities_subdomain').click()

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .first()
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        assertFacilityPayloadWithFixture(
          '@addFacility',
          'account/add_facility__one_group_subdomain__request.json',
        )
      })
    })
  })

  context('For admins in multiple groups', () => {
    beforeEach(() => {
      handleLocation('/account?term=&page=1', cy, 'accountPage', 'pep-admin')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('features')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
    })
    context('When logged in', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__two_groups_bulk_approve__response.json',
        }).as('auth')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features'])
      })

      it('Shows no access to account management', () => {
        cy.contains('Page Not Found', { matchCase: false })
      })
    })

    context('When logged in with get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__two_groups_get_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__response.json',
        }).as('users')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      it('Shows group selection', () => {
        cy.get('.group-selector-combobox').should('be.visible')
        cy.get('.group-selector-combobox').click()
        cy.get('.group-selector-combobox option').should('have.length', 3)
        cy.get('.group-selector-combobox option').eq(0).contains('All Groups', { matchCase: false })
        cy.get('.group-selector-combobox option').eq(1).contains('Ilium', { matchCase: false })
        cy.get('.group-selector-combobox option').eq(2).contains('Ithaka', { matchCase: false })
      })
    })

    context('When logged in with get_facilities', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__two_groups_get_facilities__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('facilities')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@facilities'])
      })

      it('Shows group selection', () => {
        cy.get('.group-selector-combobox').should('be.visible')
        cy.get('.group-selector-combobox').click()
        cy.get('.group-selector-combobox option').should('have.length', 3)
        cy.get('.group-selector-combobox option').eq(0).contains('All Groups', { matchCase: false })
        cy.get('.group-selector-combobox option').eq(1).contains('Ilium', { matchCase: false })
        cy.get('.group-selector-combobox option').eq(2).contains('Ithaka', { matchCase: false })
      })
    })

    context('When logged in with get_facilities and get_users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__two_groups_get_facilities_and_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__response.json',
        }).as('users')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('facilities')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      it('Shows access to group selection for users and facilities', () => {
        cy.contains('You do not have access to account management tools.', {
          matchCase: false,
        }).should('not.exist')
        cy.get('span').contains('User Management', { matchCase: false }).should('be.visible')
        cy.get('pep-pharos-toggle-button').contains('Users').should('be.visible')

        it('Shows group selection for users', () => {
          cy.get('.group-selector-combobox').should('be.visible')
          cy.get('.group-selector-combobox').click()
          cy.get('.group-selector-combobox option').should('have.length', 3)
          cy.get('.group-selector-combobox option')
            .eq(0)
            .contains('All Groups', { matchCase: false })
          cy.get('.group-selector-combobox option').eq(1).contains('Ilium', { matchCase: false })
          cy.get('.group-selector-combobox option').eq(2).contains('Ithaka', { matchCase: false })
        })

        cy.get('pep-pharos-toggle-button').contains('Facilities').should('be.visible').click()
        cy.wait(['@facilities'])

        it('Shows group selection for facilities', () => {
          cy.get('.group-selector-combobox').should('be.visible')
          cy.get('.group-selector-combobox').click()
          cy.get('.group-selector-combobox option').should('have.length', 3)
          cy.get('.group-selector-combobox option')
            .eq(0)
            .contains('All Groups', { matchCase: false })
          cy.get('.group-selector-combobox option').eq(1).contains('Ilium', { matchCase: false })
          cy.get('.group-selector-combobox option').eq(2).contains('Ithaka', { matchCase: false })
        })
      })
    })

    context('When user can add or edit users', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__two_groups_add_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__response.json',
        }).as('users')

        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      context('When editing users', () => {
        beforeEach(() => {
          cy.intercept('PATCH', routes.entities.edit('users'), {
            fixture: 'account/edit_user__two_groups__request.json',
          }).as('editUser')

          cy.get('pep-pharos-button')
            .contains('Edit', { matchCase: false })
            .should('be.visible')
            .click()
        })
        it('Does not show selection for edit users', () => {
          cy.get('pep-pharos-modal[open] pep-pharos-heading')
            .contains('GROUP', { matchCase: false })
            .should('not.exist')
        })

        it('Submits user edit', () => {
          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-button')
            .contains('ilium', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-dropdown-menu-item')
            .contains('ithaka', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-button')
            .contains('submit', { matchCase: false })
            .click()

          cy.fixture('account/edit_user__two_groups__request.json').then((request) => {
            cy.wait('@editUser').its('request.body').should('deep.eq', request)
          })
        })

        it('Submits only changed groups and omits all-false groups', () => {
          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-button')
            .contains('ilium', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-dropdown-menu-item')
            .contains('ithaka', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('view snippet', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-button')
            .contains('submit', { matchCase: false })
            .click()

          cy.wait('@editUser')
            .its('request.body.groups')
            .then((groups) => {
              expect(groups).to.have.length(1)
              expect(groups.map((group: { id: number }) => group.id)).to.deep.eq([1])
              expect(
                groups.some((group: { features: Record<string, boolean> }) =>
                  Object.values(group.features).every((isEnabled) => !isEnabled),
                ),
              ).to.eq(false)
            })
        })

        it('Respects indeterminate state for parent checkboxes', () => {
          cy.contains(
            'pep-pharos-modal[open] .feature-selection pep-pharos-checkbox',
            'select all',
            { matchCase: false },
          ).should('have.prop', 'indeterminate', false)

          cy.contains(
            'pep-pharos-modal[open] .feature-selection pep-pharos-heading pep-pharos-checkbox',
            'search results',
            { matchCase: false },
          ).should('have.prop', 'indeterminate', false)

          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('view snippet', { matchCase: false })
            .click()

          cy.contains(
            'pep-pharos-modal[open] .feature-selection pep-pharos-checkbox',
            'select all',
            { matchCase: false },
          )
            .should('have.prop', 'indeterminate', true)
            .should('have.prop', 'checked', false)

          cy.contains(
            'pep-pharos-modal[open] .feature-selection pep-pharos-heading pep-pharos-checkbox',
            'search results',
            { matchCase: false },
          )
            .should('have.prop', 'indeterminate', true)
            .should('have.prop', 'checked', false)

          cy.contains(
            'pep-pharos-modal[open] .feature-selection pep-pharos-heading pep-pharos-checkbox',
            'search results',
            { matchCase: false },
          ).click()

          cy.contains(
            'pep-pharos-modal[open] .feature-selection pep-pharos-heading pep-pharos-checkbox',
            'search results',
            { matchCase: false },
          )
            .should('have.prop', 'indeterminate', false)
            .should('have.prop', 'checked', true)

          cy.contains(
            'pep-pharos-modal[open] .feature-selection pep-pharos-checkbox',
            'select all',
            { matchCase: false },
          )
            .should('have.prop', 'indeterminate', true)
            .should('have.prop', 'checked', false)
        })
      })

      context('When adding users', () => {
        beforeEach(() => {
          cy.intercept('POST', routes.entities.add('users'), {
            fixture: 'account/add_user__two_groups__request.json',
          }).as('addUser')

          cy.get('pep-pharos-button')
            .contains('Add User', { matchCase: false })
            .should('be.visible')
            .click()
        })
        it('Shows group selection for add users', () => {
          cy.get('pep-pharos-modal[open] .group-selector-combobox').should('be.visible')
          cy.get('pep-pharos-modal[open] .group-selector-combobox').click()
          cy.get('pep-pharos-modal[open] .group-selector-combobox option').should('have.length', 3)
          cy.get('pep-pharos-modal[open] .group-selector-combobox option')
            .eq(0)
            .contains('All Groups', { matchCase: false })
          cy.get('pep-pharos-modal[open] .group-selector-combobox option')
            .eq(1)
            .contains('Ilium', { matchCase: false })
          cy.get('pep-pharos-modal[open] .group-selector-combobox option')
            .eq(2)
            .contains('Ithaka', { matchCase: false })
        })
        it('Submits add user', () => {
          cy.get('pep-pharos-modal[open] .group-selector-combobox').should('be.visible')

          cy.get('pep-pharos-modal[open] .group-selector-combobox').click()

          cy.get('pep-pharos-modal[open] .group-selector-combobox option')
            .eq(0)
            .contains('All Groups', { matchCase: false })

          cy.get('pep-pharos-modal[open] .group-selector-combobox')
            .shadow()
            .find('li[role="option"]')
            .contains('all groups', { matchCase: false })
            .click()

          cy.get('pep-pharos-input-group[id="users_name"]').shadow().find('input').type('t')

          // NOTE: This test may occasionally fail because cypress typing into Pharos inputs sometimes
          // gets things out of order. If this happens, just run the test again.
          cy.get('pep-pharos-input-group[id="users_contact"]')
            .shadow()
            .find('input')
            .type('t@t.com')

          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-button')
            .contains('ilium', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-dropdown-menu-item')
            .contains('ithaka', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] .feature-selection pep-pharos-checkbox')
            .contains('select all', { matchCase: false })
            .click()

          cy.get('pep-pharos-modal[open] pep-pharos-button')
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
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__two_groups_remove_users__response.json',
        }).as('auth')
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('users'), {
          fixture: 'account/get_users__two_groups__response.json',
        }).as('users')
        cy.intercept('DELETE', routes.entities.remove('users'), {
          fixture: 'account/remove_user__two_groups__request.json',
        }).as('removeUser')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@users'])
      })

      it('Shows group selection for remove users', () => {
        cy.get('pep-pharos-button').contains('Remove', { matchCase: false }).click()
        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('be.visible')
        cy.get('pep-pharos-modal[open] .group-selector-combobox').click()
        cy.get('pep-pharos-modal[open] .group-selector-combobox option').should('have.length', 3)
        cy.get('pep-pharos-modal[open] .group-selector-combobox option')
          .eq(0)
          .contains('All Groups', { matchCase: false })
        cy.get('pep-pharos-modal[open] .group-selector-combobox option')
          .eq(1)
          .contains('Ilium', { matchCase: false })
        cy.get('pep-pharos-modal[open] .group-selector-combobox option')
          .eq(2)
          .contains('Ithaka', { matchCase: false })
      })

      it('Submits user removal', () => {
        cy.get('pep-pharos-button').contains('Remove', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('Remove', { matchCase: false })
          .click()

        cy.fixture('account/remove_user__two_groups__request.json').then((request) => {
          cy.wait('@removeUser').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When user can edit facilities', () => {
      beforeEach(() => {
        interceptAuthWithFacilityAccess(
          'auth/users/admin__two_groups_edit_facilities__response.json',
        )
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('facilities')
        cy.intercept('PATCH', routes.entities.edit('facilities'), {
          fixture: 'account/edit_facility__one_group__request.json',
        }).as('editFacility')
        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@facilities'])
      })

      // Facilities can only be in one group, so there should be no group selection
      it('Does not show group selection for edit facilities', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()
        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('not.exist')
      })

      // NOTE: Facilities can only be in one group, so there should be no group selection
      it('Submits facility edit', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        assertFacilityPayloadWithFixture(
          '@editFacility',
          'account/edit_facility__one_group__request.json',
        )
      })
    })

    context('When user can manage facilities', () => {
      beforeEach(() => {
        interceptAuthWithFacilityAccess(
          'auth/users/admin__two_groups_manage_facilities__response.json',
        )
        cy.intercept('POST', routes.features.grouped.get, {
          fixture: 'auth/features/basic_features.json',
        }).as('features')
        cy.intercept('POST', routes.entities.get('facilities'), {
          fixture: 'account/get_facilities__response.json',
        }).as('facilities')
        cy.intercept('PATCH', routes.entities.edit('facilities'), {
          fixture: 'account/manage_facility__one_group__request.json',
        }).as('manageFacility')
        cy.intercept('DELETE', routes.entities.remove('facilities'), {
          fixture: 'account/remove_facility__one_group__request.json',
        }).as('removeFacility')
        cy.intercept('POST', routes.entities.add('facilities'), {
          fixture: 'account/add_facility__one_group__request.json',
        }).as('addFacility')
        cy.intercept('POST', routes.subdomains.get, {
          fixture: 'subdomains/get_subdomains__all_active__response.json',
        }).as('getSubdomains')

        cy.visit('/account?term=&page=1')
        cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@facilities'])
      })

      // Facilities can only be in one group, so there should be no group selection for anything
      // except adding facilities
      it('Does not show group selection for edit facilities', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()
        cy.get('pep-pharos-modal[open] pep-pharos-heading')
          .contains('GROUP', { matchCase: false })
          .should('not.exist')
      })

      it('Submits facility management', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] pep-pharos-heading')
          .contains('GROUP', { matchCase: false })
          .should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]').shadow().find('input').type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]').shadow().find('input').type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        assertFacilityPayloadWithFixture(
          '@manageFacility',
          'account/manage_facility__one_group__request.json',
        )
      })

      it('Submits facility management with subdomain', () => {
        cy.wait(['@getSubdomains'])

        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('not.exist')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-input-group[id="4_name"]').shadow().find('input').type('t')

        cy.get('pep-pharos-input-group[id="4_contact"]').shadow().find('input').type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open]')
          .find('#4_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]').find('#4_subdomain').should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]')
          .find('#4_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open]').find('#4_subdomain').click()

        cy.get('pep-pharos-modal[open]')
          .find('#4_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal[open]').find('#4_subdomain').shadow().find('ul>li').first().click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        assertFacilityPayloadWithFixture(
          '@manageFacility',
          'account/manage_facility__one_group_subdomain__request.json',
        )
      })

      it('Submits facility removal', () => {
        cy.get('pep-pharos-button').contains('Remove', { matchCase: false }).click()
        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('remove', { matchCase: false })
          .click()
        cy.fixture('account/remove_facility__one_group__request.json').then((request) => {
          cy.wait('@removeFacility').its('request.body').should('deep.eq', request)
        })
      })

      it('Shows group radio buttons when adding facility', () => {
        cy.get('pep-pharos-button').contains('Add Facility', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('be.visible')

        cy.get('pep-pharos-modal[open] .group-selector-combobox option').should('have.length', 2)

        cy.get('pep-pharos-modal[open] .group-selector-combobox option')
          .eq(0)
          .contains('Ilium', { matchCase: false })

        cy.get('pep-pharos-modal[open] .group-selector-combobox option')
          .eq(1)
          .contains('Ithaka', { matchCase: false })
      })

      it('Submits add facility', () => {
        cy.get('pep-pharos-button').contains('Add Facility', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] pep-pharos-input-group[id="facilities_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-input-group[id="facilities_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('be.visible')

        cy.get('pep-pharos-modal[open] .group-selector-combobox').click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox')
          .shadow()
          .find('li[role="option"]')
          .contains('ithaka', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        assertFacilityPayloadWithFixture(
          '@addFacility',
          'account/add_facility__one_group__request.json',
        )
      })

      it('Submits add facility with subdomain', () => {
        cy.wait(['@getSubdomains'])
        cy.get('pep-pharos-button').contains('Add Facility', { matchCase: false }).click()

        cy.get('pep-pharos-modal[open] pep-pharos-input-group[id="facilities_name"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-input-group[id="facilities_contact"]')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('use subdomain', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_primary_sitecode')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_subdomain')
          .should('have.prop', 'invalidated')

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_primary_sitecode')
          .shadow()
          .find('input')
          .type('t')

        cy.get('pep-pharos-modal[open]').find('#facilities_subdomain').click()

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .should('have.length', 3)

        cy.get('pep-pharos-modal[open]')
          .find('#facilities_subdomain')
          .shadow()
          .find('ul>li')
          .first()
          .click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox').should('be.visible')

        cy.get('pep-pharos-modal[open] .group-selector-combobox').click()

        cy.get('pep-pharos-modal[open] .group-selector-combobox')
          .shadow()
          .find('li[role="option"]')
          .contains('ithaka', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-checkbox')
          .contains('select all', { matchCase: false })
          .click()

        cy.get('pep-pharos-modal[open] pep-pharos-button')
          .contains('submit', { matchCase: false })
          .click()
        assertFacilityPayloadWithFixture(
          '@addFacility',
          'account/add_facility__one_group_subdomain__request.json',
        )
      })
    })
  })
})
