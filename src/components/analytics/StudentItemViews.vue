<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType } from '@/interfaces/Analytics'
import NoDataStudentItemViewsSvg from '@/assets/images/no-data-student-item-views.svg'

const props = defineProps<{
  metricType: AnalyticsMetricType
  groupId: string
}>()

const analyticsStore = useAnalyticsStore()
const { selectedTimePeriod } = storeToRefs(analyticsStore)

const MOBILE_TICK_BREAKPOINT = 570
const viewportWidth = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)

const isCompactTickMode = computed(() => viewportWidth.value < MOBILE_TICK_BREAKPOINT)

const handleResize = () => {
  viewportWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
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
 * Transforms metric data for area chart visualization, converting bucket strings to Date objects.
 * @returns {Object|null} Transformed analytics data with dates or null if no data to display
 */
const data = computed(() => {
  if (showNoData.value) return null

  const metric = metricData.value
  if (!metric) return null

  // Transform the data to convert bucket strings to Date for mapping
  const transformedSeries = metric.series.map((item) => {
    if ('bucket' in item) {
      return {
        ...item,
        date: new Date(item.bucket),
      }
    }
    return item
  })

  return {
    ...metric,
    series: transformedSeries,
  }
})

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

const formatCount = (value: number) => new Intl.NumberFormat('en-US').format(value)

const formatTooltipDate = (value: unknown) => {
  const date = value instanceof Date ? value : new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const month = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  if (selectedTimePeriod.value === 'months_all_time') {
    return `${month} ${year}`
  }

  return `${month} ${day}, ${year}`
}

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
      const showEvery = isCompactTickMode.value ? 3 : 2
      if (index % showEvery === 0) {
        timestamps.add(date.getTime())
      }
    })
  } else {
    // For days_30, show every day by default; every other day in compact mode
    dates.forEach((date, index) => {
      const showEvery = isCompactTickMode.value ? 2 : 1
      if (index % showEvery === 0) {
        timestamps.add(date.getTime())
      }
    })
  }

  return timestamps
})

const firstVisibleTimestamp = computed(() => {
  return tickValues.value.find((date) => labelsToShow.value.has(date.getTime()))?.getTime() || null
})

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
        if (isCompactTickMode.value) {
          if (timestamp === firstVisibleTimestamp.value) {
            return `${month} ${date.getDate()}`
          }

          return `${date.getDate()}`
        }

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
      title: 'Items',
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
  legend: {
    enabled: false,
  },
  tooltip: {
    groupLabel: '',
    customHTML: (_data: unknown, _defaultHTML: string, datum: Record<string, unknown>) => {
      const dateLabel = formatTooltipDate(datum?.date)
      const count = typeof datum?.n === 'number' ? datum.n : 0

      return `
        <div>
          <p><strong>Date:</strong> ${dateLabel}</p>
          <p><strong>Number of items:</strong> ${formatCount(count)}</p>
        </div>
      `
    },
  },
  points: {
    enabled: true,
    radius: 4,
  },
  getFillColor: () => '#0ba2c0',
  getStrokeColor: () => '#0ba2c0',
  accessibility: { svgAriaLabel: 'Views over time. Download CSV to view tabular data.' },
}))
</script>

<template>
  <div class="analytics__chart-container" :class="{ '': !data }">
    <CcvAreaChart v-if="data" :data="data.series" :options="areaOptions" />
    <div v-else class="analytics__chart-container--no-data">
      <p class="analytics__error-title">Views over time</p>
      <img :src="NoDataStudentItemViewsSvg" alt="No data available for views over time" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.analytics__chart-container {
  border-radius: 0.25rem;

  :deep(.cds--cc--title text),
  :deep(.cc--title text) {
    font-family: var(--pharos-font-family-sans-serif);
    font-weight: var(--pharos-font-weight-bold);
  }

  :deep(.cds--cc--chart-wrapper svg text:not(.title)),
  :deep(.cc--chart-wrapper svg text:not(.title)) {
    fill: var(--pharos-color-marble-gray-10) !important;
    color: var(--pharos-color-marble-gray-10) !important;
  }

  :deep(.ticks .tick-label),
  :deep(.ticks .tick-label--primary),
  :deep(.ticks .tick text) {
    fill: var(--pharos-color-marble-gray-10) !important;
    color: var(--pharos-color-marble-gray-10) !important;
    font-family: var(--pharos-font-family-sans-serif) !important;
    font-weight: var(--pharos-font-weight-regular) !important;
    opacity: 1 !important;
    stroke: none !important;
  }

  :deep(.cds--cc--axes g.axis.bottom .axis-title),
  :deep(.cc--axes g.axis.bottom .axis-title) {
    translate: 0 0.75rem;
  }

  :deep(.cds--cc--axes g.axis.left .axis-title),
  :deep(.cc--axes g.axis.left .axis-title) {
    translate: -0.5rem 0;
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
