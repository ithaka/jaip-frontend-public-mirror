<script setup lang="ts">
defineProps<{
  label: string
  href?: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <div class="back-link">
    <pep-pharos-link flex class="back-link__link" :href="href" @click="emit('click', $event)">
      <pep-pharos-icon class="back-link__icon" name="arrow-left" a11y-hidden="true" />
      {{ label }}
    </pep-pharos-link>
  </div>
</template>

<style lang="scss" scoped>
.back-link {
  display: flex;
  align-items: center;
  margin-bottom: var(--pharos-spacing-one-and-a-half-x);

  &__link {
    gap: var(--pharos-spacing-one-half-x);
  }
}
</style>
