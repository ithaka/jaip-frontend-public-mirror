<script setup lang="ts">
import { formatDisplayNumbers } from '@/utils/helpers'

defineProps<{
  name: string
  value: number
}>()
</script>
<template>
  <div class="data-box" role="region" :aria-label="`Data box for ${name}`">
    <p class="data-box__name">{{ name }}</p>
    <pep-pharos-heading :preset="5">{{ formatDisplayNumbers(value) }}</pep-pharos-heading>
  </div>
</template>

<style lang="scss" scoped>
.data-box {
  border: 2px solid var(--pharos-color-marble-gray-80);
  border-radius: var(--pharos-radius-base-standard);
  padding: var(--pharos-spacing-2-x);
  text-align: left;
  background-color: var(--pharos-color-marble-gray-97);
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;

  /* Tablet: 768px to 1055px */
  @media (min-width: 768px) and (max-width: 1055px) {
    padding: var(--pharos-spacing-1-x);
  }

  &__name {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }
}
</style>
