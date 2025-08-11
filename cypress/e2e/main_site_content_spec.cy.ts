import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Main site content', () => {

  context('Unauthenticated', () => {
    context('General', () => {
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { statusCode: 401 }) // no user
          .as('auth')
        cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
          .as('env')
        cy.intercept('GET', routes.alerts.get, { statusCode: 204, body: '' }) // no alerts
          .as('alerts')
        cy.intercept('GET', routes.validateSubdomains.get, { fixture: 'auth/subdomains/facilities.json' }) // no alerts
          .as('subdomains')
        handleLocation('/', cy, 'index', 'pep')
      })
      it('includes about text', () => {
        cy.visit('/')
        cy.get('main').contains('About JSTOR')
      })
      it('redirects to index', () => {
        cy.visit('/about')
        cy.location('pathname').should('eq', '/')
      })

      it('includes logos in the footer', () => {
        cy.visit('/')
        cy.get('[data-cy="footer-jstor-labs-logo-linkless"]').should('be.visible')
        cy.get('[data-cy="footer-mellon-logo-linkless"]').should('be.visible')
        cy.get('[data-cy="footer-ascendium-logo-linkless"]').should('be.visible')
      })

      it('includes copyright dates in the footer', () => {
        cy.visit('/')
        cy.get('[data-cy="footer-copyright"]').contains(`©2000-${ new Date().getFullYear().toString() }`).should('be.visible')
      })

      it('includes only one link in nav, for home', () => {
        cy.visit('/')
        cy.get('#nav pep-pharos-dropdown-menu-nav-link').should('be.visible').should('have.length', 1).contains('home')
      })
    })
    context('General with Alert', () =>{
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/student__one_group_no_features__response.json' })
          .as('auth')
        cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
          .as('env')
        cy.intercept('GET', routes.alerts.get, { fixture: 'auth/alerts/response.json' })
          .as('alerts')
        cy.intercept('GET', routes.validateSubdomains.get, { fixture: 'auth/subdomains/facilities.json' }) // no alerts
          .as('subdomains')
      })
      it('includes alert', () => {
        cy.visit('/')
        cy.wait(['@alerts', '@env', '@auth'])
        cy.get('pep-pharos-alert')
          .contains('Oh, no!')
          .should('be.visible')
      })
    })
    context('Admin', ()=>{
      beforeEach(() => {
        cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/student__one_group_no_features__response.json' })
          .as('auth')
        cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
          .as('env')
        cy.intercept('GET', routes.alerts.get, { fixture: 'auth/alerts/response.json' })
          .as('alerts')
        handleLocation('/', cy, 'index', 'pep-admin')
      })

      it('includes log in button', () => {
        cy.visit('/')
        cy.wait(['@index', '@alerts', '@env', '@auth'])
        cy.get('pep-pharos-button').contains('Log in')
      })
    })
  })



  context('AuthenticatedStudent', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/student__one_group_no_features__response.json' })
        .as('auth')
      cy.intercept('GET', routes.alerts.get, { fixture: 'auth/alerts/response.json' })
        .as('alerts')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      handleLocation('/', cy, 'index', 'pep')
    })

    it('includes landing page text', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('main').contains('Explore the world’s knowledge')
    })

    it('shows authenticated users an error page on invalid paths', () =>{
      cy.visit('/not-a-page')
      cy.wait(['@alerts', '@env', '@auth'])
      cy.contains('Page Not Found')
      // We should test that it returns 404, but it doesn't -- it returns 200!
    })


    it('links to home', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('home').should('be.visible')
    })

    it('links to support', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('support').should('be.visible')
    })

    it('links to research', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('research').should('be.visible')
    })

    it('links to search', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('research').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('search').should('be.visible')
    })

    it('links to requests', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('research').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('requests').should('be.visible')
    })

    it('links to about', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('support').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('about').should('be.visible')
    })

    it('links to help', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('support').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('help').should('be.visible')
    })

    it('has exactly seven links', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').should('have.length', 7).should('be.visible')
    })

    it('does not link to Mellon', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('[data-cy="footer-mellon-logo-linkless"]').should('be.visible')
      cy.get('[data-cy="footer-mellon-logo-link"]').should('not.exist')
    })

    it('does not link to Ascendium', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])
      cy.get('[data-cy="footer-ascendium-logo-linkless"]').should('be.visible')
      cy.get('[data-cy="footer-ascendium-logo-link"]').should('not.exist')
    })

    it('does not link to Labs', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth'])

      cy.get('[data-cy="footer-jstor-labs-logo-linkless"]').should('be.visible')
      cy.get('[data-cy="footer-jstor-labs-logo-link"]').should('not.exist')
    })
  })


  context('AuthenticatedAdmin', () => {
    beforeEach(() => {
      // An admin needs at least one admin feature.
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_bulk_approve__response.json' })
        .as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
        .as('features')
      cy.intercept('GET', routes.alerts.get, { fixture: 'auth/alerts/response.json' })
        .as('alerts')
      handleLocation('/', cy, 'index', 'pep-admin')
    })
    it('includes landing page text', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])
      cy.get('main').contains('Explore the world’s knowledge')
    })

    it('links to Mellon', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])
      cy.get('[data-cy="footer-mellon-logo-linked"]').should('be.visible')
      cy.get('[data-cy="footer-mellon-logo-link"]').should('have.length', 1)
    })

    it('links to Ascendium', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])
      cy.get('[data-cy="footer-ascendium-logo-linked"]').should('be.visible')
      cy.get('[data-cy="footer-ascendium-logo-link"]').should('have.length', 1)
    })

    it('links to Labs', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])
      cy.get('[data-cy="footer-jstor-labs-logo-linked"]').should('be.visible')
      cy.get('[data-cy="footer-jstor-labs-logo-link"]').should('have.length', 1)
    })

    it('links to home', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('home').should('be.visible')
    })

    it('links to support', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('support').should('be.visible')
    })

    it('links to research', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('research').should('be.visible')
    })

    it('links to search', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('research').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('search').should('be.visible')
    })

    it('links to requests', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('research').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('requests').should('be.visible')
    })

    it('links to about', () => {
      cy.visit('/')

      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('support').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('about').should('be.visible')
    })

    it('links to help', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('support').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('help').should('be.visible')
    })

    it('has exactly seven links', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').should('have.length', 7).should('be.visible')
    })
  })

  context('AuthenticatedAdminWithAccountManagement', () => {
    beforeEach(() => {
      // An admin needs at least one admin feature.
      cy.intercept('GET', routes.auth.get, { fixture: 'auth/users/admin__one_group_get_users__response.json' })
        .as('auth')
      cy.intercept('GET', routes.environment.get, { environment: 'test' }) // no alerts
        .as('env')
      cy.intercept('POST', routes.features.grouped.get, { fixture: 'auth/features/basic_features.json' })
        .as('features')
      cy.intercept('GET', routes.alerts.get, { fixture: 'auth/alerts/response.json' })
        .as('alerts')
      handleLocation('/', cy, 'index', 'pep-admin')
    })

    it('links to account', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('support').click()
      cy.get('#nav pep-pharos-dropdown-menu-nav-link').contains('account').should('be.visible')
    })

    it('has exactly eight links', () => {
      cy.visit('/')
      cy.wait(['@index', '@alerts', '@env', '@auth', '@features'])

      cy.get('#nav pep-pharos-dropdown-menu-nav-link').should('have.length', 8).should('be.visible')
    })
  })

})
