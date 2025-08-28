<script setup lang="ts">
defineProps({
  id: {
    type: String,
    required: true,
  },
})
</script>
<template>
  <pep-pharos-button
    :data-tooltip-id="`restricted-tooltip-${id}`"
    :aria-describedby="`restricted-tooltip-${id}`"
    variant="subtle"
    icon-left="exclamation-inverse"
    role="button"
    tabindex="0"
    class="restricted-label"
  >
    Restricted Item
  </pep-pharos-button>
</template>
<style lang="scss" scoped>
.restricted-label {
  vertical-align: middle;
  display: inline-block;
  margin-left: var(--pharos-spacing-1-x);
}
</style>
