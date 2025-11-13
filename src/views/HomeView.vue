<script setup lang="ts">
import StudentHelp from '@/components/help/StudentHelp.vue'
import AdminHelp from '@/components/help/AdminHelp.vue'
import SearchInput from '@/components/SearchInput.vue'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { isAuthenticatedStudent, isAuthenticatedAdmin } = storeToRefs(userStore)

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_landing_home_view',
  event_description: 'User has landed on the home view.',
})
</script>

<template>
  <main class="home-view" data-cy="home-view">
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

    <div class="home-view__hero" />

    <pep-pharos-layout row-gap="0" preset="1-col">
      <AdminHelp v-if="isAuthenticatedAdmin" class="home-view__help-container" />
      <StudentHelp v-else-if="isAuthenticatedStudent" class="home-view__help-container" />
    </pep-pharos-layout>
  </main>
</template>

<style lang="scss" scoped>
.home-view {
  margin-top: var(--pharos-spacing-3-x);

  &__header {
    width: 100%;
    grid-column: span 12;

    &--large {
      display: none;

      @media (min-width: 768px) {
        display: block;
      }
    }

    &--small {
      display: block;

      @media (min-width: 768px) {
        display: none;
      }

      @media screen and (max-width: 48rem) {
        grid-column: span 8;
      }
    }
  }

  &__search-container {
    grid-column: span 10;

    @media screen and (max-width: 48rem) {
      grid-column: span 8;
    }
  }

  &__hero {
    width: 100%;
    margin-top: -1rem; // negative margin to place it partially under the search bar
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);
    overflow: hidden;
    background-image: url('@/assets/images/PEP_hero.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: right bottom;
    width: 100%;

    @media (min-width: 426px) {
      height: 40vh;
    }

    @media (max-width: 425px) {
      height: 30vh;
    }
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
