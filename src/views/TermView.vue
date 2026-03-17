<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DictionarySearchCombobox from '@/components/dictionary/DictionarySearchCombobox.vue'
import { addDefinitionGroupFootnotes } from '@/utils/dictionary'

const route = useRoute()

const term = computed(() => {
  const rawTerm = String(route.params.term ?? '')
  try {
    return decodeURIComponent(rawTerm)
  } catch {
    return rawTerm
  }
})

const rawDefinitionGroups = [
  {
    label: 'transitive verb',
    entries: [
      'To turn or direct inward.',
      "To concentrate (one's interests) upon oneself.",
      'To turn (a tubular organ or part) inward upon itself.',
    ],
  },
  {
    label: 'noun',
    entries: [
      'An introverted person.',
      'An anatomical structure that is capable of being introverted.',
    ],
  },
]

const footnotedDefinitions = addDefinitionGroupFootnotes(rawDefinitionGroups)
const definitionGroups = footnotedDefinitions.definitionGroups
const footnotes = footnotedDefinitions.footnotes
const etymologiesNote = footnotedDefinitions.etymologiesNote
</script>

<template>
  <main class="term-view" data-cy="term-view">
    <section class="term-view__search-shell">
      <div class="term-view__search">
        <DictionarySearchCombobox :initial-value="term" />
      </div>
    </section>

    <section class="term-view__section">
      <div class="term-view__content">
        <RouterLink class="term-view__back-link" to="/dictionary"
          >&larr; Back to Dictionary</RouterLink
        >

        <div class="term-view__entry">
          <pep-pharos-heading preset="5" :level="1">{{ term }}</pep-pharos-heading>
          <p class="term-view__pronunciation">
            <span class="term-view__pronunciation-label">Pronunciation:</span>
            <span>in'tra-vurt", in/'tra-vurt</span>
          </p>
        </div>
        <section class="term-view__definition-block" aria-labelledby="definitions-title">
          <pep-pharos-heading id="definitions-title" preset="2" :level="2"
            >Definitions</pep-pharos-heading
          >
          <p class="term-view__source">
            from The American Heritage&reg; Dictionary of the English Language, 5th Edition
          </p>
          <hr />
          <div v-for="group in definitionGroups" :key="group.label" class="term-view__group">
            <div class="term-view__group-title">
              {{ group.label }}<sup>{{ group.note }}</sup>
            </div>
            <ol class="term-view__group-list">
              <li v-for="entry in group.entries" :key="entry">
                {{ entry }}
              </li>
            </ol>
          </div>
        </section>

        <section class="term-view__definition-block" aria-labelledby="etymologies-title">
          <pep-pharos-heading id="etymologies-title" preset="2" :level="2"
            >Etymologies<sup>{{ etymologiesNote }}</sup></pep-pharos-heading
          >
          <p class="term-view__source">from Wiktionary</p>
          <hr />
          <p class="term-view__group-list--no-list">
            [intro- + Latin vertere, to turn; see wer- in Indo-European roots.]
          </p>
        </section>

        <ol class="term-view__footnotes">
          <li v-for="note in footnotes" :key="note">{{ note }}</li>
        </ol>

        <img class="term-view__logo" src="/images/wordnik-logo.svg" alt="Powered by Wordnik" />
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.term-view {
  margin-top: 0;

  sup {
    font-size: 0.7em;
    line-height: 0;
    position: relative;
    top: -0.35em;
  }

  &__search-shell {
    background: var(--pharos-alert-color-background-info);
    padding: var(--pharos-spacing-1-x) var(--pharos-spacing-2-x);
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__search {
    margin-inline: auto;
    max-width: 24rem;
  }

  &__section {
    padding: var(--pharos-spacing-2-x) var(--pharos-spacing-2-x) var(--pharos-spacing-4-x);
    display: grid;
    grid-template-areas: '. main .';
    grid-template-columns:
      minmax(var(--pharos-spacing-1-x), 1fr)
      minmax(0, 44rem)
      minmax(var(--pharos-spacing-1-x), 1fr);
  }

  &__content {
    grid-area: main;
    width: 100%;
  }

  &__back-link {
    color: var(--pharos-color-text-base);
    display: inline-flex;
    font-size: var(--pharos-font-size-1-x);
    font-weight: var(--pharos-font-weight-medium);
    margin-bottom: var(--pharos-spacing-2-x);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.15em;
  }

  &__entry {
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__pronunciation {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: var(--pharos-spacing-one-half-x);
    margin: 0 0 var(--pharos-spacing-one-quarter-x);
    font-size: var(--pharos-form-element-size-text-label);
    line-height: var(--pharos-line-height-small);
  }

  &__pronunciation-label {
    font-family: var(--pharos-font-family-sans-serif);
    font-weight: var(--pharos-font-weight-bold);
    letter-spacing: calc(var(--pharos-form-element-size-text-label) * -0.02);
    text-transform: uppercase;
  }

  &__definition-block {
    margin: var(--pharos-spacing-2-x) 0 var(--pharos-spacing-3-x);
  }

  &__source {
    color: var(--pharos-color-marble-gray-40);
    font-size: var(--pharos-font-size-small);
    font-style: italic;
    margin-top: calc(
      var(--pharos-spacing-one-quarter-x) * -1
    ); // pulls source up closer to section title
  }

  &__group {
    margin-top: var(--pharos-spacing-2-x);
  }

  &__group-title {
    font-size: var(--pharos-font-size-base);
    font-weight: var(--pharos-font-weight-bold);
    margin-bottom: var(--pharos-spacing-1-x);
  }

  &__group-list {
    list-style: decimal;
    margin: 0;
    padding-left: var(--pharos-spacing-1-x);

    li {
      margin-bottom: var(--pharos-spacing-1-x);
    }
    &--no-list {
      list-style: none;
      padding-left: 0;
    }
  }

  &__footnotes {
    font-size: var(--pharos-font-size-small);
    list-style: decimal;
    margin: var(--pharos-spacing-3-x) 0 var(--pharos-spacing-2-x);
    padding-left: var(--pharos-spacing-1-x);

    li {
      margin-bottom: var(--pharos-spacing-one-quarter-x);
    }
  }

  &__logo {
    display: block;
  }

  @media (width <= 570px) {
    &__section {
      padding-inline: var(--pharos-spacing-1-x);
      grid-template-columns: 1fr;
      grid-template-areas: 'main';
    }

    &__search-shell {
      padding-inline: var(--pharos-spacing-1-x);
    }

    &__source {
      font-size: var(--pharos-font-size-base);
    }
  }
}
</style>
