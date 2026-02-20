<script setup lang="ts">
import NoDataYetSvg from '@/assets/images/no-data-yet.svg'
</script>
<template>
  <div class="analytics__chart-container analytics__chart-container--unavailable">
    <img :src="NoDataYetSvg" alt="No data yet" />
  </div>
</template>

<style lang="scss" scoped>
.analytics__chart-container--unavailable {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>
