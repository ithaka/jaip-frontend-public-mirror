// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

beforeEach(() => {
  // Calls to the log endpoint use the Beacon API, so they can be intercepted and destroyed without
  // affecting user-facing behavior.
  cy.intercept('POST', '/api/v2/log', (req) => req.destroy())
  // Intercepting the subdomains get request to return a fixture response.
  cy.intercept('POST', '/api/v2/site-administration/subdomains/get', {
    statusCode: 200,
    fixture: 'auth/subdomains/get_subdomains__response.json',
  })
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
