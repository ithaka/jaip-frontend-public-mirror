<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType } from '@/interfaces/Analytics'

const props = defineProps<{
  metricType: AnalyticsMetricType
  groupId: string
}>()

const analyticsStore = useAnalyticsStore()
const { selectedTimePeriod } = storeToRefs(analyticsStore)

const isExpanded = ref(false)

/**
 * Resets expanded state when time period changes to collapse the chart.
 */
watch(selectedTimePeriod, () => {
  isExpanded.value = false
})

/**
 * Fetches metric data and limits series to top 10 items when not expanded.
 * @returns {Object|null} Analytics data with limited or full series or null if unavailable
 */
const data = computed(() => {
  const metricData = analyticsStore.getMetricDataForSelectedTimePeriod(
    props.metricType,
    props.groupId,
  )
  if (!metricData) return null

  const limitedSeries = isExpanded.value ? metricData.series : metricData.series.slice(0, 10)

  return {
    ...metricData,
    series: limitedSeries,
  }
})

/**
 * Generates chart options with dynamic height and title based on expanded state.
 * @returns {Object} Chart configuration options
 */
const options = computed(() => ({
  title: 'Views by discipline',
  axes: {
    left: {
      mapsTo: 'bucket',
      scaleType: 'labels',
    },
    bottom: {
      mapsTo: 'n',
      scaleType: 'linear',
      title: 'Number of items',
    },
  },
  grid: {
    x: {
      enabled: true,
      alignwithAxisTicks: true,
    },
    y: {
      enabled: true,
      alignwithAxisTicks: true,
    },
  },
  getFillColor: () => '#0ba2c0',
  getStrokeColor: () => '#0ba2c0',
  accessibility: { svgAriaLabel: 'Views by discipline. Download CSV to view tabular data.' },
  legend: {
    enabled: false,
  },
  toolbar: {
    enabled: true,
    numberOfIcons: 1,
    controls: [
      {
        type: 'Export as PNG',
      },
      {
        type: 'Export as CSV',
      },
    ],
  },
  height: isExpanded.value ? 1000 : 300,
}))
</script>
<template>
  <div
    class="analytics__chart-container--expandable"
    :class="isExpanded ? 'analytics__chart-container--tall' : 'analytics__chart-container--short'"
  >
    <CcvSimpleBarChart v-if="data" :data="data.series" :options />
    <pep-pharos-button
      class="analytics__expand-button"
      variant="secondary"
      @click="isExpanded = !isExpanded"
      >{{ isExpanded ? 'Hide most disciplines' : 'Show all disciplines' }}
    </pep-pharos-button>
  </div>
</template>
<style lang="scss" scoped>
.analytics__chart-container--expandable {
  padding: var(--pharos-spacing-2-x) var(--pharos-spacing-2-x) var(--pharos-spacing-3-x);
  border: 2px solid var(--pharos-color-marble-gray-80);
  border-radius: var(--pharos-radius-base-standard);
  min-height: 300px;

  &.analytics__chart-container--short {
    height: 400px;
  }

  &.analytics__chart-container--tall {
    height: 1000px;
  }

  :deep(.cc--chart-holder) {
    width: 100% !important;
  }
}
</style>
