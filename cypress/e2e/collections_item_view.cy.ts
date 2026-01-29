import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Collections Item View', () => {
  const collection = 'reentry'
  const filename = 'connections-2025-ny-en.pdf'
  const spanishFilename = 'conexiones-2025-ny-es.pdf'
  const baseRoute = `/collections/${collection}/${filename}`

  const interceptCommonRequests = () => {
    cy.intercept('GET', routes.auth.get, {
      fixture: 'auth/users/student__one_group_reentry_content__response.json',
    }).as('auth')
    cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
    cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }).as(
      'alerts',
    )
  }

  const interceptMetadata = () => {
    cy.intercept('GET', routes.collections.metadata(collection), {
      fixture: 'collections/reentry_metadata.json',
    }).as('collectionsMetadata')
  }

  const interceptPdf = (pdfFilename: string) => {
    cy.intercept('GET', routes.collections.pdf(collection, pdfFilename), (req) => {
      req.reply({
        fixture: 'pdf/open-access-sample.pdf',
        headers: {
          'content-type': 'application/pdf',
          'transfer-encoding': 'chunked',
          'content-disposition': `inline; filename="${pdfFilename}"`,
        },
      })
    }).as('pdfDocument')
  }

  const interceptPdfNotFound = (pdfFilename: string) => {
    cy.intercept('GET', routes.collections.pdf(collection, pdfFilename), {
      statusCode: 404,
      body: 'Not Found',
    }).as('pdfDocument')
  }

  const interceptPdfInvalid = (pdfFilename: string) => {
    cy.intercept('GET', routes.collections.pdf(collection, pdfFilename), {
      statusCode: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${pdfFilename}"`,
      },
      body: 'not a pdf',
    }).as('pdfDocument')
  }

  it('displays metadata, alternate versions, and viewer actions', () => {
    interceptCommonRequests()
    interceptMetadata()
    interceptPdf(filename)
    handleLocation(baseRoute, cy, 'custom-content', 'pep')

    cy.visit(baseRoute)

    cy.wait(['@custom-content', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })
    cy.wait('@pdfDocument', { requestTimeout: 20000 })

    cy.get('[data-cy="custom-content-jurisdiction"]')
      .should('contain', 'New York City')
      .and('contain', '2025')
    cy.get('[data-cy="custom-content-title"]').should(
      'contain',
      'Connections 2025: A Free Guide for Formerly Incarcerated People in New York City',
    )
    cy.get('[data-cy="custom-content-description"]').should(
      'contain',
      'Annual reentry resource guide for people returning to New York City',
    )
    cy.get('[data-cy="custom-content-creation"]')
      .should('contain', 'Created by New York Public Library, Jail & Prison Services')
      .and('contain', 'Published by The New York Public Library')
    cy.get('[data-cy="custom-content-alternate-link"]')
      .first()
      .should('have.attr', 'href', `/collections/${collection}/${spanishFilename}`)
      .and('contain', 'Ver en Español')
    cy.get('[data-cy="custom-content-back-link"]').should('contain', 'Browse all guides')
    cy.get('[data-cy="print-pdf-button"]').should('be.visible')
    cy.get('[data-cy="download-pdf-button"]').should('be.visible')
    cy.get('#viewer').should('exist')
  })

  it('shows a not found message when the document metadata is missing', () => {
    const missingFilename = 'missing-guide.pdf'
    const missingRoute = `/collections/${collection}/${missingFilename}`

    interceptCommonRequests()
    interceptMetadata()
    handleLocation(missingRoute, cy, 'custom-content-missing', 'pep')

    cy.visit(missingRoute)

    cy.wait(['@custom-content-missing', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })

    cy.get('[data-cy="item-not-found"]').should('be.visible').and('contain', 'Item not found')
    cy.contains(
      'p',
      'This guide may not exist or is no longer available on JSTOR. Try searching for another guide.',
    ).should('be.visible')
    cy.get('[data-cy="browse-guides-button"]').should('be.visible')
    cy.get('#viewer').should('not.exist')
  })

  it('shows a guide not found error when the PDF is missing', () => {
    interceptCommonRequests()
    interceptMetadata()
    interceptPdfNotFound(filename)
    handleLocation(baseRoute, cy, 'custom-content', 'pep')

    cy.visit(baseRoute)

    cy.wait(['@custom-content', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })
    cy.wait('@pdfDocument', { requestTimeout: 20000 })

    cy.get('[data-cy="item-not-found"]').should('be.visible').and('contain', 'Item not found')
    cy.contains(
      'p',
      'This guide may not exist or is no longer available on JSTOR. Try searching for another guide.',
    ).should('be.visible')
    cy.get('[data-cy="browse-guides-button"]').should('be.visible')
    cy.get('#viewer').should('not.exist')
  })

  it('shows a guide not available error when the PDF is invalid', () => {
    interceptCommonRequests()
    interceptMetadata()
    interceptPdfInvalid(filename)
    handleLocation(baseRoute, cy, 'custom-content', 'pep')

    cy.visit(baseRoute)

    cy.wait(['@custom-content', '@alerts', '@env', '@auth', '@collectionsMetadata'], {
      requestTimeout: 20000,
    })
    cy.wait('@pdfDocument', { requestTimeout: 20000 })

    cy.get('[data-cy="item-not-available"]')
      .should('be.visible')
      .and('contain', 'Item not available')
    cy.contains(
      'p',
      'Something went wrong while loading this guide. Try viewing other guides.',
    ).should('be.visible')
    cy.get('[data-cy="browse-guides-button"]').should('be.visible')
    cy.get('[data-cy="item-not-available"]')
      .should('be.visible')
      .and('contain', 'Item not available')
    cy.contains(
      'p',
      'Something went wrong while loading this guide. Try viewing other guides.',
    ).should('be.visible')
    cy.get('[data-cy="browse-guides-button"]').should('be.visible')
    cy.get('#viewer').should('not.exist')
  })
})
