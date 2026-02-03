<script setup lang="ts">
import { formatDisplayNumbers } from '@/utils/helpers'

defineProps<{
  name: string
  value: number
}>()
</script>
<template>
  <div class="data-card data-box" role="region" :aria-label="`Data box for ${name}`">
    <p class="data-card__label">{{ name }}</p>
    <pep-pharos-heading :preset="5">{{ formatDisplayNumbers(value) }}</pep-pharos-heading>
  </div>
</template>

<style lang="scss" scoped>
.data-card {
  padding: var(--pharos-spacing-2-x);
  border: 2px solid var(--pharos-color-marble-gray-80);
  border-radius: var(--pharos-radius-base-standard);
  background-color: var(--pharos-color-marble-gray-97);

  @media (min-width: 768px) and (max-width: 1055px) {
    padding: var(--pharos-spacing-1-x);
  }

  &__label {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }
}

.data-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
