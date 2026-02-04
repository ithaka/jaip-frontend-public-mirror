<script setup lang="ts">
import StudentHelp from '@/components/help/StudentHelp.vue'
import AdminHelp from '@/components/help/AdminHelp.vue'
import SearchInput from '@/components/SearchInput.vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const userStore = useUserStore()
const { isAuthenticatedStudent, isAuthenticatedAdmin } = storeToRefs(userStore)

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main class="home-view" data-cy="home-view">
    <div class="home-view__top-section">
      <pep-pharos-layout row-gap="0">
        <pep-pharos-heading
          :level="1"
          preset="7"
          class="home-view__header home-view__header--large"
          data-cy="home-view-header"
        >
          <span>Explore the world's knowledge, cultures, and ideas</span>
        </pep-pharos-heading>
        <pep-pharos-heading
          :level="1"
          preset="5"
          class="home-view__header home-view__header--small"
          data-cy="home-view-header"
        >
          <span>Explore the world's knowledge, cultures, and ideas</span>
        </pep-pharos-heading>
        <div class="home-view__search-container">
          <SearchInput id="home" label="Search" a11y-label="Search" variant="prominent" />
        </div>
      </pep-pharos-layout>
    </div>

    <div class="home-view__hero">
      <img src="@/assets/images/PEP_hero.jpg" alt="" class="home-view__hero-image" />
    </div>

    <pep-pharos-layout row-gap="0" preset="1-col">
      <StudentHelp v-if="isAuthenticatedStudent" class="home-view__help-container" />
      <AdminHelp v-else-if="isAuthenticatedAdmin" class="home-view__help-container" />
    </pep-pharos-layout>
  </main>
</template>

<style lang="scss" scoped>
.home-view {
  margin-top: var(--pharos-spacing-3-x);

  &__top-section {
    position: relative;
    z-index: 10;
  }

  &__header {
    width: 100%;
    grid-column: span 12;

    &--large {
      display: none;

      @media (min-width: 426px) {
        display: block;
      }
    }

    &--small {
      display: block;

      @media (min-width: 426px) {
        display: none;
      }

      @media (max-width: 48rem) {
        grid-column: span 8;
      }
    }
  }

  &__search-container {
    grid-column: span 10;

    @media (max-width: 48rem) {
      grid-column: span 8;
    }
  }

  &__hero {
    position: relative;
    z-index: 1;
    width: 100%;
    margin-top: -1rem; // negative margin to place it partially under the search bar
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);
    overflow: hidden;

    @media (min-width: 426px) {
      height: 28%;
      height: 35vh;
      height: 35dvh;
    }

    @media (max-width: 425px) {
      height: 20%;
      height: 30vh;
      height: 30dvh;
    }
  }

  &__hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: right bottom;
  }

  &__help-container {
    grid-column: span 12;
    width: 100%;

    @media screen and (max-width: 48rem) {
      grid-column: span 8;
    }
  }
}
</style>
