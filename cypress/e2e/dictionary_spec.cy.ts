import { handleLocation } from './helpers'
import { routes } from '../../src/config/api'

describe('Dictionary', () => {
  beforeEach(() => {
    cy.intercept('GET', routes.environment.get, { environment: 'test' }).as('env')
    cy.intercept('GET', routes.alerts.get, { statusCode: 200, body: { alerts: [], count: 0 } }).as(
      'alerts',
    )
  })

  context('Without use_dictionary permission', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/student__one_group_no_features__response.json',
      }).as('auth')
    })

    context('Visiting the dictionary landing page', () => {
      beforeEach(() => {
        handleLocation('/dictionary', cy, 'page', 'pep')
        cy.visit('/dictionary')
        cy.wait(['@page', '@env', '@auth', '@alerts'])
      })

      it('redirects to the not found page', () => {
        cy.get('#main-content').contains('Page Not Found')
      })
    })

    context('Visiting a dictionary term page', () => {
      beforeEach(() => {
        handleLocation('/dictionary/down', cy, 'page', 'pep')
        cy.visit('/dictionary/down')
        cy.wait(['@page', '@env', '@auth', '@alerts'])
      })

      it('redirects to the not found page', () => {
        cy.get('#main-content').contains('Page Not Found')
      })
    })
  })

  context('With use_dictionary permission', () => {
    beforeEach(() => {
      cy.intercept('GET', routes.auth.get, {
        fixture: 'auth/users/student__one_group_use_dictionary__response.json',
      }).as('auth')
    })

    context('Dictionary landing page', () => {
      beforeEach(() => {
        handleLocation('/dictionary', cy, 'page', 'pep')
        cy.visit('/dictionary')
        cy.wait(['@page', '@env', '@auth', '@alerts'])
      })

      it('displays the dictionary search title', () => {
        cy.get('[data-cy="dictionary-view-title"]').should('contain.text', 'Search the dictionary')
      })

      it('displays quick search examples', () => {
        cy.get('.dictionary-view__suggested').should('be.visible')
      })
    })

    context('Typeahead search', () => {
      // Visit the landing page so the combobox initialises with an empty value,
      // preventing any headword search request on mount.
      beforeEach(() => {
        handleLocation('/dictionary', cy, 'page', 'pep')
        cy.visit('/dictionary')
        cy.wait(['@page', '@env', '@auth', '@alerts'])
      })

      it('does not call the headword search API for fewer than 3 characters', () => {
        let searched = false
        cy.intercept('GET', routes.dictionary.headwordSearch('*'), (req) => {
          searched = true
          req.reply({ body: [] })
        })
        cy.get('pep-pharos-combobox').shadow().find('input').type('do')
        cy.then(() => expect(searched).to.be.false)
      })

      it('calls the headword search API once at least 3 characters are typed', () => {
        cy.intercept('GET', routes.dictionary.headwordSearch('*'), {
          fixture: 'dictionary/headwords_response.json',
        }).as('headwordSearch')
        cy.get('pep-pharos-combobox').shadow().find('input').type('dow')
        cy.wait('@headwordSearch')
      })

      it('populates suggestions from the headword search response', () => {
        cy.intercept('GET', routes.dictionary.headwordSearch('*'), {
          fixture: 'dictionary/headwords_response.json',
        }).as('headwordSearch')
        cy.get('pep-pharos-combobox').shadow().find('input').type('dow')
        cy.wait('@headwordSearch')
        // Option list includes the typed term plus all returned headwords
        cy.get('pep-pharos-combobox option').should('have.length.greaterThan', 1)
      })

      it('shows only the typed term as an option when the headword response is empty', () => {
        cy.intercept('GET', routes.dictionary.headwordSearch('*'), {
          fixture: 'dictionary/headwords_empty_response.json',
        }).as('headwordSearch')
        cy.get('pep-pharos-combobox').shadow().find('input').type('zzz')
        cy.wait('@headwordSearch')
        cy.get('pep-pharos-combobox option').should('have.length', 1)
      })
    })

    context('Term view', () => {
      beforeEach(() => {
        // Intercept the headword search that fires when DictionarySearchCombobox
        // mounts with the current term as its initial value.
        cy.intercept('GET', routes.dictionary.headwordSearch('*'), { body: [] })
      })

      context('With a successful word response', () => {
        beforeEach(() => {
          cy.intercept('GET', routes.dictionary.wordSearch('down'), {
            fixture: 'dictionary/word_response.json',
          }).as('wordSearch')
          handleLocation('/dictionary/down', cy, 'page', 'pep')
          cy.visit('/dictionary/down')
          cy.wait(['@page', '@env', '@auth', '@alerts', '@wordSearch'])
        })

        it('displays the term', () => {
          cy.get('[data-cy="term-view"] .term-view__entry pep-pharos-heading')
            .contains(/^down$/i)
            .should('be.visible')
        })

        it('displays definitions', () => {
          cy.get('[data-cy="term-view"]').contains('Definitions').should('be.visible')
        })

        it('displays etymologies', () => {
          cy.get('[data-cy="term-view"]').contains('Etymologies').should('be.visible')
        })

        it('shows a back link to the dictionary home', () => {
          cy.get('[data-cy="term-view"]')
            .contains('Back to dictionary home')
            .should('be.visible')
            .and('have.attr', 'href')
            .and('include', '/dictionary')
        })

        context('Footnotes', () => {
          // The fixture has noun, adverb, adjective, preposition, intransitive verb,
          // and idiom definition groups, plus etymologies — 7 footnotes in total.
          it('renders the correct number of footnotes', () => {
            cy.get('[data-cy="term-view"]')
              .find('ol.term-view__footnotes li')
              .should('have.length', 7)
          })

          it('renders the correct footnote text for each entry', () => {
            const expectedFootnotes = [
              'a person, place, or thing',
              'modifies a verb or adjective',
              'describes a noun',
              'part of speech',
              "a verb that doesn't take an object",
              'a phrase that has figurative meaning',
              'word origins',
            ]
            expectedFootnotes.forEach((text, index) => {
              cy.get('[data-cy="term-view"]')
                .find('ol.term-view__footnotes li')
                .eq(index)
                .should('contain.text', text)
            })
          })

          it('each footnote item has the correct id', () => {
            for (let i = 1; i <= 7; i++) {
              cy.get('[data-cy="term-view"]')
                .find('ol.term-view__footnotes li')
                .eq(i - 1)
                .should('have.attr', 'id', `footnote_${i}`)
            }
          })

          it('each footnote link points back to the corresponding definition group heading', () => {
            for (let i = 1; i <= 7; i++) {
              cy.get('[data-cy="term-view"]')
                .find('ol.term-view__footnotes pep-pharos-link')
                .eq(i - 1)
                .should('have.attr', 'href', `#footnote_link_${i}`)
            }
          })

          it('each definition group heading has a superscript link pointing to its footnote', () => {
            // 6 definition groups: noun(1), adverb(2), adjective(3), preposition(4),
            // intransitive verb(5), idiom(6)
            for (let i = 1; i <= 6; i++) {
              cy.get('[data-cy="term-view"] .term-view__group-title pep-pharos-link')
                .eq(i - 1)
                .should('have.attr', 'id', `footnote_link_${i}`)
                .and('have.attr', 'href', `#footnote_${i}`)
            }
          })

          it('the Etymologies heading superscript references the last footnote', () => {
            cy.get('[data-cy="term-view"] #etymologies-title sup').should('contain.text', '7')
          })
        })
      })

      context('With an empty definitions response', () => {
        beforeEach(() => {
          cy.intercept('GET', routes.dictionary.wordSearch('unknownterm'), {
            fixture: 'dictionary/word_empty_definitions_response.json',
          }).as('wordSearch')
          handleLocation('/dictionary/unknownterm', cy, 'page', 'pep')
          cy.visit('/dictionary/unknownterm')
          cy.wait(['@page', '@env', '@auth', '@alerts', '@wordSearch'])
        })

        it('displays a no-results empty state', () => {
          cy.get('[data-cy="term-view"]').contains('No results found').should('be.visible')
        })
      })

      context('With a fully empty API response', () => {
        beforeEach(() => {
          cy.intercept('GET', routes.dictionary.wordSearch('emptyterm'), {
            fixture: 'dictionary/word_empty_response.json',
          }).as('wordSearch')
          handleLocation('/dictionary/emptyterm', cy, 'page', 'pep')
          cy.visit('/dictionary/emptyterm')
          cy.wait(['@page', '@env', '@auth', '@alerts', '@wordSearch'])
        })

        it('displays a no-results empty state', () => {
          cy.get('[data-cy="term-view"]').contains('No results found').should('be.visible')
        })
      })

      context('With an error response', () => {
        beforeEach(() => {
          cy.intercept('GET', routes.dictionary.wordSearch('errorterm'), {
            fixture: 'dictionary/word_error_response.json',
          }).as('wordSearch')
          handleLocation('/dictionary/errorterm', cy, 'page', 'pep')
          cy.visit('/dictionary/errorterm')
          cy.wait(['@page', '@env', '@auth', '@alerts', '@wordSearch'])
        })

        it('displays an error state', () => {
          cy.get('[data-cy="term-view"]')
            .contains("We couldn't find that page")
            .should('be.visible')
        })
      })
    })
  })
})
