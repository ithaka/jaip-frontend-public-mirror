import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Reentry View', () => {
  const collection = 'reentry'
  const baseRoute = `/collections/reentry`

  beforeEach(() => {
    cy.intercept('GET', routes.auth.get, {
      fixture: 'auth/users/student__one_group_reentry_content__response.json',
    }).as('auth')
    cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
    cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }).as(
      'alerts',
    )
    cy.intercept('GET', routes.collections.metadata(collection), {
      fixture: 'collections/reentry_metadata.json',
    }).as('collectionsMetadata')
    handleLocation(baseRoute, cy, 'reentry-page', 'pep')
  })

  it('displays reentry landing page with national and state sections', () => {
    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    // Check main page content
    cy.contains('Browse Reentry Guides').should('be.visible')
    cy.contains('Explore select national and state resources').should('be.visible')

    // Check that sections are present with counts
    cy.contains('National (').should('be.visible')
    cy.contains('State (').should('be.visible')

    // Check that state notification alert is shown
    cy.get('[data-cy="reentry-notification"]').should('be.visible')
    cy.contains('State guides can still be helpful').should('be.visible')
  })

  it('displays reentry cards in correct sections', () => {
    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    // Wait for loading to complete
    cy.contains('National (').should('be.visible')
    cy.contains('State (').should('be.visible')

    // Check national section has cards
    cy.get('[data-cy="reentry-national-section"]').within(() => {
      cy.get('[data-cy="reentry-card"]').should('have.length.greaterThan', 0)
      // Verify first card shows "National" location
      cy.get('[data-cy="reentry-card"]')
        .first()
        .within(() => {
          cy.get('[data-cy="reentry-card-location"]').should('contain.text', 'National')
        })
    })

    // Check state section has cards
    cy.get('[data-cy="reentry-state-section"]').within(() => {
      cy.get('[data-cy="reentry-card"]').should('have.length.greaterThan', 0)
      // Verify first card doesn't show "National" (should show state/location)
      cy.get('[data-cy="reentry-card"]')
        .first()
        .within(() => {
          cy.get('[data-cy="reentry-card-location"]').should('not.contain.text', 'National')
        })
    })
  })

  it('displays cards with correct metadata', () => {
    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    // Check that cards display titles, descriptions, dates
    cy.get('[data-cy="reentry-card"]')
      .first()
      .within(() => {
        cy.get('[data-cy="reentry-card-title"]').should('be.visible')
        cy.get('[data-cy="reentry-card-description"]').should('not.be.empty') // description should have text
        cy.get('[data-cy="reentry-card-date"]').should('be.visible')
        cy.get('[data-cy="reentry-card-language-pill"]').should('be.visible') // language pill
      })
  })

  it('has working links to individual collection items', () => {
    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    // Check that cards have correct href attributes
    cy.get('[data-cy="reentry-card"]')
      .first()
      .within(() => {
        cy.get('[data-cy="reentry-card-title-link"]')
          .should('have.attr', 'href')
          .and('include', '/collections/reentry/')
      })
  })

  it('displays different language pills correctly', () => {
    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    // Check for English pills (preset 7)
    cy.get('[data-cy="reentry-card-language-pill"]')
      .contains('English')
      .first()
      .should('have.attr', 'preset', '7')

    // Check for Spanish pills (preset 9) if they exist
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="reentry-card-language-pill"]:contains("Español")').length > 0) {
        cy.get('[data-cy="reentry-card-language-pill"]')
          .contains('Español')
          .first()
          .should('have.attr', 'preset', '9')
      }
    })
  })

  it('handles API errors gracefully', () => {
    // Override the metadata intercept to return error
    cy.intercept('GET', routes.collections.metadata(collection), {
      statusCode: 500,
      body: { error: 'Server Error' },
    }).as('collectionsMetadataError')

    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth'], {
      requestTimeout: 20000,
    })
    // The metadata request will fail, so we don't wait for it to succeed

    // Page should still render with error handling
    cy.contains('Browse Reentry Guides').should('be.visible')

    // Should show zero counts when API fails
    cy.contains('National (0)').should('be.visible')
    cy.contains('State (0)').should('be.visible')
  })

  it('handles image loading with fallbacks', () => {
    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    // Check that images have proper alt text and src attributes
    cy.get('[data-cy="reentry-card-image"]').should('have.attr', 'alt')
    cy.get('[data-cy="reentry-card-image"]').should('have.attr', 'src')

    // Verify fallback image logic by checking src contains either thumbnail path or fallback
    cy.get('[data-cy="reentry-card-image"]').each(($img) => {
      cy.wrap($img)
        .should('have.attr', 'src')
        .and('satisfy', (src: string) => {
          return (
            src.includes('thumbnails/') ||
            src.includes('fallbackimage.png') ||
            src.includes('/_build/')
          )
        })
    })
  })

  it('has proper accessibility features', () => {
    cy.visit(baseRoute)

    cy.wait(['@reentry-page', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    // Check proper heading hierarchy
    cy.get('pep-pharos-heading[level="2"]').should('exist')
    cy.get('pep-pharos-heading[level="3"]').should('exist')

    // Check link accessibility labels
    cy.get('[data-cy="reentry-card-title-link"][a11y-label*="link to reentry item"]').should(
      'exist',
    )

    // Check image alt attributes
    cy.get('[data-cy="reentry-card-image"][alt]').should('exist')
  })

  it('denies access to users without include_reentry_content permission', () => {
    // Override the auth intercept to use a user without reentry content access
    cy.intercept('GET', routes.auth.get, {
      fixture: 'auth/users/student__one_group_no_features__response.json',
    }).as('authNoAccess')

    cy.visit(baseRoute, { failOnStatusCode: false })

    cy.wait(['@reentry-page', '@alerts', '@env', '@authNoAccess'], {
      requestTimeout: 20000,
    })

    // Check that the reentry content is not accessible
    // Either the URL should redirect away or the content should not be visible
    cy.get('body').then(($body) => {
      if ($body.text().includes('Browse Reentry Guides')) {
        // If the page loads, it should show access denied
        cy.contains('Access denied').should('be.visible')
      } else {
        // Content should not be accessible
        cy.contains('Browse Reentry Guides').should('not.exist')
      }
    })
  })
})
