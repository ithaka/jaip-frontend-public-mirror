<script setup lang="ts">
import DashboardUnavailableSvg from '@/assets/images/dashboard-unavailable.svg'
defineEmits(['reload'])
</script>
<template>
  <div class="analytics__chart-container analytics__chart-container--unavailable">
    <img :src="DashboardUnavailableSvg" alt="Dashboard Unavailable" />
    <pep-pharos-button
      variant="primary"
      size="medium"
      class="analytics__reload-button"
      @click="$emit('reload')"
    >
      Reload
    </pep-pharos-button>
  </div>
</template>

<style lang="scss" scoped>
.analytics__chart-container--unavailable {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;

  .analytics__reload-button {
    margin-top: var(--pharos-spacing-1-x);
  }
}
</style>
