<script setup lang="ts">
import type { History } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'
import ResultsTableHeaders from '@/components/results/ResultsTableHeaders.vue'
import ResultsTableRow from '@/components/results/ResultsTableRow.vue'

defineProps({
  history: {
    type: [] as PropType<History[]>,
    required: true,
  },
  scope: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <table class="full-width">
    <ResultsTableHeaders :is-global="scope === 'global'" />
    <ResultsTableRow
      v-for="(hist, index) in history"
      :key="`${scope}_history_${index}`"
      :class="{ 'background-color-gray-94': index % 2 === 0 }"
      :history="hist"
      :is-global="scope === 'global'"
    />
  </table>
</template>
