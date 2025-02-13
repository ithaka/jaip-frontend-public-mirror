<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { makeGrammaticalList } from '@/utils/helpers'
import { watch, computed } from 'vue'
import updateRoutes from './router/updateRoutes'
import type { StringString } from '@/interfaces/BasicObjects'

const coreStore = useCoreStore()
const { isAdminSubdomain, routePath, routeQuery, toastKey } = storeToRefs(coreStore)

const userStore = useUserStore()
const {
  isAuthenticatedStudent,
  isAuthenticatedAdmin,
  isUnauthenticated,
  gettingUser,
  entityName,
  groups,
  features,
} = storeToRefs(userStore)
const searchStore = useSearchStore()
const { searching } = storeToRefs(searchStore)

const route = useRoute()
const redirectToParams = () => {
  let path = route.path
  let newURL = new URL(window.location.href)
  if (path.toLowerCase() === '/about') {
    newURL = new URL(newURL.search, newURL.origin)
  }
  return encodeURIComponent('?to=' + newURL)
}
const loginUrl =
  'https://jstor.org/action/showLogin?redirectUri=/api/labs-pep-auth-service' + redirectToParams()

const router = useRouter()
let updateKey = 0
watch(entityName, () => {
  updateRoutes(isAuthenticatedStudent.value, isAuthenticatedAdmin.value, router)
  const availableRoutes = router.getRoutes()
  // TODO: Figure out a better way to match a path to a dynamic route.
  let path = availableRoutes.some((route) => routePath.value.startsWith(route.path))
    ? routePath.value
    : router.currentRoute.value.fullPath
  const params = new URLSearchParams(routeQuery.value || '?term=&page=1')
  const paramObject: StringString = {}
  params.forEach((value: string, key: string) => {
    paramObject[key] = value
  })
  router.replace({ path, query: paramObject })
  updateKey++
})

const logout = async () => {
  await router.push({
    path: '/',
    query: {
      term: '',
      page: 1
    }
  })
  routePath.value = '/'
  routeQuery.value = '?term=&page=1'
  userStore.$reset()
}
const showRequestWarning = computed(() => !features.value['submit_requests'] && isAuthenticatedStudent.value && !isAdminSubdomain.value )
</script>

<template>
  <div>
    <!-- Keeping the spinner outside the layout will allow it to fill the page. Useful for initial loading. -->
    <pep-pharos-loading-spinner v-if="gettingUser || searching" class="position-fixed" />

    <!-- Placing the toaster here will put toast in the top right corner of the browser window. -->
    <pep-pharos-toaster :key="toastKey" ref="toaster" />

    <!-- Headers -->
    <!-- Main Content -->
    <RouterView class="cols-12" />

    <pep-pharos-footer id="footer">
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <div slot="links-group" class="display-flex flex-direction-column mb-6 cols-md-8">
        <span> Brought to you by: </span>
        <img
          v-if="!isAuthenticatedAdmin"
          src="@/assets/images/JSTOR_Labs_Logo.png"
          class="footer-logo"
          alt="JSTOR Labs Logo"
        />
        <a v-else href="https://labs.jstor.org">
          <img
            src="@/assets/images/JSTOR_Labs_Logo.png"
            class="footer-logo"
            alt="JSTOR Labs Logo"
          />
        </a>
      </div>
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <span slot="links-group" class="display-flex flex-direction-column mb-6 pr-6 cols-md-8">
        <span> Made possible with funding from: </span>
        <img
          v-if="!isAuthenticatedAdmin"
          src="@/assets/images/Mellon_Logomark_Lockup_White.png"
          class="footer-logo"
          alt="Mellon Foundation Logo"
        />
        <a v-else href="https://www.mellon.org">
          <img
            src="@/assets/images/Mellon_Logomark_Lockup_White.png"
            class="footer-logo"
            alt="Mellon Foundation Logo"
          />
        </a>
        <img
          v-if="!isAuthenticatedAdmin"
          src="@/assets/images/ASC_Reverse.png"
          class="footer-logo"
          alt="Ascendium Foundation Logo"
        />
        <a v-else href="https://www.ascendiumphilanthropy.org">
          <img
            src="@/assets/images/ASC_Reverse.png"
            class="footer-logo"
            alt="Ascendium Foundation Logo"
          />
        </a>
      </span>
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <span slot="links-group" class="cols-3">
        <span class="mb-4">
          JSTOR is part of
          <span v-if="isAdminSubdomain">
            <pep-pharos-link :on-background.attr="true" href="https://ithaka.org"
              >ITHAKA</pep-pharos-link
            >
          </span>
          <span v-else>ITHAKA</span>, a not-for-profit organization helping the academic community
          use digital technologies to preserve the scholarly record and to advance research and
          teaching in sustainable ways.
        </span>
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <span class="display-block mt-4 copyright">
          ©2000-{{ new Date().getFullYear().toString() }} ITHAKA. All Rights Reserved. JSTOR®, the
          JSTOR logo, JPASS®, Artstor®, Reveal Digital™ and ITHAKA® are registered trademarks of
          ITHAKA.
        </span>
      </span>
    </pep-pharos-footer>
  </div>
</template>

<style scoped></style>
