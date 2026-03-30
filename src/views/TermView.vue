<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DictionarySearchCombobox from '@/components/dictionary/DictionarySearchCombobox.vue'
import { addDefinitionGroupFootnotes } from '@/utils/dictionary'
import { useCoreStore } from '@/stores/core'
import { FootnoteDirectionOptions, type WordnikWordData } from '@/interfaces/Dictionary'
import { storeToRefs } from 'pinia'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'
import { useLogger } from '@/composables/logging/useLogger'

const route = useRoute()
const coreStore = useCoreStore()
const { isSpinning } = storeToRefs(coreStore)

const term = computed(() => {
  const rawTerm = String(route.params.term ?? '')
  try {
    return decodeURIComponent(rawTerm)
  } catch {
    return rawTerm
  }
})

const termData = ref({} as WordnikWordData)
const hasError = ref(false)
const getTermData = async (term: string) => {
  isSpinning.value = true
  hasError.value = false
  try {
    const results = await coreStore.$api.dictionary.wordSearch(term)
    termData.value = results.data
    // If there's an error getting definitions, we'll show an error state,
    // even if pronunciations and etymologies were successfully retrieved,
    // since definitions are the primary content on this page.
    if (termData.value.definitions?.is_error) {
      hasError.value = true
    }
  } catch {
    // In the case of an error with the API, we'll also show the error state.
    hasError.value = true
  } finally {
    isSpinning.value = false
  }
}
getTermData(term.value)

watch(term, (newTerm: string) => {
  getTermData(newTerm)
})

const pronunciations = computed(() => {
  // Wordnik's API can return duplicate pronunciations. This might be useful if we want to associate
  // pronunciations with specific definitions in the future, but for now, we just want to display unique pronunciations.
  // For reference, the ID for each pronunciation can be matched with the id for definitions.
  return (
    termData.value.pronunciations?.response.reduce(
      (acc, curr) => {
        if (!acc.some((existing) => existing.raw === curr.raw)) {
          acc.push(curr)
        }
        return acc
      },
      [] as WordnikWordData['pronunciations']['response'],
    ) ?? []
  )
})
const etymologies = computed(() => {
  return termData.value.etymologies?.response ?? []
})
const definitions = computed(() => {
  return (
    termData.value.definitions?.response.reduce(
      (acc, curr) => {
        const existingGroup = acc.find((group) => group.label === curr.partOfSpeech)
        const text = Array.isArray(curr.text) ? curr.text.join(' ') : curr.text
        if (existingGroup) {
          existingGroup.entries.push(text)
        } else {
          acc.push({
            label: curr.partOfSpeech,
            entries: [text],
          })
        }
        return acc
      },
      [] as { label: string; entries: string[] }[],
    ) ?? []
  )
})
const footnotedDefinitions = computed(() => {
  return addDefinitionGroupFootnotes(definitions.value)
})

const attributionStatement = computed(() => {
  const attribution = termData.value.definitions?.response[0]?.attributionText
  return attribution ? `${attribution}` : null
})

const definitionGroups = computed(() => footnotedDefinitions.value.definitionGroups)
const footnotes = computed(() => {
  if (etymologies.value.length) {
    return footnotedDefinitions.value.footnotes
  } else {
    // If there are no etymologies, we don't need to include the footnote
    // that defines the word.
    const notes = footnotedDefinitions.value.footnotes
    return notes.slice(0, -1)
  }
})
const etymologiesNote = computed(() => footnotedDefinitions.value.etymologiesNote)

const { logPageView } = usePageViewLogger()
logPageView()

const { handleWithLog, logs } = useLogger()
const { footnoteLinkClick } = logs.getDictionaryTermLogs()
</script>

<template>
  <main class="term-view" data-cy="term-view">
    <section class="term-view__search-shell">
      <div class="term-view__search">
        <DictionarySearchCombobox :initial-value="term" />
      </div>
    </section>

    <section class="term-view__section">
      <div v-if="!isSpinning" class="term-view__content">
        <RouterLink class="term-view__back-link" to="/dictionary"
          >&larr; Back to dictionary home</RouterLink
        >
        <div v-if="definitions.length" class="term-view__content--success">
          <div class="term-view__entry">
            <pep-pharos-heading preset="5" :level="1">{{ term }}</pep-pharos-heading>
            <p v-if="pronunciations.length" class="term-view__pronunciation">
              <span class="term-view__pronunciation-label">Pronunciation:</span>
              <span v-for="pronunciation in pronunciations" :key="pronunciation.id">{{
                pronunciation.raw
              }}</span>
            </p>
          </div>
          <section
            v-if="definitions.length"
            class="term-view__definition-block"
            aria-labelledby="definitions-title"
          >
            <pep-pharos-heading id="definitions-title" preset="2" :level="2"
              >Definitions</pep-pharos-heading
            >
            <p v-if="attributionStatement" class="term-view__source">
              {{ attributionStatement }}
            </p>
            <hr />
            <div v-for="group in definitionGroups" :key="group.label" class="term-view__group">
              <div class="term-view__group-title">
                {{ group.label }}
                <sup>
                  <pep-pharos-link
                    :id="`footnote_link_${group.note}`"
                    :href="`#footnote_${group.note}`"
                    @click="
                      handleWithLog(
                        footnoteLinkClick({
                          label: group.label,
                          index: group.note,
                          direction: FootnoteDirectionOptions.toFootnote,
                        }),
                      )
                    "
                  >
                    {{ group.note }}
                  </pep-pharos-link>
                </sup>
              </div>
              <ol class="term-view__group-list">
                <li v-for="entry in group.entries" :key="entry">
                  <span v-html="entry" />
                </li>
              </ol>
            </div>
          </section>

          <section
            v-if="etymologies.length"
            class="term-view__definition-block"
            aria-labelledby="etymologies-title"
          >
            <pep-pharos-heading id="etymologies-title" preset="2" :level="2"
              >Etymologies<sup
                ><pep-pharos-link
                  :id="`footnote_link_${etymologiesNote}`"
                  :href="`#footnote_${etymologiesNote}`"
                  >{{ etymologiesNote }}</pep-pharos-link
                ></sup
              ></pep-pharos-heading
            >
            <p v-if="attributionStatement" class="term-view__source">{{ attributionStatement }}</p>
            <hr />
            <div class="term-view__group">
              <p
                v-for="etymology in etymologies"
                :key="etymology.id"
                class="term-view__group-list--no-list"
              >
                <span v-html="etymology.etymologyXML" />
              </p>
            </div>
          </section>
          <div>
            <hr />
            <ol class="term-view__footnotes">
              <pep-pharos-link
                v-for="(note, index) in footnotes"
                :key="index"
                :href="`#footnote_link_${index + 1}`"
                @click="
                  handleWithLog(
                    footnoteLinkClick({
                      label: note,
                      index,
                      direction: FootnoteDirectionOptions.toSource,
                    }),
                  )
                "
              >
                <li :id="`footnote_${index + 1}`">
                  {{ note }}
                </li>
              </pep-pharos-link>
            </ol>
          </div>

          <img class="term-view__logo" src="/images/wordnik-logo.svg" alt="Powered by Wordnik" />
        </div>
        <div v-else-if="hasError" class="term-view__content--error">
          <pep-pharos-heading preset="4" :level="1">We couldn't find that page</pep-pharos-heading>
          <p>
            Please check your search and try again. If the issue persists, contact your
            administrator.
          </p>
        </div>
        <div v-else-if="!isSpinning" class="term-view__content--no-results">
          <pep-pharos-heading preset="4" :level="1"
            >No results found for "<strong>{{ term }}</strong
            >"</pep-pharos-heading
          >
          <p>Try searching the dictionary for another word or phrase.</p>
        </div>
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
    &--error,
    &--no-results {
      margin-bottom: var(--pharos-spacing-10-x);
    }
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
    margin-top: var(--pharos-spacing-1-x);
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
    margin-left: var(--pharos-spacing-one-half-x);
    li {
      margin-bottom: var(--pharos-spacing-1-x);
    }
    &--no-list {
      list-style: none;
      padding-left: 0;
      margin-bottom: var(--pharos-spacing-1-x);
    }
  }

  &__footnotes {
    font-size: var(--pharos-font-size-small);
    list-style: none;
    margin: var(--pharos-spacing-1-x) 0 var(--pharos-spacing-2-x);
    padding-left: var(--pharos-spacing-1-x);
    counter-reset: footnote;

    li {
      counter-increment: footnote;
      margin-bottom: var(--pharos-spacing-one-quarter-x);

      &::before {
        content: counter(footnote);
        font-size: 0.7em;
        vertical-align: super;
        line-height: 0;
        margin-right: 0.15em;
      }
    }
  }

  &__logo {
    display: block;
    max-width: 132px;
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
