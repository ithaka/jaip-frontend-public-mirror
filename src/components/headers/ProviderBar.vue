<script setup lang="ts">
defineProps({
  groups: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <pep-pharos-dropdown-menu-nav-link
    data-dropdown-menu-id="top-menu"
    data-dropdown-menu-hover=""
    subtle
    flex
    no-hover
    class="display-flex justify-content-center full-width"
  >
    <small>
      <span>Access provided by&nbsp;</span>
      <span
        ><strong>{{ groups }}</strong></span
      >
    </small>
  </pep-pharos-dropdown-menu-nav-link>
  <!-- Dropdown box with additional information -->
  <pep-pharos-dropdown-menu id="top-menu" placement="bottom" tabindex="-1">
    <div class="pa-5">
      <p>In partnership with the JSTOR Access in Prisons Initiative</p>
    </div>
  </pep-pharos-dropdown-menu>
</template>

<style scoped lang="scss"></style>
