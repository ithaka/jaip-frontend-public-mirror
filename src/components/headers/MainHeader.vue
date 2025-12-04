<script setup lang="ts">
import NavigationMenu from '@/components/headers/NavigationMenu.vue'
import ProviderBar from '@/components/headers/ProviderBar.vue'
import SearchInput from '@/components/SearchInput.vue'
import RequestWarning from '@/components/headers/RequestWarning.vue'
import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
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
})
const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const emit = defineEmits(['logout', 'close'])
</script>
<template>
  <pep-pharos-header class="main-header" data-cy="main-header">
    <!-- Top of the page, above the logo and menus -->
    <div slot="top" class="main-header__top">
      <ProviderBar
        :groups="groups"
        :is-admin-subdomain="isAdminSubdomain"
        :is-authenticated-admin="isAuthenticatedAdmin"
        :is-authenticated-student="isAuthenticatedStudent"
        :login-url="loginUrl"
      />
      <RequestWarning v-if="showRequestWarning" class="my-3 px-3" />
    </div>

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
        <pep-pharos-dropdown-menu-nav-category
          id="user-category"
          data-dropdown-menu-id="user-menu"
          data-dropdown-menu-hover=""
        >
          <span slot="category">{{ name }}</span>
        </pep-pharos-dropdown-menu-nav-category>
        <!-- Dropdown with user options -->
        <pep-pharos-dropdown-menu id="user-menu" a11y-label="User menu" data-dropdown-menu-hover="">
          <pep-pharos-dropdown-menu-item
            v-if="isAuthenticatedAdmin"
            href
            @click.prevent="emit('logout')"
          >
            Logout
          </pep-pharos-dropdown-menu-item>
          <pep-pharos-dropdown-menu-item v-else-if="isAuthenticatedStudent" href>
            Participating through {{ groups }}
          </pep-pharos-dropdown-menu-item>
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
.main-header {
  &__top {
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
