<script setup lang="ts">
import { computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType, TimeOfDayDataPoint } from '@/interfaces/Analytics'
import NoDataDayTimeHeatmapSvg from '@/assets/images/no-data-day-time-heatmap.svg'

const props = defineProps<{
  metricType: AnalyticsMetricType
  groupId: string
}>()

const analyticsStore = useAnalyticsStore()

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

  return (metric.series as TimeOfDayDataPoint[]).every((item) => item.value === 0)
})

/**
 * Transforms metric data for heatmap visualization, replacing 0 with null.
 * Null values display as striped patterns to differentiate from low values.
 * @returns {Object|null} Transformed analytics data or null if no data to display
 */
const data = computed(() => {
  if (showNoData.value) return null

  const metric = metricData.value
  if (!metric) return null

  return {
    ...metric,
    series: (metric.series as TimeOfDayDataPoint[]).map((item: TimeOfDayDataPoint) => ({
      ...item,
      value: item.value === 0 ? null : item.value,
    })),
  }
})

/**
 * Generates chart options with gradient color scale and heatmap configuration.
 * Uses glacier blue gradient from light to dark to represent low to high values.
 * @returns {Object} Heatmap chart configuration options
 */
const options = computed(() => ({
  title: 'Patterns of use by time of day',
  axes: {
    top: {
      mapsTo: 'time',
      scaleType: 'labels',
      domain: ['morning', 'afternoon', 'evening', 'night'],
    },
    left: {
      mapsTo: 'day',
      scaleType: 'labels',
      domain: ['Sunday', 'Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday'],
    },
  },
  color: {
    gradient: {
      enabled: true,
      colors: [
        'hsl(186.3, 37.3%, 90%)',
        'hsl(188, 47%, 80%)',
        'hsl(187, 75%, 70%)',
        'hsl(190, 89%, 39%)',
        'hsl(190, 80%, 32%)',
        'hsl(219, 82%, 15%)',
      ],
    },
  },
  heatmap: {
    colorLegend: {
      title: 'Low to High',
      type: 'quantize',
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
  accessibility: {
    svgAriaLabel:
      'Heatmap showing patterns of use by time of day. Download csv to view tabular data.',
  },
  height: '400px',
}))
</script>
<template>
  <div class="analytics__chart-container" :class="{ '': !data }">
    <CcvHeatmapChart v-if="data" :data="data.series" :options />
    <div v-else class="analytics__chart-container--no-data">
      <p class="analytics__error-title">Patterns of use by time of day</p>
      <img
        :src="NoDataDayTimeHeatmapSvg"
        alt="No data available for patterns of use by time of day"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
