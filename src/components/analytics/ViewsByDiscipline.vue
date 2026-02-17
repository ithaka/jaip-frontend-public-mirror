<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType } from '@/interfaces/Analytics'
import NoDataViewsByDisciplineSvg from '@/assets/images/no-data-views-by-discipline.svg'

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
 * Retrieves raw metric data from the analytics store.
 * Cached to prevent duplicate store lookups.
 */
const metricData = computed(() => {
  return analyticsStore.getMetricDataForSelectedTimePeriod(props.metricType, props.groupId)
})

/**
 * Determines if no meaningful data exists to display.
 * Returns true if metric data is missing, empty, or all values are zero.
 */
const showNoData = computed(() => {
  const metric = metricData.value

  if (!metric || !metric.series || metric.series.length === 0) {
    return true
  }

  return metric.series.every((item) => {
    const value = 'n' in item ? item.n : 0
    return value === 0
  })
})

/**
 * Transforms metric data and limits series to top 10 items when not expanded.
 * @returns {Object|null} Analytics data with limited or full series or null if no data to display
 */
const data = computed(() => {
  if (showNoData.value) return null

  const metric = metricData.value
  if (!metric) return null

  const limitedSeries = isExpanded.value ? metric.series : metric.series.slice(0, 10)

  return {
    ...metric,
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
    <div v-if="data">
      <CcvSimpleBarChart :data="data.series" :options />
      <pep-pharos-button
        class="analytics__expand-button"
        variant="secondary"
        @click="isExpanded = !isExpanded"
        >{{ isExpanded ? 'Hide most disciplines' : 'Show all disciplines' }}
      </pep-pharos-button>
    </div>
    <div v-else class="analytics__chart-container--no-data">
      <p class="analytics__error-title">Views by discipline</p>
      <img :src="NoDataViewsByDisciplineSvg" alt="No data available for views by discipline" />
    </div>
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

.analytics__chart-container--no-data {
  display: flex;
  flex-direction: column;
  height: 100%;

  // first child: top-left
  > :first-child {
    align-self: flex-start;
  }

  // second child: centered in remaining space
  > :nth-child(2) {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  img {
    max-width: 360px;
    margin: 0 auto;
  }
}

.analytics__error-title {
  color: var(--cds-text-primary, #161616);
  font-size: 16px;
  font-family: var(--cds-charts-font-family);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 15px;
}
</style>
