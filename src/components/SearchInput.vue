<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

defineProps({
  id: {
    type: String,
    default: 'search',
  },
  variant: {
    type: String,
    default: 'primary',
  },
  placeholder: {
    type: String,
    default: 'Search journals, books, and research reports',
  },
  label: {
    type: String,
    default: '',
  },
})

const searchStore = useSearchStore()
const { searchTerms } = storeToRefs(searchStore)

const router = useRouter()
const handleSubmit = () => {
  router.push({
    path: '/search',
    query: {
      term: searchTerms.value,
      page: 1,
    },
  })
}
</script>

<template>
  <form @submit.prevent.stop="handleSubmit">
    <pep-pharos-input-group
      :id="`${id}_search`"
      :value="searchTerms"
      :placeholder="placeholder"
      :variant="variant"
      :name="`${id}_search`"
      @input="searchTerms = $event.target.value"
    >
      <span v-if="label" slot="label">{{ label }}</span>
      <pep-pharos-button
        name="search-button"
        icon="search"
        variant="subtle"
        label="search"
        a11y-label="search"
        type="submit"
      />
    </pep-pharos-input-group>
  </form>
</template>
