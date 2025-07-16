<script setup lang="ts">
import { ref } from 'vue'
import ProviderBar from '@/components/headers/ProviderBar.vue'
import NavigationMenu from '@/components/headers/NavigationMenu.vue'
import SearchInput from '@/components/SearchInput.vue'
import RequestWarning from '@/components/headers/RequestWarning.vue'

import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import JstorLogo from './JstorLogo.vue'

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

const coreStore = useCoreStore()
const { alert } = storeToRefs(coreStore)

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
</script>
<template>
  <div>
    <div class="top my-3 flex-direction-column">
      <div class="px-3">
        <pep-pharos-alert v-if="alert && alert.status" :status="alert.status">
          {{ alert.text }}
        </pep-pharos-alert>
      </div>
      <ProviderBar :groups="groups" />
      <RequestWarning v-if="showRequestWarning" class="my-3 px-3" />
    </div>
    <!-- Header -->
    <div class="header__content pa-5 justify-content-space-between">
      <pep-pharos-link
        class="mr-4"
        @click.prevent.stop="
          changeRoute(router, emit, '/', searchTerms, pageNo, undefined, undefined)
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
          class="display-float-right"
          icon="menu"
          a11y-label="Open sidenav"
          @click="onOpenSidenav"
        />
      </div>
      <pep-pharos-button v-if="showLogin" name="login-button" :href="loginUrl" class="ml-13 mr-3">
        Log in
      </pep-pharos-button>
    </div>
    <!-- Mobile Sidenav -->
    <pep-pharos-sidenav
      id="pep-sidenav"
      has-close-button
      :open="isSidenavVisible"
      class="side-navigation"
      @pharos-sidenav-close="onCloseSidenav"
    >
      <JstorLogo :is-big-logo="true" @logo-click="handleLogoClick" />
      <pep-pharos-button
        v-if="isAuthenticatedAdmin"
        class="side-navigation__top"
        name="logout-button"
        @click.prevent.stop="logout"
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
      <pep-pharos-sidenav-section>
        <NavigationMenu :key="updateKey" :login-url="loginUrl" sidenav />
      </pep-pharos-sidenav-section>
      <pep-pharos-sidenav-link
        v-if="isAuthenticatedAdmin || isAuthenticatedStudent"
        href="#"
        class="side-navigation__bottom"
        >{{ name }}</pep-pharos-sidenav-link
      >
    </pep-pharos-sidenav>
    <div
      v-if="isSidenavVisible"
      class="side-navigation__background"
      @click.prevent.stop="onCloseSidenav"
    />
    <!-- Search Input component -->
    <SearchInput v-if="$route.meta.showSearch && !isUnauthenticated" id="small" class="mx-6 mb-2" />
  </div>
</template>

<style scoped lang="scss">
.header__top {
  padding: var(--pharos-spacing-one-half-x) var(--pharos-spacing-one-and-a-half-x);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom-style: solid;
  border-bottom-width: 1px;
  transition:
    background-color 0.3s ease-in-out,
    border-color 0.3s ease-in-out;
}

.side-navigation {
  &__top {
    display: grid;
    grid-template-columns: auto 1.5rem;
    grid-template-rows: auto;
    padding: var(--pharos-spacing-2-x) var(--pharos-spacing-2-x) var(--pharos-spacing-one-quarter-x);
  }
  &__bottom {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 50vh;
  }
}
.side-navigation__background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
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
