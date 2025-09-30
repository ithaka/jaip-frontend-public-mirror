import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Management', () => {
  context('For admins', () => {
    beforeEach(() => {
      handleLocation('/management?term=&page=1', cy, 'managementPage', 'pep-admin')
      cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }) // no alerts
        .as('alerts')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.groups.get, {
        fixture: 'auth/groups/get_groups__response.json',
      }).as('getGroups')
      cy.intercept('POST', routes.groups.add, {
        fixture: 'auth/groups/add_group__request.json',
      }).as('addGroup')
      cy.intercept('PATCH', routes.groups.edit, {
        fixture: 'auth/groups/edit_group__request.json',
      }).as('editGroup')
      cy.intercept('DELETE', routes.groups.remove, {
        fixture: 'auth/groups/delete_group__request.json',
      }).as('deleteGroup')
      cy.intercept('PATCH', routes.groups.reactivate, {
        fixture: 'auth/groups/reactivate_group__request.json',
      }).as('reactivateGroup')
      cy.intercept('DELETE', routes.groups.clearHistory, {
        fixture: 'auth/groups/clear_history__request.json',
      }).as('clearHistory')
      cy.intercept('POST', routes.entities.get('users'), {
        fixture: 'auth/users/get_users__ungrouped_features__response.json',
      }).as('getUsers')
      cy.intercept('POST', routes.entities.add('users'), {
        fixture: 'auth/users/add_user__request.json',
      }).as('addUser')
      cy.intercept('PATCH', routes.entities.edit('users'), {
        fixture: 'auth/users/edit_user__ungrouped_features__request.json',
      }).as('editUser')
      cy.intercept('POST', routes.groups.addAdministrator, {
        fixture: 'auth/users/create_group_admin__request.json',
      }).as('createGroupAdmin')

      cy.intercept('POST', routes.subdomains.get, {
        fixture: 'auth/subdomains/get_subdomains__response.json',
      }).as('getSubdomains')
      cy.intercept('POST', routes.subdomains.add, {
        fixture: 'auth/subdomains/add_subdomain__request.json',
      }).as('addSubdomain')
      cy.intercept('PATCH', routes.subdomains.edit, {
        fixture: 'auth/subdomains/edit_subdomain__request.json',
      }).as('editSubdomain')
      cy.intercept('DELETE', routes.subdomains.remove, {
        fixture: 'auth/subdomains/delete_subdomain__request.json',
      }).as('deleteSubdomain')
      cy.intercept('POST', routes.subdomains.reactivate, {
        fixture: 'auth/subdomains/reactivate_subdomain__request.json',
      }).as('reactivateSubdomain')

      cy.intercept('POST', routes.features.grouped.get, {
        fixture: 'auth/features/basic_features.json',
      }).as('getFeatures')
      cy.intercept('POST', routes.features.grouped.add, {
        fixture: 'auth/features/add_feature__request.json',
      }).as('addFeature')
      cy.intercept('PATCH', routes.features.grouped.edit, {
        fixture: 'auth/features/edit_feature__request.json',
      }).as('editFeature')
      cy.intercept('DELETE', routes.features.grouped.remove, {
        fixture: 'auth/features/delete_feature__request',
      }).as('deleteFeature')
      cy.intercept('POST', routes.features.grouped.reactivate, {
        fixture: 'auth/features/reactivate_feature__request.json',
      }).as('reactivateFeature')

      cy.intercept('POST', routes.features.ungrouped.get, {
        fixture: 'auth/features/ungrouped_features__response.json',
      }).as('getUngroupedFeatures')
      cy.intercept('POST', routes.features.ungrouped.add, {
        fixture: 'auth/features/add_ungrouped_feature__request.json',
      }).as('addUngroupedFeature')
      cy.intercept('PATCH', routes.features.ungrouped.edit, {
        fixture: 'auth/features/edit_ungrouped_feature__request.json',
      }).as('editUngroupedFeature')
      cy.intercept('DELETE', routes.features.ungrouped.remove, {
        fixture: 'auth/features/delete_feature__request',
      }).as('deleteUngroupedFeature')
      cy.intercept('POST', routes.features.ungrouped.reactivate, {
        fixture: 'auth/features/reactivate_feature__request.json',
      }).as('reactivateUngroupedFeature')
    })

    context('When logged in', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__one_group_bulk_approve__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures'])
      })
      it('Shows no access to account management', () => {
        cy.contains('Page Not Found', { matchCase: false })
      })
    })

    context('When logged in with add_group', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_group__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getGroups'])
      })
      it('Has group management panel', () => {
        cy.get('pep-pharos-tab').contains('Groups', { matchCase: false }).should('be.visible')
      })
      it('Allows adding groups', () => {
        cy.contains('Add Group', { matchCase: false }).should('be.visible')
        cy.contains('Add Group', { matchCase: false }).click()
        cy.get('#add-group-modal').should('be.visible')
        cy.get('#add-group-modal').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#add-group-modal').contains('Submit', { matchCase: false }).click()
        cy.get('#add-group-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#add-group-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-group-modal').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/groups/add_group__request.json').then((request) => {
          cy.wait('@addGroup').its('request.body').should('deep.eq', request)
        })
      })

      it('Shows group list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in group', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Edit')
          .should('not.contain', 'Clear History')
      })
    })

    context('When logged in with edit_group', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_edit_group__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getGroups'])
      })
      it('Has group management panel', () => {
        cy.get('pep-pharos-tab').contains('Groups', { matchCase: false }).should('be.visible')
      })
      it('Does not allow adding groups', () => {
        cy.contains('Add Group', { matchCase: false }).should('not.exist')
      })

      it('Shows group list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in group', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Clear History')
      })
      it('Does not allow blank inputs', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('edit', { matchCase: false })
          .click()

        cy.get('[data-cy="edit-group-modal"]').should('be.visible')
        cy.get('[data-cy="edit-group-modal"]')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('[data-cy="edit-group-modal"]')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
        cy.get('[data-cy="edit-group-modal"]').contains('Submit', { matchCase: false }).click()
        cy.get('[data-cy="edit-group-modal"]')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
      })

      it('Allows editing', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('edit', { matchCase: false })
          .click()

        cy.get('[data-cy="edit-group-modal"]').should('be.visible')
        cy.get('[data-cy="edit-group-modal"]')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('[data-cy="edit-group-modal"]').find('form').find('pep-pharos-input-group').shadow()
        cy.get('[data-cy="edit-group-modal"] form pep-pharos-input-group')
          .shadow()
          .find('input')
          .then(($inputs) => {
            cy.wrap($inputs[0]).clear()
            cy.wrap($inputs[0]).type('t', { force: true })
          })
        cy.get('[data-cy="edit-group-modal"]').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/groups/edit_group__request.json').then((request) => {
          cy.wait('@editGroup').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with delete_group', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_delete_group__response.json',
        }).as('auth')

        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getGroups'])
      })
      it('Has group management panel', () => {
        cy.get('pep-pharos-tab').contains('Groups', { matchCase: false }).should('be.visible')
      })
      it('Does not allow adding groups', () => {
        cy.contains('Add Group', { matchCase: false }).should('not.exist')
      })

      it('Shows group list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in group', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Edit')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Clear History')
      })
      it('Allows deleting', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('delete', { matchCase: false })
          .click()

        cy.get('#delete-group-modal').should('be.visible')
        cy.get('#delete-group-modal').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#delete-group-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#delete-group-modal').contains('Submit', { matchCase: false }).click()
        cy.get('#delete-group-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#delete-group-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('delete')
        cy.get('#delete-group-modal').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/groups/delete_group__request.json').then((request) => {
          cy.wait('@deleteGroup').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with reactivate_group', () => {
      beforeEach(() => {
        cy.intercept('POST', routes.groups.get, {
          fixture: 'auth/groups/get_groups__inactive__response.json',
        }).as('getGroupsInactive')

        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_group__response.json',
        }).as('auth')

        cy.visit('/management?term=&page=1')
        cy.wait([
          '@managementPage',
          '@alerts',
          '@env',
          '@auth',
          '@getFeatures',
          '@getGroupsInactive',
        ])
      })
      it('Has group management panel', () => {
        cy.get('pep-pharos-tab').contains('Groups', { matchCase: false }).should('be.visible')
      })
      it('Allows adding groups', () => {
        cy.contains('Add Group', { matchCase: false }).should('be.visible')
      })

      it('Shows group list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in group', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Edit')
          .should('not.contain', 'Delete')
          .should('not.contain', 'Clear History')
      })
      it('Allows reactivating', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('reactivate', { matchCase: false })
          .click()

        cy.get('#reactivate-group-modal').should('be.visible')
        cy.get('#reactivate-group-modal')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#reactivate-group-modal').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/groups/reactivate_group__request.json').then((request) => {
          cy.wait('@reactivateGroup').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with clear_history', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_clear_history__response.json',
        }).as('auth')

        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getGroups'])
      })
      it('Has group management panel', () => {
        cy.get('pep-pharos-tab').contains('Groups', { matchCase: false }).should('be.visible')
      })
      it('Allows adding groups', () => {
        cy.contains('Add Group', { matchCase: false }).should('not.exist')
      })

      it('Shows group list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in group', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Edit')
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
      })
      it('Allows reactivating', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('clear history', { matchCase: false })
          .click()

        cy.get('#clear-history-modal').should('be.visible')
        cy.get('#clear-history-modal').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#clear-history-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#clear-history-modal').contains('Submit', { matchCase: false }).click()
        cy.get('#clear-history-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#clear-history-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('clear history')
        cy.get('#clear-history-modal').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/groups/clear_history__request.json').then((request) => {
          cy.wait('@clearHistory').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with manage_superusers', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_manage_superusers__response.json',
        }).as('auth')

        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getUsers'])
      })
      it('Has user management panel', () => {
        cy.get('pep-pharos-tab').contains('Users', { matchCase: false }).should('be.visible')
      })

      it('Does not have group admin button', () => {
        cy.contains('Make Group Admin', { matchCase: false }).should('not.exist')
      })

      it('Allows adding users', () => {
        cy.contains('Add User', { matchCase: false }).should('be.visible')
        cy.contains('Add User', { matchCase: false }).click()
        cy.get('#edit-user-modal-0').should('be.visible')
        cy.get('#edit-user-modal-0').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#edit-user-modal-0').contains('Submit', { matchCase: false }).click()
        cy.get('#edit-user-modal-0')
          .find('form')
          .find('pep-pharos-input-group#user_name')
          .should('have.prop', 'invalidated')
        cy.get('#edit-user-modal-0')
          .find('form')
          .find('pep-pharos-input-group#user_name')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-user-modal-0')
          .find('form')
          .find('pep-pharos-input-group#user_contact')
          .should('have.prop', 'invalidated')
        cy.get('#edit-user-modal-0')
          .find('form')
          .find('pep-pharos-input-group#user_contact')
          .shadow()
          .find('input')
          .type('t')

        cy.get('#edit-user-modal-0')
          .find('pep-pharos-checkbox')
          .contains('Select All')
          .should('be.visible')
          .click()
        cy.get('#edit-user-modal-0').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/users/add_user__request.json').then((request) => {
          cy.wait('@addUser').its('request.body').should('deep.eq', request)
          cy.wait(['@auth', '@getUsers'])
        })
      })

      it('Allows editing users', () => {
        cy.contains('Edit', { matchCase: false }).first().click()
        cy.get('#edit-user-modal-3').eq(0).should('be.visible')
        cy.get('#edit-user-modal-3')
          .find('form')
          .find('pep-pharos-input-group#user_name')
          .shadow()
          .find('input')
          .should('have.value', 'Test User')
        cy.get('#edit-user-modal-3')
          .find('form')
          .find('pep-pharos-input-group#user_contact')
          .shadow()
          .find('input')
          .should('have.value', 'user.name@ithaka.org')
        cy.get('#edit-user-modal-3')
          .find('pep-pharos-checkbox')
          .contains('Select All')
          .should('be.visible')
          .click()
        cy.get('#edit-user-modal-3').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/users/edit_user__ungrouped_features__request.json').then((request) => {
          cy.wait('@editUser').its('request.body').should('deep.eq', request)
          cy.wait(['@auth', '@getUsers'])
        })
      })
    })

    context('When logged in with create_group_admins', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_create_group_admins__response.json',
        }).as('auth')

        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getUsers'])
      })
      it('Has user management panel', () => {
        cy.get('pep-pharos-tab').contains('Users', { matchCase: false }).should('be.visible')
      })

      it('Does not have editing button', () => {
        cy.get('pep-pharos-button').contains('Edit', { matchCase: false }).should('not.exist')
      })

      it('Does not have add user button', () => {
        cy.get('pep-pharos-button').contains('Add User', { matchCase: false }).should('not.exist')
      })

      it('Has group admin button', () => {
        cy.get('pep-pharos-button')
          .contains('Make Group Admin', { matchCase: false })
          .should('be.visible')
      })

      it('Allows making group admins', () => {
        cy.get('pep-pharos-button')
          .contains('Make Group Admin', { matchCase: false })
          .first()
          .click()

        cy.get('#add-admin-modal-3').should('be.visible')
        cy.get('#add-admin-modal-3').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#add-admin-modal-3')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#add-admin-modal-3').contains('Submit', { matchCase: false }).click()
        cy.get('#add-admin-modal-3')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#add-admin-modal-3')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('bad input')
        cy.get('#add-admin-modal-3')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#add-admin-modal-3')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#add-admin-modal-3')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('add administrator')
        cy.get('#add-admin-modal-3').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/users/create_group_admin__request.json').then((request) => {
          cy.wait('@createGroupAdmin').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with add_subdomain', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_subdomain__response.json',
        }).as('auth')

        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getSubdomains'])
      })
      it('Has subdomain management panel', () => {
        cy.get('pep-pharos-tab').contains('Subdomains', { matchCase: false }).should('be.visible')
      })
      it('Allows adding subdomains', () => {
        cy.contains('Add Subdomain', { matchCase: false }).should('be.visible')
        cy.contains('Add Subdomain', { matchCase: false }).click()
        cy.get('#add-subdomain-modal').should('be.visible')
        cy.get('#add-subdomain-modal').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#add-subdomain-modal').contains('Submit', { matchCase: false }).click()
        cy.get('#add-subdomain-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#add-subdomain-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-subdomain-modal').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/subdomains/add_subdomain__request.json').then((request) => {
          cy.wait('@addSubdomain').its('request.body').should('deep.eq', request)
        })
      })

      it('Shows subdomain list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in subdomain', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Edit')
      })
    })

    context('When logged in with edit_subdomain', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_edit_subdomain__response.json',
        }).as('auth')

        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getSubdomains'])
      })
      it('Has subdomain management panel', () => {
        cy.get('pep-pharos-tab').contains('Subdomains', { matchCase: false }).should('be.visible')
      })
      it('Does not allow adding subdomains', () => {
        cy.contains('Add Subdomain', { matchCase: false }).should('not.exist')
      })

      it('Shows group list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in group', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
      })
      it('Allows editing', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('edit', { matchCase: false })
          .click()

        cy.get('#edit-subdomain-modal-2').should('be.visible')
        cy.get('#edit-subdomain-modal-2')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#edit-subdomain-modal-2')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-subdomain-modal-2').contains('Submit', { matchCase: false }).click()
        cy.get('#edit-subdomain-modal-2')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#edit-subdomain-modal-2')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-subdomain-modal-2').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/subdomains/edit_subdomain__request.json').then((request) => {
          cy.wait('@editSubdomain').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with delete_subdomain', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_delete_subdomain__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getSubdomains'])
      })
      it('Has subdomain management panel', () => {
        cy.get('pep-pharos-tab').contains('Subdomains', { matchCase: false }).should('be.visible')
      })
      it('Does not allow adding subdomains', () => {
        cy.contains('Add Subdomain', { matchCase: false }).should('not.exist')
      })

      it('Shows subdomain list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in subdomain', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Edit')
          .should('not.contain', 'Reactivate')
      })
      it('Allows deleting', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('delete', { matchCase: false })
          .click()

        cy.get('#delete-subdomain-modal-2').should('be.visible')
        cy.get('#delete-subdomain-modal-2')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#delete-subdomain-modal-2')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#delete-subdomain-modal-2').contains('Submit', { matchCase: false }).click()
        cy.get('#delete-subdomain-modal-2')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#delete-subdomain-modal-2')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('delete')
        cy.get('#delete-subdomain-modal-2').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/groups/delete_group__request.json').then((request) => {
          cy.wait('@deleteSubdomain').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with add_subdomain and inactive subdomains', () => {
      beforeEach(() => {
        cy.intercept('POST', routes.subdomains.get, {
          fixture: 'auth/subdomains/get_subdomains__inactive__response.json',
        }).as('getSubdomainsInactive')

        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_subdomain__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait([
          '@managementPage',
          '@alerts',
          '@env',
          '@auth',
          '@getFeatures',
          '@getSubdomainsInactive',
        ])
      })
      it('Has subdomain management panel', () => {
        cy.get('pep-pharos-tab').contains('Subdomains', { matchCase: false }).should('be.visible')
      })
      it('Allows adding subdomains', () => {
        cy.contains('Add Subdomain', { matchCase: false }).should('be.visible')
      })

      it('Shows subdomain list', () => {
        cy.get('.group-card').should('have.length', 2).should('be.visible')
      })

      it('Does not allow other actions in subdomain', () => {
        cy.get('.group-card').first().should('not.contain', 'Edit').should('not.contain', 'Delete')
      })
      it('Allows reactivating', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('reactivate', { matchCase: false })
          .click()

        cy.get('#reactivate-subdomain-modal-2').should('be.visible')
        cy.get('#reactivate-subdomain-modal-2')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#reactivate-subdomain-modal-2').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/subdomains/reactivate_subdomain__request.json').then((request) => {
          cy.wait('@reactivateSubdomain').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with add_feature', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getFeatures'])
      })
      it('Has features management panel', () => {
        cy.get('pep-pharos-tab').contains('Features', { matchCase: false }).should('be.visible')
      })
      it('Allows adding features', () => {
        cy.contains('Add Feature', { matchCase: false }).should('be.visible')
        cy.contains('Add Feature', { matchCase: false }).click()
        cy.get('#add-feature-modal').should('be.visible')
        cy.get('#add-feature-modal').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#add-feature-modal').contains('Submit', { matchCase: false }).click()
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_name')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_display_name')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_category')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_description')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal').find('form').find('pep-pharos-checkbox#admin_checkbox').click()
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-checkbox#protected_checkbox')
          .click()
        cy.get('#add-feature-modal').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/add_feature__request.json').then((request) => {
          cy.wait('@addFeature').its('request.body').should('deep.eq', request)
        })
      })

      it('Shows feature list', () => {
        cy.get('.group-card').should('have.length', 15).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Edit')
          .should('not.contain', 'Clear History')
      })
    })

    context('When logged in with edit_feature', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_edit_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getFeatures'])
      })
      it('Has feature management panel', () => {
        cy.get('pep-pharos-tab').contains('Features', { matchCase: false }).should('be.visible')
      })
      it('Does not allow adding features', () => {
        cy.contains('Add Feature', { matchCase: false }).should('not.exist')
      })

      it('Shows features list', () => {
        cy.get('.group-card').should('have.length', 15).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Clear History')
      })
      it('Allows editing', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('edit', { matchCase: false })
          .click()

        cy.get('#edit-feature-modal-1').should('be.visible')
        cy.get('#edit-feature-modal-1')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')

        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_name-1')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_display_name-1')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_category-1')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_description-1')
          .shadow()
          .find('input')
          .clear()

        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_name-1')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_display_name-1')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_category-1')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_description-1')
          .shadow()
          .find('input')
          .type('t')

        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-checkbox#admin_checkbox-1')
          .click()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-checkbox#protected_checkbox-1')
          .click()

        cy.get('#edit-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/edit_feature__request.json').then((request) => {
          cy.wait('@editFeature').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with delete_feature', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_delete_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getFeatures'])
      })
      it('Has feature management panel', () => {
        cy.get('pep-pharos-tab').contains('Features', { matchCase: false }).should('be.visible')
      })
      it('Does not allow adding features', () => {
        cy.contains('Add Feature', { matchCase: false }).should('not.exist')
      })

      it('Shows features list', () => {
        cy.get('.group-card').should('have.length', 15).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Edit')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Clear History')
      })
      it('Allows deleting', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('delete', { matchCase: false })
          .click()

        cy.get('#delete-feature-modal-1').should('be.visible')
        cy.get('#delete-feature-modal-1')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#delete-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#delete-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.get('#delete-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#delete-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('delete')

        cy.get('#delete-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/delete_feature__request.json').then((request) => {
          cy.wait('@deleteFeature').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with add_feature and inactive features', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait(['@managementPage', '@alerts', '@env', '@auth', '@getFeatures', '@getFeatures'])
      })
      it('Has features management panel', () => {
        cy.get('pep-pharos-tab').contains('Features', { matchCase: false }).should('be.visible')
      })

      it('Shows feature list', () => {
        cy.get('.group-card').should('have.length', 15).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Edit')
          .should('not.contain', 'Clear History')
      })

      it('Allows reactivating', () => {
        cy.get('.group-card')
          .find('pep-pharos-button')
          .contains('reactivate', { matchCase: false })
          .scrollIntoView()

        cy.get('.group-card')
          .find('pep-pharos-button')
          .contains('reactivate', { matchCase: false })
          .click()

        cy.get('#reactivate-subdomain-modal-15').should('be.visible')
        cy.get('#reactivate-subdomain-modal-15')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#reactivate-subdomain-modal-15').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/reactivate_feature__request.json').then((request) => {
          cy.wait('@reactivateFeature').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with add_ungrouped_feature', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_ungrouped_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait([
          '@managementPage',
          '@alerts',
          '@env',
          '@auth',
          '@getFeatures',
          '@getUngroupedFeatures',
        ])
      })
      it('Has features management panel', () => {
        cy.get('pep-pharos-tab')
          .contains('Ungrouped Features', { matchCase: false })
          .should('be.visible')
      })
      it('Allows adding features', () => {
        cy.contains('Add Feature', { matchCase: false }).should('be.visible')
        cy.contains('Add Feature', { matchCase: false }).click()
        cy.get('#add-feature-modal').should('be.visible')
        cy.get('#add-feature-modal').contains('Submit', { matchCase: false }).should('be.visible')
        cy.get('#add-feature-modal').contains('Submit', { matchCase: false }).click()
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_name')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_display_name')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_category')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-input-group#feature_description')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-checkbox#admin_checkbox')
          .should('not.exist')
        cy.get('#add-feature-modal')
          .find('form')
          .find('pep-pharos-checkbox#protected_checkbox')
          .should('not.exist')

        cy.get('#add-feature-modal').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/add_ungrouped_feature__request.json').then((request) => {
          cy.wait('@addUngroupedFeature').its('request.body').should('deep.eq', request)
        })
      })

      it('Shows feature list', () => {
        cy.get('.group-card').should('have.length', 11).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Edit')
          .should('not.contain', 'Clear History')
      })
    })

    context('When logged in with edit_ungrouped_feature', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_edit_ungrouped_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait([
          '@managementPage',
          '@alerts',
          '@env',
          '@auth',
          '@getFeatures',
          '@getUngroupedFeatures',
        ])
      })
      it('Has feature management panel', () => {
        cy.get('pep-pharos-tab')
          .contains('Ungrouped Features', { matchCase: false })
          .should('be.visible')
      })
      it('Does not allow adding features', () => {
        cy.get('pep-pharos-button').contains('Add Feature').should('not.exist')
      })

      it('Shows features list', () => {
        cy.get('.group-card').should('have.length', 11).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Clear History')
      })
      it('Allows editing', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('edit', { matchCase: false })
          .click()

        cy.get('#edit-feature-modal-1').should('be.visible')
        cy.get('#edit-feature-modal-1')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')

        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_name-1')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_display_name-1')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_category-1')
          .shadow()
          .find('input')
          .clear()
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_description-1')
          .shadow()
          .find('input')
          .clear()

        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_name-1')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_display_name-1')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_category-1')
          .shadow()
          .find('input')
          .type('t')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group#feature_description-1')
          .shadow()
          .find('input')
          .type('t')

        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-checkbox#admin_checkbox-1')
          .should('not.exist')
        cy.get('#edit-feature-modal-1')
          .find('form')
          .find('pep-pharos-checkbox#protected_checkbox-1')
          .should('not.exist')

        cy.get('#edit-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/edit_ungrouped_feature__request.json').then((request) => {
          cy.wait('@editUngroupedFeature').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with delete_ungrouped_feature', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_delete_ungrouped_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait([
          '@managementPage',
          '@alerts',
          '@env',
          '@auth',
          '@getFeatures',
          '@getUngroupedFeatures',
        ])
      })
      it('Has feature management panel', () => {
        cy.get('pep-pharos-tab')
          .contains('Ungrouped Features', { matchCase: false })
          .should('be.visible')
      })
      it('Does not allow adding features', () => {
        cy.get('pep-pharos-button')
          .contains('Add Feature', { matchCase: false })
          .should('not.exist')
      })

      it('Shows features list', () => {
        cy.get('.group-card').should('have.length', 11).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Edit')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Clear History')
      })
      it('Allows deleting', () => {
        cy.get('.group-card')
          .first()
          .find('pep-pharos-button')
          .contains('delete', { matchCase: false })
          .click()

        cy.get('#delete-feature-modal-1').should('be.visible')
        cy.get('#delete-feature-modal-1')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#delete-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .clear()
        cy.get('#delete-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.get('#delete-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .should('have.prop', 'invalidated')
        cy.get('#delete-feature-modal-1')
          .find('form')
          .find('pep-pharos-input-group')
          .shadow()
          .find('input')
          .type('delete')

        cy.get('#delete-feature-modal-1').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/delete_feature__request.json').then((request) => {
          cy.wait('@deleteUngroupedFeature').its('request.body').should('deep.eq', request)
        })
      })
    })

    context('When logged in with add_ungrouped_feature and inactive features', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, {
          fixture: 'auth/users/admin__ungrouped_add_ungrouped_feature__response.json',
        }).as('auth')
        cy.visit('/management?term=&page=1')
        cy.wait([
          '@managementPage',
          '@alerts',
          '@env',
          '@auth',
          '@getFeatures',
          '@getUngroupedFeatures',
        ])
      })
      it('Has features management panel', () => {
        cy.get('pep-pharos-tab').contains('Features', { matchCase: false }).should('be.visible')
      })

      it('Shows feature list', () => {
        cy.get('.group-card').should('have.length', 11).should('be.visible')
      })

      it('Does not allow other actions in features', () => {
        cy.get('.group-card')
          .first()
          .should('not.contain', 'Delete')
          .should('not.contain', 'Reactivate')
          .should('not.contain', 'Edit')
          .should('not.contain', 'Clear History')
      })

      it('Allows reactivating', () => {
        cy.get('.group-card')
          .find('pep-pharos-button')
          .contains('reactivate', { matchCase: false })
          .scrollIntoView()

        cy.get('.group-card')
          .find('pep-pharos-button')
          .contains('reactivate', { matchCase: false })
          .click()

        cy.get('#reactivate-subdomain-modal-15').should('be.visible')
        cy.get('#reactivate-subdomain-modal-15')
          .contains('Submit', { matchCase: false })
          .should('be.visible')
        cy.get('#reactivate-subdomain-modal-15').contains('Submit', { matchCase: false }).click()
        cy.fixture('auth/features/reactivate_feature__request.json').then((request) => {
          cy.wait('@reactivateUngroupedFeature').its('request.body').should('deep.eq', request)
        })
      })
    })
  })
})
