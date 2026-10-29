import { createPinia } from 'pinia'
import { routes } from '../../src/config/api'
import { useCoreStore } from '../../src/stores/core'
import { RequestPermissionStatus } from '../../src/interfaces/Entities'
import type {
  Entity,
  EntityResponse,
  RequestPermissions,
  User,
} from '../../src/interfaces/Entities'
import {
  defaultLocaleDateRangeString,
  defaultLocaleDateString,
  setEndDate,
  setStartDate,
} from '../../src/utils/dates'
import { handleLocation } from './helpers'

const now = Date.UTC(2026, 9, 7, 12)
const activePause = {
  start_date: new Date('2026-10-01T00:00:00.000Z'),
  end_date: new Date('2026-10-15T23:59:59.999Z'),
}
const scheduledPause = {
  start_date: new Date('2026-10-12T00:00:00.000Z'),
  end_date: new Date('2026-10-15T23:59:59.999Z'),
}
const requestsOff: RequestPermissions = { start_date: new Date('2026-10-01T00:00:00.000Z') }

describe('Request management', () => {
  const coreStore = useCoreStore(createPinia())
  let facility: Entity

  beforeEach(() => {
    cy.viewport(1280, 800)
    cy.clock(now, ['Date'])
    cy.intercept('GET', routes.alerts.get, { body: { alerts: [], count: 0 } }).as('alerts')
    cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
    cy.intercept('POST', routes.features.grouped.get, {
      fixture: 'auth/features/basic_features.json',
    }).as('features')
    cy.intercept('POST', routes.subdomains.get, {
      fixture: 'subdomains/get_subdomains__all_active__response.json',
    })
    cy.on('window:before:load', (win) => {
      win.document.addEventListener('pharos-toast-open', cy.stub().as('toast'))
    })
  })

  const visitFacility = (permissions?: RequestPermissions) => {
    handleLocation('/account/facilities?term=&page=1', cy, 'accountPage', 'pep-admin')
    cy.fixture<User>('auth/users/admin__one_group_manage_facilities__response.json').then(
      (user) => {
        user.facilities = user.groups
          .filter((group) => group.features.edit_facilities || group.features.manage_facilities)
          .map((group) => ({ id: 4, type: 'facilities', groups: [group] }))
        cy.intercept('GET', routes.auth.get, { body: user }).as('auth')
      },
    )
    cy.fixture<EntityResponse>('account/get_facilities__response.json').then((response) => {
      facility = response.entities['4']!
      facility.request_permissions = permissions
      cy.intercept('POST', routes.entities.get('facilities'), (request) => {
        request.reply({ body: response })
      }).as('facilities')
    })
    cy.visit('/account/facilities?term=&page=1')
    cy.wait(['@accountPage', '@alerts', '@env', '@auth', '@features', '@facilities'])
  }

  context('Facility request settings', () => {
    ;[
      { name: 'on by default', permissions: undefined, status: 'On', action: 'Pause requests' },
      {
        name: RequestPermissionStatus.Paused,
        permissions: activePause,
        status: 'Paused',
        action: 'Resume early',
      },
      {
        name: RequestPermissionStatus.Off,
        permissions: requestsOff,
        status: 'Off',
        action: 'Turn back on',
      },
      {
        name: RequestPermissionStatus.Scheduled,
        permissions: scheduledPause,
        status: 'On',
        action: 'Edit pause request',
      },
      {
        name: 'on after a pause expires',
        permissions: {
          start_date: new Date('2026-10-01T00:00:00.000Z'),
          end_date: new Date('2026-10-06T23:59:59.999Z'),
        },
        status: 'On',
        action: 'Pause requests',
      },
    ].forEach(({ name, permissions, status, action }) => {
      it(`Shows requests ${name} with the appropriate controls`, () => {
        visitFacility(permissions)
        cy.get('.request-permissions__status .request-permissions__status-pill').should(
          ($pills) => {
            const labels = [...$pills].map((pill) => pill.textContent?.trim())
            expect(labels).to.deep.eq(
              name === RequestPermissionStatus.Scheduled ? ['On', 'Scheduled'] : [status],
            )
          },
        )
        cy.get('.request-permissions__buttons')
          .contains('pep-pharos-button', action)
          .should('be.visible')
        if (name === RequestPermissionStatus.Paused || name === RequestPermissionStatus.Off) {
          cy.get('.request-permissions__buttons').contains('Turn off requests').should('not.exist')
          cy.get('.request-permissions__buttons').contains('Pause requests').should('not.exist')
        } else {
          cy.get('.request-permissions__buttons').contains('Turn off requests').should('be.visible')
        }
        if (name === RequestPermissionStatus.Paused || name === RequestPermissionStatus.Scheduled) {
          cy.get(
            name === RequestPermissionStatus.Paused
              ? '.request-permissions__status--paused'
              : '.request-permissions__status--scheduled',
          )
            .should('contain.text', defaultLocaleDateString(permissions!.start_date))
            .and('contain.text', defaultLocaleDateString(permissions!.end_date!))
        }
      })
    })

    it('Creates a bounded pause and refreshes the facility status', () => {
      cy.intercept('POST', routes.request_management.add(), (request) => {
        facility.request_permissions = request.body
        request.reply({ body: {} })
      }).as('pause')
      visitFacility()
      cy.get('.request-permissions__buttons').contains('Pause requests').click()
      cy.get('.request-permissions__alert-preview').should(
        'contain.text',
        'Requests will be paused at ITHAKA Facility',
      )
      cy.get('#pause-requests-4-modal')
        .contains('pep-pharos-button', 'Pause requests')
        .should('have.attr', 'disabled')
      cy.get('#pause-requests-datepicker-4').click()
      cy.contains('pep-pharos-button', 'Today').click()
      cy.get('.datepicker__action-row').contains('pep-pharos-button', 'Select').click()
      cy.get('.request-permissions__alert-preview').should(
        'contain.text',
        defaultLocaleDateRangeString(setStartDate(new Date(now)), setEndDate(new Date(now))),
      )
      cy.get('#pause-requests-4-modal').contains('pep-pharos-button', 'Pause requests').click()
      cy.wait('@pause')
        .its('request.body')
        .should('deep.eq', {
          facility_id: 4,
          start_date: setStartDate(new Date(now)).toISOString(),
          end_date: setEndDate(new Date(now)).toISOString(),
        })
      cy.wait('@facilities')
      cy.get('#pause-requests-4-modal').should('not.exist')
      cy.get('.request-permissions__status-pill').should('contain.text', 'Paused')
    })

    it('Keeps the pause calendar in the dialog for keyboard selection', () => {
      visitFacility()
      cy.get('.request-permissions__buttons').contains('Pause requests').click()
      cy.get('#pause-requests-datepicker-4').shadow().find('button').focus()
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.get('#pause-requests-4-modal .dp--menu').should('be.visible')
      cy.get('.dp--today').parent('[role="gridcell"]').focus()
      cy.press(Cypress.Keyboard.Keys.RIGHT)
      cy.focused().should('have.attr', 'role', 'gridcell')
      cy.focused().find('.dp--today').should('not.exist')
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.press(Cypress.Keyboard.Keys.RIGHT)
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.get('.datepicker__action-row')
        .contains('pep-pharos-button', 'Select')
        .shadow()
        .find('button')
        .focus()
      cy.press(Cypress.Keyboard.Keys.ENTER)
      cy.get('.dp--menu').should('not.exist')
      cy.get('#pause-requests-4-modal')
        .contains('pep-pharos-button', 'Pause requests')
        .should('not.have.attr', 'disabled')
    })

    it('Edits a scheduled pause using PATCH rather than creating another permission', () => {
      cy.intercept('POST', routes.request_management.add(), { body: {} }).as('add')
      cy.intercept('PATCH', routes.request_management.edit(), (request) => {
        facility.request_permissions = request.body
        request.reply({ body: {} })
      }).as('edit')
      visitFacility(scheduledPause)
      cy.contains('pep-pharos-button', 'Edit pause request').click()
      cy.get('#pause-requests-4-modal').contains('pep-pharos-button', 'Pause requests').click()
      cy.wait('@edit')
        .its('request.body')
        .should('deep.eq', {
          facility_id: 4,
          start_date: setStartDate(scheduledPause.start_date).toISOString(),
          end_date: setEndDate(scheduledPause.end_date).toISOString(),
        })
      cy.wait('@facilities')
      cy.get('@add.all').should('have.length', 0)
      cy.get('#pause-requests-4-modal').should('not.exist')
    })
    ;[
      { name: 'resumes a pause early', permissions: activePause, action: 'Resume early' },
      { name: 'turns requests back on', permissions: requestsOff, action: 'Turn back on' },
    ].forEach(({ name, permissions, action }) => {
      it(`Confirms and ${name}`, () => {
        cy.intercept('DELETE', routes.request_management.remove(), (request) => {
          delete facility.request_permissions
          request.reply({ body: {} })
        }).as('resume')
        visitFacility(permissions)
        cy.contains('pep-pharos-button', action).click()
        cy.get('#turn-on-requests-4-modal').should(
          'contain.text',
          'This action will immediately enable users to make requests at ITHAKA Facility.',
        )
        cy.get('@resume.all').should('have.length', 0)
        cy.get('#turn-on-requests-4-modal')
          .contains('pep-pharos-button', 'Turn requests on')
          .click()
        cy.wait('@resume').its('request.body').should('deep.eq', { facility_id: 4 })
        cy.wait('@facilities')
        cy.get('.request-permissions__status-pill').should('have.text', 'On')
      })
    })

    it('Requires both confirmation steps before turning off requests', () => {
      cy.intercept('POST', routes.request_management.add(), (request) => {
        facility.request_permissions = request.body
        request.reply({ body: {} })
      }).as('off')
      visitFacility()
      cy.contains('pep-pharos-button', 'Turn off requests').click()
      cy.get('#turn-off-requests-4-modal').should(
        'contain.text',
        'Users will be unable to request JSTOR items beyond what is already available at ITHAKA Facility.',
      )
      cy.get('#turn-off-requests-4-modal').contains('pep-pharos-button', 'Next').click()
      cy.get('#turn-off-requests-4-modal').should(
        'contain.text',
        'This action will clear and archive all pending requests at ITHAKA Facility.',
      )
      cy.get('@off.all').should('have.length', 0)
      cy.get('#turn-off-requests-4-modal').contains('pep-pharos-button', 'Back').click()
      cy.get('#turn-off-requests-4-modal').contains('pep-pharos-button', 'Next').click()
      cy.get('#turn-off-requests-4-modal')
        .contains('pep-pharos-button', 'Turn off and delete requests')
        .click()
      cy.wait('@off')
        .its('request.body')
        .should('deep.eq', {
          facility_id: 4,
          start_date: setStartDate(new Date(now)).toISOString(),
          end_date: null,
        })
      cy.wait('@facilities')
      cy.get('.request-permissions__status-pill').should('have.text', 'Off')
    })

    it('Cancels changes without submitting request permissions', () => {
      cy.intercept('POST', routes.request_management.add(), { body: {} }).as('add')
      visitFacility()
      cy.contains('pep-pharos-button', 'Pause requests').click()
      cy.get('#pause-requests-4-modal').contains('pep-pharos-button', 'Cancel').click()
      cy.contains('pep-pharos-button', 'Turn off requests').click()
      cy.get('#turn-off-requests-4-modal').contains('pep-pharos-button', 'Next').click()
      cy.get('#turn-off-requests-4-modal').contains('pep-pharos-button', 'Cancel').click()
      cy.get('pep-pharos-modal[open]').should('not.exist')
      cy.get('@add.all').should('have.length', 0)
      cy.get('.request-permissions__status-pill').should('have.text', 'On')
    })
    ;[
      { name: 'creating a pause', permissions: undefined, method: 'POST' as const },
      { name: 'editing a pause', permissions: scheduledPause, method: 'PATCH' as const },
    ].forEach(({ name, permissions, method }) => {
      it(`Keeps the dialog open and reports an error when ${name} fails`, () => {
        cy.intercept(method, routes.request_management.add(), { statusCode: 500, body: {} }).as(
          'failure',
        )
        visitFacility(permissions)
        cy.get('.request-permissions__buttons')
          .contains(permissions ? 'Edit pause request' : 'Pause requests')
          .click()
        cy.get('#pause-requests-datepicker-4').click()
        cy.contains('pep-pharos-button', 'Today').click()
        cy.get('.datepicker__action-row').contains('pep-pharos-button', 'Select').click()
        cy.get('#pause-requests-4-modal').contains('pep-pharos-button', 'Pause requests').click()
        cy.wait('@failure')
        cy.get('@toast').should('have.been.calledWithMatch', {
          detail: {
            content: `We were unable to pause requests. Please try again and if the issue persists, contact ${coreStore.supportEmailDisplay}.`,
            status: 'error',
          },
        })
        cy.get('#pause-requests-4-modal').should('be.visible')
        cy.get('#pause-requests-4-modal')
          .contains('pep-pharos-button', 'Pause requests')
          .should('not.have.attr', 'disabled')
        cy.get('@facilities.all').should('have.length', 1)
      })
    })

    it('Reports a resume failure without changing the paused status', () => {
      cy.intercept('DELETE', routes.request_management.remove(), { statusCode: 500, body: {} }).as(
        'failure',
      )
      visitFacility(activePause)
      cy.contains('pep-pharos-button', 'Resume early').click()
      cy.get('#turn-on-requests-4-modal').contains('pep-pharos-button', 'Turn requests on').click()
      cy.wait('@failure')
      cy.get('@toast').should('have.been.calledWithMatch', {
        detail: {
          content: `We were unable to turn requests back on. Please try again and if the issue persists, contact ${coreStore.supportEmailDisplay}.`,
          status: 'error',
        },
      })
      cy.get('.request-permissions__status-pill').should('contain.text', 'Paused')
      cy.get('@facilities.all').should('have.length', 1)
    })

    it('Reports a turn-off failure without changing the on status', () => {
      cy.intercept('POST', routes.request_management.add(), { statusCode: 500, body: {} }).as(
        'failure',
      )
      visitFacility()
      cy.contains('pep-pharos-button', 'Turn off requests').click()
      cy.get('#turn-off-requests-4-modal').contains('pep-pharos-button', 'Next').click()
      cy.get('#turn-off-requests-4-modal')
        .contains('pep-pharos-button', 'Turn off and delete requests')
        .click()
      cy.wait('@failure')
      cy.get('@toast').should('have.been.calledWithMatch', {
        detail: {
          content: `We were unable to turn requests off. Please try again and if the issue persists, contact ${coreStore.supportEmailDisplay}.`,
          status: 'error',
        },
      })
      cy.get('.request-permissions__status-pill').should('have.text', 'On')
      cy.get('@facilities.all').should('have.length', 1)
    })
  })

  context('Requests page facility alerts', () => {
    const visitRequests = (
      groups = '[1,2,3]',
      facilityFeatures = { edit_facilities: false, manage_facilities: true },
    ) => {
      const path = `/requests?term=&page=1&groups=${groups}`
      handleLocation(path, cy, 'requestsPage', 'pep-admin')
      cy.fixture<User>('auth/users/admin__one_group_manage_facilities__response.json').then(
        (user) => {
          const baseGroup = user.groups[0]!
          user.groups = [1, 2, 3, 4].map((id) => ({
            ...baseGroup,
            id,
            name: `Group ${id}`,
            features: { ...baseGroup.features, ...facilityFeatures, approve_requests: true },
          }))
          const facilityFor = (
            id: number,
            groupIds: number[],
            permissions?: RequestPermissions,
          ): Entity => ({
            id,
            type: 'facilities',
            name: `Facility ${id}`,
            groups: user.groups.filter((group) => groupIds.includes(group.id)),
            request_permissions: permissions,
          })
          user.facilities = [
            facilityFor(4, [1, 2], activePause),
            facilityFor(5, [2], activePause),
            facilityFor(6, [2], requestsOff),
            facilityFor(7, [4], requestsOff),
            facilityFor(8, [3]),
            facilityFor(9, [3], scheduledPause),
            facilityFor(10, [3], {
              start_date: new Date('2026-10-01T00:00:00.000Z'),
              end_date: new Date('2026-10-06T23:59:59.999Z'),
            }),
            facilityFor(11, [], activePause),
          ]
          cy.intercept('GET', routes.auth.get, { body: user }).as('auth')
        },
      )
      cy.intercept('POST', routes.search.status('pending'), {
        fixture: 'search/pending__response.json',
      }).as('pending')
      cy.visit(path)
      cy.wait(['@requestsPage', '@alerts', '@env', '@auth', '@features', '@pending'])
    }

    it('Lists selected facilities in pause and off warnings', () => {
      visitRequests()
      cy.get('.requests-view__alert').should('have.length', 2)
      cy.get('.requests-view__alert')
        .filter(':contains("Requests are paused at")')
        .should('have.length', 1)
        .each((alert) => {
          cy.wrap(alert).should('contain.text', 'Requests are paused at Facility 4 and Facility 5.')
        })
      cy.contains('.requests-view__alert', 'Requests are turned off at Facility 6.').should(
        'contain.text',
        'Users are unable to make new requests.',
      )
      cy.get('.requests-view__alert pep-pharos-link').should('have.length', 2)
    })

    it('Shows request settings to facility editors even without manage permission', () => {
      visitRequests('[1,2,3]', { edit_facilities: true, manage_facilities: false })
      cy.get('.requests-view__alert pep-pharos-link').should('have.length', 2)
    })

    it('Hides request settings when facility edit and manage permissions are disabled', () => {
      visitRequests('[1,2,3]', { edit_facilities: false, manage_facilities: false })
      cy.get('.requests-view__alert').should('have.length', 2)
      cy.get('.requests-view__alert pep-pharos-link').should('not.exist')
    })

    it('Uses URL-selected groups to omit unrelated facility names from warnings', () => {
      visitRequests('[1]')
      cy.get('.requests-view__alert').should('have.length', 1)
      cy.contains('.requests-view__alert', 'Requests are paused at Facility 4.')
      cy.get('.requests-view__alert')
        .should('not.contain.text', 'Facility 5')
        .and('not.contain.text', 'Facility 6')
        .and('not.contain.text', 'Facility 7')
    })

    it('Updates warnings when groups change and clears facility names when selections are cleared', () => {
      visitRequests('[1]')
      cy.get('.requests-view__groups').contains('pep-pharos-button', 'clear').click()
      cy.get('.requests-view__alert').should('not.exist')
      cy.get('.requests-view__groups .group-selector-combobox').click()
      cy.get('.requests-view__groups .group-selector-combobox')
        .shadow()
        .find('[role="option"][aria-label="Group 2"]')
        .click()
      cy.get('.requests-view__alert').should('have.length', 2)
      cy.contains('.requests-view__alert', 'Requests are paused at Facility 4 and Facility 5.')
      cy.contains('.requests-view__alert', 'Requests are turned off at Facility 6.')
      cy.get('.requests-view__groups').contains('pep-pharos-button', 'Group 2').click()
      cy.get('.requests-view__alert').should('not.exist')
    })

    it('Omits on, scheduled, or expired facilities from warnings', () => {
      visitRequests('[3]')
      cy.get('.requests-view__alert').should('not.exist')
    })

    it('Navigates from a facility warning to request settings', () => {
      visitRequests('[1]')
      cy.intercept('POST', routes.entities.get('facilities'), {
        fixture: 'account/get_facilities__response.json',
      }).as('facilities')
      cy.get('.requests-view__alert').contains('pep-pharos-link', 'Requests settings').click()
      cy.location('pathname').should('eq', '/account/facilities')
      cy.wait('@facilities')
      cy.get('.request-permissions').should('be.visible')
    })
  })
})
