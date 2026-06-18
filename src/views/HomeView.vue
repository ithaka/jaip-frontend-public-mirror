<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'
import { useRouter } from 'vue-router'
import StudentHelp from '@/components/help/StudentHelp.vue'
import AdminHelp from '@/components/help/AdminHelp.vue'
import SearchInput from '@/components/SearchInput.vue'
import ContentTile from '@/components/tiles/ContentTile.vue'
import ImageTile from '@/components/tiles/ImageTile.vue'
import analyticsPreview from '@/assets/images/analytics-preview-no-blur.png'

const userStore = useUserStore()
const { isAuthenticatedStudent, isAuthenticatedAdmin, groups } = storeToRefs(userStore)

const canViewAnalytics = computed(() => {
  return userStore.groupsWithFeature(groups.value, 'view_analytics').length > 0
})

const { logPageView } = usePageViewLogger()
logPageView()

const router = useRouter()
const routes = router.getRoutes()
const reentryRoute = routes.find((route) => route.name === 'reentry guides')
const dictionaryRoute = routes.find((route) => route.name === 'dictionary')
const analyticsRoute = routes.find((route) => route.name === 'analytics')
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
      </pep-pharos-layout>

      <div class="home-view__hero" :class="{ 'home-view__hero--admin': isAuthenticatedAdmin }">
        <pep-pharos-layout row-gap="0">
          <div class="home-view__search-container">
            <SearchInput id="home" label="Search" a11y-label="Search" variant="prominent" />
          </div>
          <div v-if="isAuthenticatedStudent" class="home-view__content-tiles-layout">
            <div class="home-view__content-tile-item">
              <ContentTile
                arrow-a11y-title="View reentry resources"
                :href="reentryRoute ? reentryRoute.path : '#'"
              >
                <template #title-icon>
                  <pep-pharos-icon name="view-list" a11y-title="Reentry resources" />
                </template>
                <template #title-text>Reentry resources</template>
                <template #body-text>
                  National and state guides to help your transition to community
                </template>
              </ContentTile>
            </div>

            <div class="home-view__content-tile-item">
              <ContentTile
                arrow-a11y-title="View dictionary resources"
                :href="dictionaryRoute ? dictionaryRoute.path : '#'"
              >
                <template #title-icon>
                  <pep-pharos-icon name="book" a11y-title="Look up a word" />
                </template>
                <template #title-text>Look up a word</template>
                <template #body-text>
                  Explore definitions from the American Heritage Dictionary
                </template>
              </ContentTile>
            </div>
          </div>
          <div
            v-if="isAuthenticatedAdmin && canViewAnalytics"
            class="home-view__content-tiles-layout"
          >
            <div class="home-view__content-tile-item home-view__content-tile-item--analytics">
              <ImageTile
                :key-img="analyticsPreview"
                :href="analyticsRoute ? analyticsRoute.path : '#'"
              >
                <template #body-text> See key data and JSTOR usage </template>
                <template #button-text> View analytics </template>
              </ImageTile>
            </div>
          </div>
        </pep-pharos-layout>
      </div>
    </div>

    <pep-pharos-layout class="help" row-gap="0" preset="1-col">
      <StudentHelp v-if="isAuthenticatedStudent" class="home-view__help-container" />
      <AdminHelp v-else-if="isAuthenticatedAdmin" class="home-view__help-container" />
    </pep-pharos-layout>
  </main>
</template>

<style lang="scss" scoped>
.home-view {
  --home-search-height: clamp(3.5rem, 8vw, 4.5rem);
  margin-top: var(--pharos-spacing-3-x);

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
    position: relative;
    z-index: 6;
    min-width: 0;
    max-width: 100%;

    :deep(form) {
      min-width: 0;
      max-width: 100%;
    }

    @media (max-width: 48rem) {
      grid-column: span 8;
    }
  }

  &__help-container {
    grid-column: span 12;
    width: 100%;

    @media screen and (max-width: 48rem) {
      grid-column: span 8;
    }
  }

  &__content-tiles-layout {
    grid-column: span 10;
    position: relative;
    z-index: 4;
    isolation: isolate;
    display: grid;
    grid-template-columns: repeat(10, minmax(0, 1fr));
    gap: var(--pharos-spacing-1-x);
    margin-top: var(--pharos-spacing-1-x);
    margin-bottom: var(--pharos-spacing-1-x);
    align-items: stretch;
    min-width: 0;
    max-width: 100%;

    @media (max-width: 48rem) {
      grid-column: span 8;
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }

    @media (max-width: 425px) {
      display: flex;
      flex-direction: column;
      gap: var(--pharos-spacing-1-x);
    }
  }

  &__hero {
    position: relative;
    z-index: 4;
    isolation: isolate;
    max-width: 100vw;
    overflow-x: clip;

    &--admin {
      min-height: 300px;
    }

    :deep(pep-pharos-layout) {
      max-width: 100%;
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: calc(var(--home-search-height) * 0.7);
      bottom: 0;
      background-image: url('@/assets/images/PEP_hero.jpg');
      background-repeat: no-repeat;
      background-size: cover;
      background-position: right top;
      z-index: -1;
      pointer-events: none;
    }
  }

  &__content-tile-item {
    grid-column: span 5;
    height: 100%;

    @media (max-width: 48rem) {
      grid-column: span 4;
    }

    @media (max-width: 425px) {
      grid-column: span 8;
      width: 100%;
    }

    &--analytics {
      @media (max-width: 48rem) {
        grid-column: span 8;
      }

      @media (max-width: 425px) {
        grid-column: span 8;
        width: 100%;
      }
    }
  }
}
.help {
  margin-top: var(--pharos-spacing-3-x);
}
</style>
