import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Collections Item View', () => {
  const collection = 'reentry'
  const filename = 'NYPL_JPS_Connections_2025.pdf'
  const spanishFilename = 'NYPL_JPS_Conexiones_2025.pdf'
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
      'Annual reentry resource guide',
    )
    cy.get('[data-cy="custom-content-creation"]')
      .should('contain', 'Created by New York Public Library, Jail & Prison Services')
      .and('contain', 'Published by The New York Public Library')
    cy.get('[data-cy="custom-content-alternate-link"]')
      .first()
      .should('have.attr', 'href', `/collections/${collection}/${spanishFilename}`)
      .and('contain', 'Ver en Español')
    cy.get('[data-cy="custom-content-back-link"]')
      .should('contain', 'Browse all guides')
      .and('have.attr', 'href', `/collections/${collection}`)
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

    cy.get('[data-cy="custom-content-error"]').should('contain', 'Not Found').and('be.visible')
    cy.get('.pdf-viewer').should('not.exist')
  })
})
