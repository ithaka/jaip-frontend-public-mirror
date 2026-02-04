<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { makeGrammaticalList } from '@/utils/helpers'
import { watch, computed } from 'vue'
import updateRoutes from './router/updateRoutes'
import MainHeader from '@/components/headers/MainHeader.vue'
import SmallHeader from '@/components/headers/SmallHeader.vue'
import TheFooter from './components/footer/TheFooter.vue'
import type { StringString } from '@/interfaces/BasicObjects'
import NotificationsBar from './components/headers/NotificationsBar.vue'
import { useNotificationsStore } from './stores/notifications'

const coreStore = useCoreStore()
const { isAdminSubdomain, routePath, routeQuery, toastKey, environment, isSpinning } =
  storeToRefs(coreStore)

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

const notificationsStore = useNotificationsStore()
const { notifications } = storeToRefs(notificationsStore)

const route = useRoute()
const redirectToParams = () => {
  const path = route.path
  let newURL = new URL(window.location.href)
  if (path.toLowerCase() === '/about') {
    newURL = new URL(newURL.search, newURL.origin)
  }
  return encodeURIComponent('?to=' + newURL)
}

const loginUrl = computed(() => {
  return environment.value === 'prod'
    ? 'https://jstor.org/action/showLogin?redirectUri=/api/labs-pep-auth-service' +
        redirectToParams()
    : 'https://firefly.jstor.org/action/showLogin?redirectUri=/api/labs-pep-auth-service' +
        redirectToParams()
})

const router = useRouter()
let updateKey = 0
watch(entityName, () => {
  updateRoutes(isAuthenticatedStudent.value, isAuthenticatedAdmin.value, router)
  const availableRoutes = router.getRoutes()
  // TODO: Figure out a better way to match a path to a dynamic route.
  const path = availableRoutes.some((route) => routePath.value.startsWith(route.path))
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
      page: 1,
    },
  })
  routePath.value = '/'
  routeQuery.value = '?term=&page=1'
  userStore.$reset()
}
const showRequestWarning = computed(
  () =>
    !features.value['submit_requests'] && isAuthenticatedStudent.value && !isAdminSubdomain.value,
)

const truncatedGramaticalGroupsList = computed(() => {
  const isOverlong = groups.value.length > 3
  const truncated = isOverlong ? groups.value.slice(0, 3) : groups.value
  return makeGrammaticalList(truncated.map((group) => group.name)) + (isOverlong ? ' et al.' : '')
})
</script>

<template>
  <div class="app-container">
    <!-- Keeping the spinner outside the layout will allow it to fill the page. Useful for initial loading. -->
    <pep-pharos-loading-spinner
      v-if="gettingUser || searching || isSpinning"
      class="app-container__spinner"
    />

    <!-- Placing the toaster here will put toast in the top right corner of the browser window. -->
    <pep-pharos-toaster :key="toastKey" ref="toaster" />

    <!-- Headers -->
    <MainHeader
      class="app-container__header app-container__main-header"
      :groups="truncatedGramaticalGroupsList"
      :show-login="!isAuthenticatedAdmin && isAdminSubdomain"
      :login-url="loginUrl"
      :update-key="updateKey"
      :is-unauthenticated="isUnauthenticated"
      :is-authenticated-admin="isAuthenticatedAdmin"
      :is-authenticated-student="isAuthenticatedStudent"
      :is-admin-subdomain="isAdminSubdomain"
      :show-request-warning="!!showRequestWarning"
      :name="entityName"
      @logout="logout"
    />
    <SmallHeader
      class="app-container__header app-container__small-header"
      :show-login="!isAuthenticatedAdmin && isAdminSubdomain"
      :login-url="loginUrl"
      :update-key="updateKey"
      :is-authenticated-admin="isAuthenticatedAdmin"
      :is-authenticated-student="isAuthenticatedStudent"
      :is-unauthenticated="isUnauthenticated"
      :is-admin-subdomain="isAdminSubdomain"
      :show-request-warning="!!showRequestWarning"
      :name="entityName"
      :groups="truncatedGramaticalGroupsList"
      @logout="logout"
    />

    <NotificationsBar
      v-if="!isUnauthenticated && notifications.length"
      :notifications="notifications"
      class="app-container__notifications"
    />
    <!-- Main Content -->
    <RouterView id="main-content" class="app-container__main" />
    <TheFooter
      :key="updateKey"
      class="app-container__footer"
      :is-authenticated-admin="isAuthenticatedAdmin"
      :is-admin-subdomain="isAdminSubdomain"
    />
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  background-color: var(--pharos-color-white);
  color: var(--pharos-color-text-base);
  display: grid;
  min-height: 100%;
  grid-template-areas:
    'main-header'
    'small-header'
    'notifications'
    'main'
    'footer';
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  &__spinner {
    position: fixed;
  }
  &__main-header {
    grid-area: main-header;
  }
  &__small-header {
    grid-area: small-header;
    display: none;
  }
  &__notifications {
    grid-area: notifications;
  }
  &__main {
    grid-area: main;
    min-height: 0;
    margin-top: var(--pharos-spacing-2-x);
    margin-bottom: var(--pharos-spacing-5-x);
  }
  &__footer {
    grid-area: footer;
  }

  @media screen and (max-width: 48rem) {
    &__main-header {
      display: none;
    }
    &__small-header {
      display: grid;
    }
  }
}
</style>
