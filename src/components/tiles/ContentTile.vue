<script setup lang="ts">
import { useLogger } from '@/composables/logging/useLogger'

withDefaults(
  defineProps<{
    arrowA11yTitle?: string
    href?: string
  }>(),
  {
    arrowA11yTitle: 'View item',
    href: '#',
  },
)

const { handleWithLog, logs } = useLogger()
const { tileClickLog } = logs.getTileLogs()
</script>

<template>
  <a
    class="content-tile"
    data-cy="content-card"
    :href="href"
    @click="handleWithLog(tileClickLog(href))"
  >
    <div class="content-tile__title-icon">
      <slot name="title-icon" />
    </div>

    <pep-pharos-heading preset="2" :level="3" class="content-tile__title">
      <slot name="title-text" />
    </pep-pharos-heading>

    <p class="content-tile__text">
      <slot name="body-text" />
    </p>

    <pep-pharos-icon name="arrow-right" :a11y-title="arrowA11yTitle" class="content-tile__arrow" />
  </a>
</template>

<style lang="scss" scoped>
.content-tile {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  padding: var(--pharos-spacing-1-x) var(--pharos-spacing-one-and-a-half-x);
  background-color: white;
  border: 1px solid var(--pharos-color-ui-40);
  border-radius: var(--pharos-radius-base-standard);
  color: var(--pharos-color-marble-gray-50);
  cursor: pointer;
  text-decoration: none;

  &:hover {
    border-color: var(--pharos-color-interactive-primary);
    background-color: var(--pharos-color-marble-gray-97);

    .content-tile__title {
      color: var(--pharos-color-jstor-red);
    }
  }

  &:focus,
  &:focus-visible {
    outline: 1px solid var(--pharos-color-focus);
    outline-offset: -1px;
  }

  &__title-icon {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }

  &__title {
    color: var(--pharos-color-black);
  }

  &__title-icon :deep(pep-pharos-icon),
  &__arrow {
    fill: var(--pharos-color-black);
  }

  &__arrow {
    margin-top: auto;
    align-self: flex-end;
  }
}
</style>
