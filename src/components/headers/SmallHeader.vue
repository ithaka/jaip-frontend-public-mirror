<script setup lang="ts">
import { ref } from 'vue'
import ProviderBar from '@/components/headers/ProviderBar.vue'
import SidenavMenu from '@/components/headers/SidenavMenu.vue'
import SearchInput from '@/components/SearchInput.vue'
import RequestWarning from '@/components/headers/RequestWarning.vue'

import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import JstorLogo from './JstorLogo.vue'
import { useLogger } from '@/composables/logging/useLogger'

defineProps({
  loginUrl: {
    type: String,
    default: '',
  },
  showLogin: {
    type: Boolean,
    default: false,
  },
  updateKey: {
    type: Number,
    default: 0,
  },
  isAuthenticatedAdmin: {
    type: Boolean,
    default: false,
  },
  isAuthenticatedStudent: {
    type: Boolean,
    default: false,
  },
  isUnauthenticated: {
    type: Boolean,
    default: false,
  },
  isAdminSubdomain: {
    type: Boolean,
    default: false,
  },
  showRequestWarning: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: '',
  },
  groups: {
    type: String,
    default: '',
  },
})
const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const emit = defineEmits(['logout', 'close'])

const logout = () => {
  emit('logout')
}

const handleLogoClick = () => {
  onCloseSidenav()
  changeRoute(router, emit, '/', searchTerms.value, pageNo.value, undefined, undefined)
}

const isSidenavVisible = ref(false)

const onOpenSidenav = () => {
  isSidenavVisible.value = true
}

const onCloseSidenav = () => {
  isSidenavVisible.value = false
  emit('close')
}

const { handleWithLog, logs } = useLogger()
const { logOutLog, logInLog, jstorLogoClickLog, openSidenavLog, closeSidenavLog } =
  logs.getHeaderLogs()
</script>
<template>
  <div>
    <div class="top my-3 flex-direction-column">
      <ProviderBar
        :groups="groups"
        :is-admin-subdomain="isAdminSubdomain"
        :is-authenticated-admin="isAuthenticatedAdmin"
        :is-authenticated-student="isAuthenticatedStudent"
        :login-url="loginUrl"
      />
      <RequestWarning v-if="showRequestWarning" class="my-3 px-3" />
    </div>
    <!-- Header -->
    <div class="header__content pa-5 justify-content-space-between">
      <pep-pharos-link
        class="mr-4"
        @click.prevent.stop="
          handleWithLog(jstorLogoClickLog, () =>
            changeRoute(router, emit, '/', searchTerms, pageNo, undefined, undefined),
          )
        "
      >
        <img
          src="@/assets/images/JSTOR_Logo.svg"
          class="header-logo"
          alt="JSTOR Logo"
          data-cy="home"
        />
      </pep-pharos-link>
      <div>
        <pep-pharos-button
          variant="subtle"
          icon="menu"
          a11y-label="Open sidenav"
          @click="handleWithLog(openSidenavLog, onOpenSidenav)"
        />
      </div>
      <pep-pharos-button
        v-if="showLogin"
        name="login-button"
        :href="loginUrl"
        class="ml-13 mr-3"
        @click="handleWithLog(logInLog)"
      >
        Log in
      </pep-pharos-button>
    </div>
    <!-- Mobile Sidenav -->
    <pep-pharos-sidenav
      id="pep-sidenav"
      has-close-button
      :open="isSidenavVisible"
      class="side-navigation"
      @pharos-sidenav-close="handleWithLog(closeSidenavLog, onCloseSidenav)"
    >
      <JstorLogo :is-big-logo="true" @logo-click="handleLogoClick" />
      <pep-pharos-button
        v-if="isAuthenticatedAdmin"
        class="side-navigation__top"
        name="logout-button"
        @click.prevent.stop="handleWithLog(logOutLog, logout)"
      >
        Logout
      </pep-pharos-button>
      <pep-pharos-button
        v-else-if="showLogin"
        class="side-navigation__top"
        name="login-button"
        :href="loginUrl"
      >
        Log in
      </pep-pharos-button>
      <SidenavMenu
        :key="updateKey"
        @close-sidenav="handleWithLog(closeSidenavLog, onCloseSidenav)"
      />
      <pep-pharos-sidenav-section v-if="isAuthenticatedAdmin || isAuthenticatedStudent">
        <pep-pharos-sidenav-link class="side-navigation__bottom" href="/">
          {{ name }}
        </pep-pharos-sidenav-link>
      </pep-pharos-sidenav-section>
    </pep-pharos-sidenav>
    <div
      v-if="isSidenavVisible"
      class="side-navigation__background"
      @click.prevent.stop="handleWithLog(closeSidenavLog, onCloseSidenav)"
    />
    <!-- Search Input component -->
    <SearchInput v-if="$route.meta.showSearch && !isUnauthenticated" id="small" class="mx-6 mb-2" />
  </div>
</template>

<style scoped lang="scss">
.side-navigation {
  &__top {
    display: grid;
    grid-template-columns: auto 1.5rem;
    padding: var(--pharos-spacing-2-x) var(--pharos-spacing-2-x) var(--pharos-spacing-one-quarter-x);
  }
}
.side-navigation::-webkit-scrollbar,
.side-navigation__background::-webkit-scrollbar {
  display: none; /* Hides the scrollbar */
}

.side-navigation__background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 99;
  overflow: hidden;
}

.header__content {
  border-top: 1px solid var(--pharos-color-ui-40);
  border-bottom: 1px solid var(--pharos-color-ui-40);
  padding: var(--pharos-spacing-one-half-x) var(--pharos-spacing-one-and-a-half-x) 0;
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
