<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSearchStore } from '@/stores/search'
import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { computed } from 'vue'

const { isAuthenticatedAdmin, isAdminSubdomain } = defineProps({
  isAuthenticatedAdmin: {
    type: Boolean,
    required: true,
  },
  isAdminSubdomain: {
    type: Boolean,
    required: true,
  },
})

const router = useRouter()
const linkGroup = computed(() => {
  const routes = router.getRoutes()
  return routes.reduce(
    (acc, route) => {
      if (!route.meta?.hidden || route.meta?.showInFooter) {
        // Insert 'home' route at the beginning, others at the end
        if (route.name === 'home') {
          acc.unshift(route)
        } else {
          acc.push(route)
        }
      }
      return acc
    },
    [] as typeof routes,
  )
})

const emit = defineEmits(['close'])
const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const onLinkClick = (path: string) => {
  // Add a check as I saw an object being passed instead of a string
  const term = typeof searchTerms.value === 'string' ? searchTerms.value : ''
  changeRoute(router, emit, path, term, pageNo.value, undefined, undefined)
}
</script>

<template>
  <footer id="footer-element">
    <div class="footer__content">
      <div class="footer__row footer__row--top">
        <pep-pharos-heading :level="2" preset="5--bold">Explore JSTOR</pep-pharos-heading>
      </div>
      <div class="footer__row footer__row--main">
        <div class="footer__columnn--left">
          <div class="footer__links-wrapper">
            <pep-pharos-link
              v-for="link in linkGroup"
              :id="link.name"
              :key="link.name"
              :href="link.path"
              .isOnBackground="true"
              subtle
              class="footer__links"
              @click="onLinkClick(link.path)"
            >
              {{ link.meta.label }}
              <pep-pharos-pill
                v-if="link.meta.showAsNew"
                size="small"
                preset="2"
                class="sidenav-pill"
                >NEW</pep-pharos-pill
              >
            </pep-pharos-link>
          </div>
          <div class="footer__row--bottom">
            <div class="footer__group">
              <pep-pharos-heading :level="3" preset="1--bold" class="footer__sponsor" no-margin>
                Brought to you by:
              </pep-pharos-heading>
              <img
                v-if="!isAuthenticatedAdmin"
                src="@/assets/images/JSTOR_Labs_Logo.png"
                class="footer__logo"
                alt="JSTOR Labs Logo"
                data-cy="footer-jstor-labs-logo-linkless"
              />
              <pep-pharos-link
                v-else
                href="https://labs.jstor.org"
                data-cy="footer-jstor-labs-logo-link"
                a11y-label="JSTOR Labs"
                .isOnBackground="true"
                subtle
                target="_blank"
              >
                <img
                  src="@/assets/images/JSTOR_Labs_Logo.png"
                  class="footer__logo"
                  alt="JSTOR Labs Logo"
                  data-cy="footer-jstor-labs-logo-linked"
                />
              </pep-pharos-link>
            </div>
            <div class="footer__group footer__group--sponsor-group">
              <pep-pharos-heading
                :level="3"
                preset="1--bold"
                class="footer__sponsor footer__sponsor--full-width-item"
                no-margin
              >
                Made possible with funding from:
              </pep-pharos-heading>
              <img
                v-if="!isAuthenticatedAdmin"
                src="@/assets/images/Mellon_Logomark_Lockup_White.png"
                class="footer__logo"
                alt="Mellon Foundation Logo"
                data-cy="footer-mellon-logo-linkless"
              />
              <pep-pharos-link
                v-else
                href="https://www.mellon.org"
                a11y-label="Mellon Foundation"
                data-cy="footer-mellon-logo-link"
                .isOnBackground="true"
                subtle
                target="_blank"
              >
                <img
                  src="@/assets/images/Mellon_Logomark_Lockup_White.png"
                  class="footer__logo"
                  alt="Mellon Foundation Logo"
                  data-cy="footer-mellon-logo-linked"
                />
              </pep-pharos-link>
              <img
                v-if="!isAuthenticatedAdmin"
                src="@/assets/images/ASC_Reverse.png"
                class="footer__logo"
                alt="Ascendium Foundation Logo"
                data-cy="footer-ascendium-logo-linkless"
              />
              <pep-pharos-link
                v-else
                href="https://www.ascendiumphilanthropy.org"
                data-cy="footer-ascendium-logo-link"
                a11y-label="Ascendium Foundation"
                .isOnBackground="true"
                subtle
                target="_blank"
              >
                <img
                  src="@/assets/images/ASC_Reverse.png"
                  class="footer__logo"
                  alt="Ascendium Foundation Logo"
                  data-cy="footer-ascendium-logo-linked"
                />
              </pep-pharos-link>
            </div>
          </div>
        </div>
        <div class="footer__columnn--right">
          <p class="footer__statement">
            JSTOR is part of
            <pep-pharos-link
              v-if="isAdminSubdomain"
              :isOnBackground="true"
              href="https://www.ithaka.org"
              >ITHAKA</pep-pharos-link
            >
            <span v-else class="footer__brand">ITHAKA</span>, a not-for-profit organization helping
            the academic community use digital technologies to preserve the scholarly record and to
            advance research and teaching in sustainable ways.
          </p>
          <p class="footer__statement" data-cy="footer-copyright">
            ©2000-{{ new Date().getFullYear().toString() }} ITHAKA. All Rights Reserved. JSTOR®, the
            JSTOR logo, JPASS®, Artstor®, Reveal Digital™ and ITHAKA® are registered trademarks of
            ITHAKA.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
#footer-element {
  background-color: var(--pharos-color-marble-gray-10);
  color: var(--pharos-color-white);
  padding: var(--pharos-spacing-2-x) var(--pharos-spacing-1-x);
  display: grid;
  grid-template-areas: '. main .';
  grid-template-columns: 1fr 8fr 1fr;

  * > ul {
    list-style: none;
    padding-inline-start: 0;
    padding-left: 0;
  }

  .footer__content {
    grid-area: main;
    max-width: 70rem;
    justify-self: center;

    @media (width <= 570px) {
      max-width: calc(100vw - 2rem);
    }

    .footer__row {
      display: grid;

      &--top {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
      }

      &--main {
        grid-template-columns: 1.75fr 1fr;
        grid-template-rows: auto;
        grid-gap: var(--pharos-spacing-2-x);

        @media (width <= 1024px) {
          grid-template-columns: 1fr;
          grid-template-rows: repeat(5, auto);
          column-gap: 0;
          grid-gap: var(--pharos-spacing-1-x);
        }

        @media (width <= 570px) {
          grid-template-columns: 1fr;
          grid-template-rows: repeat(5, auto);
        }
      }

      &--bottom {
        display: grid;
        grid-template-columns: 250px auto;
        grid-template-rows: auto;
        justify-content: start;

        @media (width <= 1024px) {
          grid-template-columns: 1fr 1fr;
        }

        @media (width <= 570px) {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
        }
      }
    }

    .footer__group {
      margin-top: var(--pharos-spacing-one-and-a-half-x);

      &--sponsor-group {
        display: grid;
        grid-template-columns: 1fr 1fr;

        .footer__sponsor--full-width-item {
          grid-column: 1 / -1;
        }

        .footer__sponsor--two-column-item {
          grid-gap: var(--pharos-spacing-1-x);
        }
      }
    }

    .footer__logo {
      width: 100%;
      max-width: 180px;
      margin-top: var(--pharos-spacing-1-x);
    }

    .footer__brand {
      font-weight: bold;
      color: var(--pharos-color-white);
    }

    .footer__links-wrapper {
      grid-column: 1 / 5;
      display: grid;
      grid-template-columns: repeat(5, minmax(min-content, max-content));
      grid-template-rows: repeat(2, auto);
      gap: var(--pharos-spacing-1-x) var(--pharos-spacing-3-x);

      @media (width <= 570px) {
        gap: var(--pharos-spacing-one-half-x);
        grid-template-columns: repeat(2, 1fr);
      }

      .footer__links {
        display: inline-flex;
        flex-direction: row;
        white-space: nowrap;
        grid-gap: 0.25rem;
      }
    }

    .footer__statement {
      font-size: var(--pharos-font-size-small);
      line-height: var(--pharos-line-height-small);
      color: var(--pharos-color-marble-gray-80);

      & + .footer__statement {
        margin-top: var(--pharos-spacing-one-and-a-half-x);
      }
    }

    .footer__columnn--right {
      @media (width <= 1024px) {
        margin-top: 0;
      }
    }
  }
}
</style>
