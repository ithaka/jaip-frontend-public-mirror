<script setup lang="ts">
import { computed } from 'vue'
import BibliographicalData from '@/components/results/BibliographicalData.vue'
import ResultsTable from '@/components/results/ResultsTable.vue'
import type { SeparateHistories, MediaRecord } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    required: true,
  },
  scope: {
    type: String,
    required: true,
  },
})

const histories = computed(() => {
  const h = {} as SeparateHistories
  if ((props.doc.history || []).length) {
    h.local = props.doc.history || []
  }
  if ((props.doc.national_history || []).length) {
    h.global = props.doc.national_history || []
  }
  return h
})
</script>

<template>
  <div>
    <BibliographicalData :doc="doc" small class="mb-5" />
    <ResultsTable :history="histories[scope].slice().reverse()" :scope="scope" />
  </div>
</template>
