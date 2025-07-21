<script setup lang="ts">
import NavigationMenu from '@/components/headers/NavigationMenu.vue'
import ProviderBar from '@/components/headers/ProviderBar.vue'
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
  groups: {
    type: String,
    default: '',
  },
  updateKey: {
    type: Number,
    default: 0,
  },
  isAuthenticatedAdmin: {
    type: Boolean,
    required: true,
  },
  isAuthenticatedStudent: {
    type: Boolean,
    required: true,
  },
  isUnauthenticated: {
    type: Boolean,
    required: true,
  },
  showRequestWarning: {
    type: Boolean,
    default: false,
  },
  name: {
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
</script>
<template>
  <pep-pharos-header class="pep-pharos-header--main" data-cy="main-header">
    <!-- Top of the page, above the logo and menus -->
    <!-- eslint-disable vue/no-deprecated-slot-attribute -->
    <div slot="top" class="pep-pharos-header__top">
      <div v-if="alert && alert.status" class="px-3 mb-3">
        <pep-pharos-alert :status="alert.status">
          {{ alert.text }}
        </pep-pharos-alert>
      </div>
      <ProviderBar v-if="!isUnauthenticated" :groups="groups" />
      <RequestWarning v-if="showRequestWarning" class="my-3 px-3" />
    </div>
    <!-- eslint-enable vue/no-deprecated-slot-attribute -->

    <!-- Logo -->

    <div slot="start">
      <pep-pharos-link
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
    </div>

    <!-- Search Bar -->

    <div v-if="$route.meta.showSearch && !isUnauthenticated" slot="center" class="mb-3">
      <SearchInput id="main" label="Search" a11y-label="Search" />
    </div>
    <!-- User Information -->

    <div slot="end-top">
      <pep-pharos-dropdown-menu-nav v-if="isAuthenticatedAdmin || isAuthenticatedStudent">
        <pep-pharos-dropdown-menu-nav-link
          data-dropdown-menu-id="user_menu"
          data-dropdown-menu-hover=""
          flex
          href
          @click.prevent.stop
        >
          <span
            ><strong>{{ name }}</strong></span
          >
        </pep-pharos-dropdown-menu-nav-link>

        <!-- Dropdown with user options -->
        <pep-pharos-dropdown-menu id="user_menu">
          <!-- Admins have a logout button -->
          <div v-if="isAuthenticatedAdmin">
            <pep-pharos-dropdown-menu-item @click.prevent="emit('logout')">
              <pep-pharos-dropdown-menu-nav-link subtle>
                <span class="text-capitalize">Logout</span>
              </pep-pharos-dropdown-menu-nav-link>
            </pep-pharos-dropdown-menu-item>
          </div>
          <!-- Students get a note about the group where they're participating-->
          <div v-else-if="isAuthenticatedStudent">
            <pep-pharos-dropdown-menu-item>
              <pep-pharos-dropdown-menu-nav-link subtle>
                <span>Participating through {{ groups }}</span>
              </pep-pharos-dropdown-menu-nav-link>
            </pep-pharos-dropdown-menu-item>
          </div>
        </pep-pharos-dropdown-menu>
      </pep-pharos-dropdown-menu-nav>
      <div v-if="showLogin">
        <pep-pharos-button v-if="showLogin" name="login-button" :href="loginUrl" class="">
          Log in
        </pep-pharos-button>
      </div>
    </div>
    <!-- Navigation Menu -->

    <div slot="end-bottom" class="hidden-md">
      <NavigationMenu :key="updateKey" :show-login="showLogin" />
    </div>
  </pep-pharos-header>
</template>

<style scoped lang="scss">
.pep-pharos-header {
  .pep-pharos-header__top {
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
}
</style>
