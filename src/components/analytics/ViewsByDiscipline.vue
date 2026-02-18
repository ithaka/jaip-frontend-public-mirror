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

const chartKey = computed(() => {
  const seriesLength = data.value?.series?.length || 0
  return `${isExpanded.value ? 'expanded' : 'collapsed'}-${selectedTimePeriod.value}-${seriesLength}`
})

const chartHeight = computed(() => (isExpanded.value ? '1000px' : '400px'))

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

const totalDisciplineCount = computed(() => {
  const metric = metricData.value
  if (!metric || !metric.series) {
    return 0
  }

  return metric.series.length
})

const showAllDisciplinesLabel = computed(() => {
  const count = totalDisciplineCount.value
  return `Show all ${count} disciplines`
})

const formatCount = (value: number) => new Intl.NumberFormat('en-US').format(value)

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

  const sortedSeriesDesc = [...metric.series].sort((a, b) => {
    const aValue = 'n' in a ? a.n : 0
    const bValue = 'n' in b ? b.n : 0
    return bValue - aValue
  })

  const highestSeries = isExpanded.value ? sortedSeriesDesc : sortedSeriesDesc.slice(0, 10)
  const displaySeries = [...highestSeries].reverse()

  return {
    ...metric,
    series: displaySeries,
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
      domain: data.value?.series
        .map((item) => ('bucket' in item ? item.bucket : ''))
        .filter((bucket) => bucket.length > 0),
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
  tooltip: {
    groupLabel: '',
    customHTML: (_data: unknown, _defaultHTML: string, datum: Record<string, unknown>) => {
      const discipline = typeof datum?.bucket === 'string' ? datum.bucket : ''
      const count = typeof datum?.n === 'number' ? datum.n : 0

      return `
        <div>
          <p><strong>Discipline:</strong> ${discipline}</p>
          <p><strong>Number of items:</strong> ${formatCount(count)}</p>
        </div>
      `
    },
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
  height: chartHeight.value,
}))
</script>
<template>
  <div
    class="analytics__chart-container--expandable"
    :class="isExpanded ? 'analytics__chart-container--tall' : 'analytics__chart-container--short'"
  >
    <div v-if="data">
      <CcvSimpleBarChart :key="chartKey" :data="data.series" :options="options" />
      <div class="analytics__expand-button-wrap">
        <pep-pharos-button
          class="analytics__expand-button"
          variant="secondary"
          @click="isExpanded = !isExpanded"
          >{{ isExpanded ? 'Show less' : showAllDisciplinesLabel }}
        </pep-pharos-button>
      </div>
    </div>
    <div v-else class="analytics__chart-container--no-data">
      <p class="analytics__error-title">Views by discipline</p>
      <img :src="NoDataViewsByDisciplineSvg" alt="No data available for views by discipline" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.analytics__chart-container--expandable {
  :deep(.cds--cc--title text) {
    font-family: var(--pharos-font-family-sans-serif);
    font-weight: var(--pharos-font-weight-bold);
  }

  :deep(.cc--title text) {
    font-family: var(--pharos-font-family-sans-serif);
    font-weight: var(--pharos-font-weight-bold);
  }

  :deep(.cds--cc--chart-wrapper svg text:not(.title)),
  :deep(.cc--chart-wrapper svg text:not(.title)) {
    fill: var(--pharos-color-marble-gray-10) !important;
    color: var(--pharos-color-marble-gray-10) !important;
  }
}

.analytics__chart-container--expandable {
  padding: var(--pharos-spacing-2-x);
  border: 2px solid var(--pharos-color-marble-gray-80);
  border-radius: 0.25rem;
  position: relative;
  min-height: 400px;

  &.analytics__chart-container--short {
    min-height: 400px;
  }

  &.analytics__chart-container--tall {
    min-height: 1000px;
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

.analytics__expand-button-wrap {
  text-align: center;
  margin-top: var(--pharos-spacing-2-x);
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
