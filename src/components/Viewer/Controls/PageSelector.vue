<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps({
  pageCount: {
    type: Number,
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update-page'])

const page = ref(props.currentPage)

/**
 * Submits the current page number if it is valid.
 * Resets the input to the current page if the input is invalid.
 */
const submitPage = () => {
  const pageNumber = Number(page.value)
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > props.pageCount) {
    page.value = props.currentPage
    return
  }
  emit('update-page', page.value)
}
</script>
<template>
  <div v-if="pageCount > 1" class="page-selector">
    <input
      v-model="page"
      inputmode="numeric"
      aria-label="Page number"
      name="select-page"
      class="page-selector__input"
      @keydown.enter="submitPage"
      @focusout="submitPage"
    />/ {{ pageCount }}
  </div>
</template>
<style lang="scss" scoped>
.page-selector {
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  &__input {
    &:focus {
      outline: 2px solid var(--pharos-color-focus);
      outline-offset: 2px;
    }
    background-color: var(--pharos-color-marble-gray-20);
    border-radius: 2px;
    border-style: none;
    color: var(--pharos-color-white);
    height: 28px;
    width: 28px;
    text-align: center;
  }
}
</style>
