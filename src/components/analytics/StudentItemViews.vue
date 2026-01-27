<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType } from '@/interfaces/Analytics'

const props = defineProps<{
  metricType: AnalyticsMetricType
  groupId: string
}>()

const analyticsStore = useAnalyticsStore()
const { selectedTimePeriod } = storeToRefs(analyticsStore)

/**
 * Fetches metric data and transforms bucket strings to Date objects.
 * @returns {Object|null} Transformed analytics data with dates or null if unavailable
 */
const data = computed(() => {
  const metricData = analyticsStore.getMetricDataForSelectedTimePeriod(
    props.metricType,
    props.groupId,
  )
  if (metricData) {
    // Transform the data to convert bucket strings to Date for mapping
    const transformedSeries = metricData.series.map((item) => {
      if ('bucket' in item) {
        return {
          ...item,
          date: new Date(item.bucket),
        }
      }
      return item
    })

    return {
      ...metricData,
      series: transformedSeries,
    }
  } else {
    // TODO: Add empty state and error handling here.
    console.warn(
      'No metric data found for',
      props.metricType,
      'groupId:',
      props.groupId,
      'timePeriod:',
      selectedTimePeriod.value,
    )
    return null
  }
})

// TODO: Substitute date-fns formatting if needed in more places. For now, keeping it simple.
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Formats x-axis tick labels based on time period.
 * Returns empty string for filtered ticks to show tick marks without labels.
 * @returns {Function} Formatter: days_30 (1/15), weeks_365 (Jan 15), months_all_time (Jan YYYY)
 */
const tickFormatter = computed(() => {
  return (val: string | number | Date) => {
    const date = new Date(val)
    const timestamp = date.getTime()

    // Check if this date should show a label
    if (!labelsToShow.value.has(timestamp)) {
      return ''
    }

    const month = MONTH_NAMES[date.getMonth()]
    const year = date.getFullYear().toString()

    switch (selectedTimePeriod.value) {
      case 'days_30':
        return `${month} ${date.getDate()}`
      case 'weeks_365':
        return `${month} ${date.getDate()}`
      case 'months_all_time':
        return `${month} ${year}`
      default:
        return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }
})

/**
 * Extracts dates from series for x-axis ticks.
 * @returns {Date[]} Array of all dates
 */
const tickValues = computed(() => {
  return (
    data.value?.series
      .map((item) => ('date' in item ? item.date : null))
      .filter((d): d is Date => d !== null) || []
  )
})

/**
 * Set of date timestamps that should display labels (not just tick marks).
 * For weeks_365: every 2nd date, for months_all_time: every 3rd date.
 */
const labelsToShow = computed(() => {
  const dates = tickValues.value
  const timestamps = new Set<number>()

  if (selectedTimePeriod.value === 'months_all_time') {
    dates.forEach((date, index) => {
      if (index % 3 === 0) {
        timestamps.add(date.getTime())
      }
    })
  } else if (selectedTimePeriod.value === 'weeks_365') {
    dates.forEach((date, index) => {
      if (index % 2 === 0) {
        timestamps.add(date.getTime())
      }
    })
  } else {
    // For days_30, show all labels
    dates.forEach((date) => timestamps.add(date.getTime()))
  }

  return timestamps
})

const areaOptions = computed(() => ({
  title: 'Views over time',
  axes: {
    bottom: {
      mapsTo: 'date',
      title: 'Date',
      scaleType: 'time',
      ticks: {
        values: tickValues.value,
        formatter: tickFormatter.value,
      },
    },
    left: {
      mapsTo: 'n',
      title: 'Number of items',
      scaleType: 'linear',
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
  toolbar: {
    enabled: false,
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
  legend: {
    enabled: false,
  },
  tooltip: {
    groupLabel: '',
  },
  points: {
    enabled: true,
    radius: 4,
  },
  getFillColor: () => '#0ba2c0',
  getStrokeColor: () => '#0ba2c0',
  accessibility: { svgAriaLabel: 'Views over time' },
}))
</script>

<template>
  <div class="analytics__chart-container">
    <CcvAreaChart v-if="data" :data="data.series" :options="areaOptions" />
  </div>
</template>

<style lang="scss" scoped>
.analytics__chart-container {
  .chart-error {
    padding: var(--pharos-spacing-2-x);
    background: #f0f0f0;
    border: 1px dashed #ccc;
    text-align: center;
    color: #666;
  }
}
</style>
