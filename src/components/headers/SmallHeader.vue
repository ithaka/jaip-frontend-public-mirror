<script setup lang="ts">
import ProviderBar from '@/components/headers/ProviderBar.vue'
import { ref } from 'vue'
import NavigationMenu from '@/components/headers/NavigationMenu.vue'
import SearchInput from '@/components/SearchInput.vue'
import RequestWarning from '@/components/headers/RequestWarning.vue'

import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

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

const showSidenav = ref(false)

const logout = () => {
  emit('logout')
  showSidenav.value = false
}
</script>
<template>
  <div>
    <div class="top my-3 flex-direction-column">
      <div class="px-3">
        <pep-pharos-alert
          v-if="alert && alert.status"
          :status="alert.status"
        >
          {{ alert.text }}
        </pep-pharos-alert>
      </div>
      <ProviderBar />
      <RequestWarning
        v-if="showRequestWarning"
        class="my-3 px-3"
      />
    </div>
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
        >
      </pep-pharos-link>
      <div>
        <pep-pharos-button
          class="display-float-right"
          icon="menu"
          a11y-label="Open navigation menu"
          @click.prevent.stop="showSidenav = true"
        />
      </div>
      <pep-pharos-button
        v-if="showLogin"
        name="login-button"
        :href="loginUrl"
        class="ml-13 mr-3"
      >
        Log in
      </pep-pharos-button>
    </div>
    <pep-pharos-sidenav :slide="showSidenav">
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <div
        slot="top"
        class="display-flex flex-direction-column gap-4"
      >
        <div>
          <div
            @click.stop="changeRoute(router, emit, '/', searchTerms, pageNo, undefined, undefined)"
          >
            <img
              src="@/assets/images/JSTOR_Logo.svg"
              class="header-logo svg-white"
              alt="JSTOR Logo"
              data-cy="home"
            >
          </div>
        </div>
        <pep-pharos-button
          v-if="isAuthenticatedAdmin"
          name="logout-button"
          @click.prevent.stop="logout"
        >
          Logout
        </pep-pharos-button>
        <pep-pharos-button
          v-else-if="showLogin"
          name="login-button"
          :href="loginUrl"
        >
          Log in
        </pep-pharos-button>
      </div>
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <pep-pharos-sidenav-section>
        <NavigationMenu
          :key="updateKey"
          :login-url="loginUrl"
          sidenav
          @close="showSidenav = false"
        />
      </pep-pharos-sidenav-section>
      <div class="sidenav-bottom">
        <component
          :is="isAuthenticatedStudent ? 'pep-pharos-sidenav-menu' : 'div'"
          :label="name"
          :a11y-label="name"
        >
          <span
            v-if="isAuthenticatedAdmin"
            class="ml-7"
          >
            <strong>{{ name }}</strong>
          </span>
          <span
            v-else-if="isAuthenticatedStudent"
            class="ml-8"
          >Participating through {{ groups }}</span>
        </component>
      </div>
    </pep-pharos-sidenav>
    <div
      v-if="showSidenav"
      class="sidenav-container"
      @click.prevent.stop="showSidenav = false"
    />
    <SearchInput
      v-if="$route.meta.showSearch && !isUnauthenticated"
      id="small"
      class="mx-6 mb-2"
    />
  </div>
</template>

<style>
.top {
  display: flex;
  justify-content: center;
}
.header__content {
  border-top: 1px solid var(--pharos-color-ui-40);
  border-bottom: 1px solid var(--pharos-color-ui-40);
  padding: var(--pharos-spacing-one-half-x) var(--pharos-spacing-one-and-a-half-x) 0;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.sidenav-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 99;
  overflow: hidden;
}
.fade-in {
  transition:
    opacity 0.3s ease-in-out,
    visibility 0s ease-in-out;
  visibility: visible;
  opacity: 1;
}
</style>
