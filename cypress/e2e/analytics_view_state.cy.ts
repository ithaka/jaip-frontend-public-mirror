import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

const authWithAnalyticsAccess = {
  name: 'Test Admin',
  id: 4,
  type: 'users',
  groups: [
    {
      id: 1,
      name: 'Test Group',
      role: 'admin',
      features: {
        view_analytics: true,
        get_users: true,
      },
    },
  ],
}

describe('Analytics view states', () => {
  const bootstrapRoute = '/?term=&page=1'
  const analyticsRoute = '/analytics?term=&page=1'
  const bootstrapWaitAliases = ['@bootstrapPage', '@auth', '@env', '@alerts', '@features']
  const analyticsWaitAliases = [
    '@analyticsPage',
    '@auth',
    '@env',
    '@alerts',
    '@features',
    '@analytics',
  ]

  const interceptAnalytics = (response: { statusCode: number; body: unknown }) => {
    cy.intercept(
      {
        pathname: /\/api\/v2\/analytics(?:\/.*)?$/,
      },
      response,
    ).as('analytics')
  }

  const visitAnalyticsPage = () => {
    handleLocation(analyticsRoute, cy, 'analyticsPage', 'pep-admin')
    cy.visit(analyticsRoute)
    cy.wait(analyticsWaitAliases)
  }

  const assertNoDataYetVisible = () => {
    cy.get('img[alt="No data yet"]').should('be.visible')
    cy.contains('Reload').should('not.exist')
  }

  beforeEach(() => {
    cy.intercept('GET', routes.auth.get, {
      statusCode: 200,
      body: authWithAnalyticsAccess,
    }).as('auth')

    cy.intercept('GET', routes.environment.get, {
      statusCode: 200,
      body: { environment: 'test' },
    }).as('env')

    cy.intercept('GET', routes.alerts.get, {
      statusCode: 200,
      body: { alerts: [], count: 0 },
    }).as('alerts')

    cy.intercept('POST', routes.features.grouped.get, {
      fixture: 'auth/features/basic_features.json',
    }).as('features')

    handleLocation(bootstrapRoute, cy, 'bootstrapPage', 'pep-admin')
    cy.visit(bootstrapRoute)
    cy.wait(bootstrapWaitAliases)
  })

  it('shows analytics content when endpoint returns valid data', () => {
    interceptAnalytics({
      statusCode: 200,
      body: {
        group_id: '1',
        group_name: 'Test Group',
        last_exported: '2026-02-18T12:00:00.000Z',
        student_item_views: [
          {
            time_period: 'days_30',
            total: 5,
            series: [{ bucket: '2026-02-01', n: 5 }],
          },
        ],
        student_searches: [
          {
            time_period: 'days_30',
            total: 3,
            series: [{ bucket: '2026-02-01', n: 3 }],
          },
        ],
        time_of_day_item_views: [
          {
            time_period: 'days_30',
            total: 1,
            series: [{ day: 'Monday', time: 'morning', value: 1 }],
          },
        ],
        discipline_views: [
          {
            time_period: 'days_30',
            total: 2,
            series: [{ bucket: 'History', n: 2 }],
          },
        ],
        media_reviews: [
          {
            time_period: 'days_30',
            total: 4,
            series: [{ bucket: 'approved', n: 4 }],
          },
        ],
      },
    })

    visitAnalyticsPage()

    cy.contains('Item usage').should('be.visible')
    cy.contains('Media review').should('be.visible')
    cy.get('img[alt="Dashboard Unavailable"]').should('not.exist')
    cy.get('img[alt="No data yet"]').should('not.exist')
    cy.contains('Reload').should('not.exist')
  })

  it('shows DashboardUnavailable when analytics endpoint returns 500', () => {
    interceptAnalytics({
      statusCode: 500,
      body: {},
    })

    visitAnalyticsPage()

    cy.contains('Reload').should('be.visible')
    cy.get('img[alt="Dashboard Unavailable"]').should('be.visible')
    cy.get('img[alt="No data yet"]').should('not.exist')
  })

  it('shows NoDataYet when analytics endpoint returns an empty object', () => {
    interceptAnalytics({
      statusCode: 200,
      body: {},
    })

    visitAnalyticsPage()
    assertNoDataYetVisible()
  })

  it('shows NoDataYet when analytics endpoint returns metrics with null-only series', () => {
    interceptAnalytics({
      statusCode: 200,
      body: {
        group_id: '1',
        group_name: 'Test Group',
        last_exported: null,
        student_item_views: [{ time_period: 'days_30', total: 0, series: [null] }],
        student_searches: [{ time_period: 'days_30', total: 0, series: [null] }],
        time_of_day_item_views: [{ time_period: 'days_30', total: 0, series: [null] }],
        discipline_views: [{ time_period: 'days_30', total: 0, series: [null] }],
        media_reviews: [{ time_period: 'days_30', total: 0, series: [null] }],
      },
    })

    visitAnalyticsPage()
    assertNoDataYetVisible()
  })
})
