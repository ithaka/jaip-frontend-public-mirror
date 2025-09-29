import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

interface NotificationStubOptions {
  alertsFixture?: string
  paginatedActiveFixture?: string
  paginatedInactiveFixture?: string
}

const stubNotificationsRequests = (
  authFixture: string,
  options: NotificationStubOptions = {},
) => {
  const {
    alertsFixture = 'notifications/alerts_two__response.json',
    paginatedActiveFixture = 'notifications/paginated_active__response.json',
    paginatedInactiveFixture = 'notifications/paginated_inactive__response.json',
  } = options

  handleLocation('/notifications', cy, 'notificationsPage', 'pep-admin')

  cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
  cy.intercept('GET', routes.alerts.get, { fixture: alertsFixture }).as('alerts')
  cy.intercept('POST', routes.alerts.getPaginated, (req) => {
    const body = req.body || {}
    if (body.is_active === false) {
      req.reply({ fixture: paginatedInactiveFixture })
    } else {
      req.reply({ fixture: paginatedActiveFixture })
    }
  }).as('getPaginated')

  cy.intercept('POST', routes.subdomains.get, {
    fixture: 'auth/subdomains/get_subdomains__response.json',
  }).as('getSubdomains')

  cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
    .as('features')

  cy.intercept('GET', routes.auth.get, { fixture: authFixture }).as('auth')
  cy.intercept('POST', routes.alerts.add, { statusCode: 201, body: {} }).as('createNotification')
  cy.intercept('PATCH', routes.alerts.edit, { statusCode: 200, body: {} }).as('editNotification')
  cy.intercept('DELETE', routes.alerts.delete, { statusCode: 204, body: {} }).as('deleteNotification')
}

describe('Notifications Admin Page', () => {
  context('when the user lacks notification permissions', () => {
    beforeEach(() => {
      stubNotificationsRequests('auth/users/admin__one_group_bulk_approve__response.json')
      cy.visit('/notifications')
      cy.wait(['@notificationsPage', '@alerts', '@env', '@auth', '@features'])
    })

    it('denies access to the notifications route', () => {
      cy.contains('Page Not Found', { matchCase: false }).should('be.visible')
      cy.get('[data-cy="notifications-new-button"]').should('not.exist')
      cy.get('[data-cy="notifications-table"]').should('not.exist')
    })
  })

  context('when the user can edit facilities', () => {
    beforeEach(() => {
      stubNotificationsRequests('auth/users/admin__notifications_edit_facilities__response.json')
      cy.visit('/notifications')
      cy.wait(['@notificationsPage', '@alerts', '@env', '@auth', '@features'])
      cy.wait('@getPaginated').as('initialPaginated')
    })

    it('displays notifications without facility recipient controls', () => {
      cy.contains('Create and schedule custom notifications for users at specific facilities.').should(
        'be.visible',
      )
      cy.get('[data-cy="notifications-table"]').should('be.visible')
      cy.get('[data-cy="notifications-table"]').find('tbody tr').should('have.length', 2)
      cy.contains('Recipients').should('not.exist')
    })

    it('limits creation options when manage permissions are missing', () => {
      cy.get('[data-cy="notifications-new-button"]').click()
      cy.get('[data-cy="notifications-modal"]').should('be.visible')

      cy.get('[data-cy="notifications-facility-selector"]').should('not.exist')
      cy.get('[data-cy="notifications-group-selector"]').should('not.exist')
      cy.get('[data-cy="notifications-subdomain-selector"]').should('not.exist')

      cy.get('[data-cy="notifications-status-group"]').within(() => {
        cy.get('pep-pharos-radio-button').should('have.length', 2)
      })
      cy.get('[data-cy="notifications-status-option-error"]').should('not.exist')
      cy.get('[data-cy="notifications-status-option-success"]').should('not.exist')

      cy.get('[data-cy="notifications-modal"]').find('pep-pharos-button').contains('Cancel').click()
      cy.get('body').find('[data-cy="notifications-modal"]').should('not.be.visible')
    })

    it('requests notifications scoped to the user groups', () => {
      cy.get('@initialPaginated').its('request.body').should('deep.include', {
        groups: [1],
        limit: 5,
        page: 1,
        is_active: true,
      })
    })
  })

  context('when the user can manage facilities', () => {
    beforeEach(() => {
      stubNotificationsRequests('auth/users/admin__notifications_manage_facilities__response.json')
      cy.visit('/notifications')
      cy.wait(['@notificationsPage', '@alerts', '@env', '@auth', '@features'])
      cy.wait('@getPaginated').as('initialPaginated')
      cy.wait('@getSubdomains')
    })

    it('shows extended messaging and recipient details', () => {
      cy.contains(
        'Create and schedule custom notifications for users at specific facilities, groups, or subdomains.',
      ).should('be.visible')

      cy.get('[data-cy="notifications-table"]').should('be.visible')
      cy.get('[data-cy="notifications-table"]').find('tbody tr').should('have.length', 2)
      cy.contains('Recipients').should('be.visible')
    })

    it('scopes notification requests to all manageable groups', () => {
      cy.get('@initialPaginated').its('request.body').should('deep.include', {
        groups: [1, 2],
        limit: 5,
        page: 1,
        is_active: true,
      })
    })

    it('exposes advanced creation controls for managers', () => {
      cy.get('[data-cy="notifications-new-button"]').click()
      cy.get('[data-cy="notifications-modal"]').should('be.visible')

      cy.get('[data-cy="notifications-facility-selector"]').should('exist')
      cy.get('[data-cy="notifications-group-selector"]').should('exist')
      cy.get('[data-cy="notifications-subdomain-selector"]').should('exist')

      cy.get('[data-cy="notifications-status-option-error"]').should('exist')
      cy.get('[data-cy="notifications-status-option-success"]').should('exist')

      cy.get('[data-cy="notifications-modal"]').find('pep-pharos-button').contains('Cancel').click()
      cy.get('body').find('[data-cy="notifications-modal"]').should('not.be.visible')
    })

    it('shows expired notifications when active filtering is disabled', () => {
      cy.get('[data-cy="notifications-active-filter"]').click()

      cy.wait('@getPaginated').its('request.body').should('deep.include', {
        is_active: false,
        page: 1,
        limit: 5,
      })

      cy.get('[data-cy="notifications-table"]').find('tbody tr').should('have.length', 1)
      cy.get('[data-cy="notifications-table"]').contains('Expired').should('be.visible')
    })
  })
})

describe('Notifications Banner', () => {
  it('renders dismissible alerts when fewer than three notifications', () => {
    stubNotificationsRequests('auth/users/admin__notifications_edit_facilities__response.json', {
      alertsFixture: 'notifications/alerts_two__response.json',
    })
    cy.visit('/notifications')
    cy.wait(['@notificationsPage', '@alerts', '@env', '@auth', '@features'])
    cy.wait('@getPaginated')

    cy.get('[data-cy="notifications-container"]').should('be.visible')
    cy.get('[data-cy="notification"]').should('have.length', 2)
    cy.get('[data-cy="notification"]').each(($alert) => {
      cy.wrap($alert).should('have.attr', 'closable')
    })
  })

  it('renders a hideable stack of alerts when three or more notifications exist', () => {
    stubNotificationsRequests('auth/users/admin__notifications_manage_facilities__response.json', {
      alertsFixture: 'notifications/alerts_three__response.json',
    })
    cy.visit('/notifications')
    cy.wait(['@notificationsPage', '@alerts', '@env', '@auth', '@features'])
    cy.wait('@getPaginated')

    cy.get('[data-cy="notifications-hide-toggle"]').should('contain', 'Hide all notifications')
    cy.get('[data-cy="notification"]').should('have.length', 3)
    cy.get('[data-cy="notification"]').each(($alert) => {
      cy.wrap($alert).should('not.have.attr', 'closable')
    })

    cy.get('[data-cy="notifications-hide-toggle"]').click()
    cy.get('[data-cy="notifications-hide-toggle"]').should('contain', 'Show all notifications')
    cy.get('[data-cy="notification"]').should('not.exist')

    cy.get('[data-cy="notifications-hide-toggle"]').click()
    cy.get('[data-cy="notifications-hide-toggle"]').should('contain', 'Hide all notifications')
    cy.get('[data-cy="notification"]').should('have.length', 3)
  })
})
