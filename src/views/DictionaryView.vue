<script setup lang="ts">
import DictionarySearchCombobox from '@/components/dictionary/DictionarySearchCombobox.vue'
import { useLogger } from '@/composables/logging/useLogger'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

// These are just examples and can be changed out for any terms we want to highlight on the dictionary landing page.
// We may weant to use the randomWord endpoint from Wordnik to surface different terms with each landing
// or each day, but for now we'll hardcode some interesting terms that we know have definitions in the source dictionary.
const quickSearchExamples = ['habeas corpus', 'chide', 'academic', 'involuntary', 'sagacious']

const getTermPath = (term: string) => `/dictionary/${encodeURIComponent(term)}`

const { logPageView } = usePageViewLogger()
logPageView()

const { handleWithLog, logs } = useLogger()
const { quickSearchLinkClick } = logs.getDictionaryTermLogs()
</script>

<template>
  <main class="dictionary-view" data-cy="dictionary-view">
    <div class="dictionary-view__section dictionary-view__header">
      <div class="dictionary-view__content">
        <div class="dictionary-view__search">
          <pep-pharos-heading
            :level="1"
            preset="5"
            class="dictionary-view__title"
            data-cy="dictionary-view-title"
          >
            Search the dictionary
          </pep-pharos-heading>
          <DictionarySearchCombobox />
        </div>
        <div class="dictionary-view__suggested">
          Quick searches:
          <RouterLink
            v-for="(option, index) in quickSearchExamples"
            v-slot="{ href, navigate }"
            :key="`example_${index}`"
            custom
            :to="getTermPath(option)"
            @click="handleWithLog(quickSearchLinkClick({ label: option }))"
          >
            <a :href="href" class="dictionary-view__suggested-link" @click="navigate">
              <pep-pharos-pill preset="8">{{ option }}</pep-pharos-pill>
            </a>
          </RouterLink>
        </div>
      </div>
    </div>
    <div class="dictionary-view__section">
      <div class="dictionary-view__content">
        <p class="dictionary-view__copy">
          Search for any word or phrase in the the dictionary to help you build vocabulary as you
          read. JSTOR uses definitions from the
          <b>American Heritage Dictionary</b>, a secure source.
        </p>
        <img
          class="dictionary-view__logo"
          src="/images/wordnik-logo.svg"
          alt="Powered by Wordnik"
        />
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.dictionary-view {
  margin-top: 0;
  margin-bottom: var(--pharos-spacing-2-x);
  &__section {
    padding: var(--pharos-spacing-3-x) var(--pharos-spacing-2-x);
    display: grid;
    grid-template-areas: '. main .';
    grid-template-columns: 1fr 8fr 1fr;
  }
  &__header {
    background: var(--pharos-alert-color-background-info);
  }
  &__title {
    margin-bottom: var(--pharos-spacing-1-x);
    text-align: center;
  }
  &__content {
    grid-area: main;
    justify-self: center;
    max-width: 70rem;
    width: 100%;

    @media (width <= 570px) {
      max-width: calc((var(--vh, 1vh) * 100) - 2rem);
    }
  }
  &__suggested {
    margin-top: var(--pharos-spacing-2-x);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: baseline;
    gap: var(--pharos-spacing-1-x);
    font-size: var(--pharos-font-size-1-x);
    color: var(--pharos-color-marble-gray-64);
    text-align: center;
  }
  &__suggested-link {
    color: inherit;
    display: inline-flex;
    text-decoration: none;
  }
  &__copy {
    font-size: var(--pharos-font-size-1-x);
    color: var(--pharos-color-marble-gray-64);
    text-align: center;
    max-width: 50ch;
    margin-inline: auto;
  }
  &__logo {
    display: block;
    margin: var(--pharos-spacing-3-x) auto 0;
    width: 150px;
  }
}
</style>
