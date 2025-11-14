<script setup lang="ts">
import SkipToDestination from '@/components/SkipToDestination.vue'

defineProps({
  groups: {
    type: String,
    default: '',
  },
  isAdminSubdomain: {
    type: Boolean,
    default: false,
  },
  isAuthenticatedAdmin: {
    type: Boolean,
    default: false,
  },
  isAuthenticatedStudent: {
    type: Boolean,
    default: false,
  },
  loginUrl: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="provider-bar">
    <SkipToDestination target="main-content"> Skip to main content </SkipToDestination>
    <pep-pharos-dropdown-menu-nav-category
      id="top-menu-category"
      data-dropdown-menu-id="top-menu"
      data-dropdown-menu-hover=""
      subtle
      flex
      no-hover
      class="provider-bar__nav-category"
    >
      <span slot="category" class="provider-bar__category">
        <small v-if="isAuthenticatedAdmin || isAuthenticatedStudent" class="provider-bar__text">
          <span>Access provided by&nbsp;</span>
          <span class="provider-bar__groups">
            <strong>{{ groups }}</strong>
          </span>
        </small>
        <small v-else-if="isAdminSubdomain && !isAuthenticatedAdmin" class="provider-bar__text">
          <span>Have facility access?&nbsp;</span>
          <pep-pharos-link :href="loginUrl" class="provider-bar__login-link"
            >Log in</pep-pharos-link
          >
        </small>
        <small v-else class="provider-bar__text">
          <span>You do not have access at this facility.</span>
        </small>
      </span>
    </pep-pharos-dropdown-menu-nav-category>
    <!-- Dropdown box with additional information -->
    <pep-pharos-dropdown-menu
      id="top-menu"
      placement="bottom"
      tabindex="-1"
      data-dropdown-menu-hover=""
    >
      <div class="provider-bar__dropdown-content">
        <p>In partnership with the JSTOR Access in Prison Initiative</p>
      </div>
    </pep-pharos-dropdown-menu>
  </div>
</template>

<style scoped lang="scss">
.provider-bar {
  &__nav-category {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  &__category {
    padding: 0;
    margin: 0;
  }

  &__login-link {
    text-decoration: underline;
  }

  &__dropdown-content {
    padding: var(--pharos-spacing-5-x);
  }
}
</style>
