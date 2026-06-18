<script setup lang="ts">
import { useLogger } from '@/composables/logging/useLogger'

const props = withDefaults(
  defineProps<{
    keyImg: string
    href?: string
  }>(),
  {
    href: '#',
  },
)

const { handleWithLog, logs } = useLogger()
const { tileClickLog } = logs.getTileLogs()
console.log('props', props, props.href)
</script>

<template>
  <div class="image-tile" data-cy="image-card">
    <img v-if="props.keyImg" class="image-tile__image" :src="props.keyImg" alt="" />

    <div class="image-tile__content">
      <p class="image-tile__text">
        <slot name="body-text" />
      </p>

      <pep-pharos-button
        variant="primary"
        class="image-tile__button"
        :href="props.href"
        @click="handleWithLog(tileClickLog(props.href))"
      >
        <slot name="button-text"></slot>
      </pep-pharos-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.image-tile {
  position: relative;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  min-height: 200px;
  z-index: 0;
  overflow: hidden;
  color: var(--pharos-color-black);
  text-decoration: none;
  background: var(--pharos-color-white);

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    width: min(100%, 280px);
    max-width: 100%;
    margin-top: var(--pharos-spacing-1-x);
    padding: var(--pharos-spacing-1-x);
    background: rgb(255 255 255 / 95%);
    border: 1px solid var(--pharos-color-ui-30);
    box-shadow: var(--pharos-elevation-level-3);
  }

  &__button {
    margin-top: var(--pharos-spacing-one-half-x);
  }

  &__image {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    filter: blur(2px);
    object-fit: contain;
    object-position: center center;
  }

  &__text {
    margin: 0;
    text-align: center;
  }

  @media (min-width: 68rem) {
    min-height: 280px;
  }
}
</style>
