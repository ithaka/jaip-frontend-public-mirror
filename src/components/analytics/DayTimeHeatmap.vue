<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType, TimeOfDayDataPoint } from '@/interfaces/Analytics'
import { formatAnalyticsCount, downloadIconSvg } from '@/utils/analytics'
import { downloadCsvFile } from '@/utils/csv'
import { capitalizeFirstLetter } from '@/utils/helpers'
import NoDataDayTimeHeatmapSvg from '@/assets/images/no-data-day-time-heatmap.svg'
import InfoInverseSvg from '@/assets/images/info-inverse.svg'

const props = defineProps<{
  metricType: AnalyticsMetricType
  groupId: string
}>()

const analyticsStore = useAnalyticsStore()

/**
 * Formats raw metric data for download as CSV, ensuring consistent formatting of day, time, and count values.
 * @returns {void} Triggers download of a CSV file with formatted data.
 */
const downloadCsv = (): void => {
  if (!data.value?.series?.length) {
    return
  }

  const header = ['Day', 'Time of day', 'Number of items']
  const rows = data.value.series.map((item) => {
    const day = 'day' in item ? item.day : ''
    const time = 'time' in item ? item.time : ''
    const count = 'value' in item && typeof item.value === 'number' ? item.value : 0
    return [day, time, formatAnalyticsCount(count)]
  })

  downloadCsvFile('views-by-time-of-day.csv', header, rows)
}

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
      time: capitalizeFirstLetter(item.time),
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
  title: '',
  axes: {
    top: {
      mapsTo: 'day',
      scaleType: 'labels',
      domain: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    left: {
      mapsTo: 'time',
      scaleType: 'labels',
      domain: ['Night', 'Evening', 'Afternoon', 'Morning'],
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
  tooltip: {
    groupLabel: '',
    customHTML: (_data: unknown, _defaultHTML: string, datum: Record<string, unknown>) => {
      const day = typeof datum?.day === 'string' ? datum.day : ''
      const time = typeof datum?.time === 'string' ? datum.time : ''
      const count = typeof datum?.value === 'number' ? datum.value : 0

      return `
        <div>
          <p><strong>Day:</strong> ${day}</p>
          <p><strong>Time of day:</strong> ${time}</p>
          <p><strong>Number of items:</strong> ${formatAnalyticsCount(count)}</p>
        </div>
      `
    },
  },
  toolbar: {
    enabled: true,
    numberOfIcons: 2,
    controls: [
      {
        type: 'Custom',
        title: 'Download (CSV)',
        text: 'Download (CSV)',
        iconSVG: {
          content: downloadIconSvg,
          width: '28px',
          height: '28px',
        },
        clickFunction: downloadCsv,
      },
    ],
  },
  accessibility: {
    svgAriaLabel:
      'Heatmap showing patterns of use by time of day. Download csv to view tabular data.',
  },
  height: '400px',
}))

const chart = useTemplateRef('chart')
defineExpose({
  chart,
})
</script>
<template>
  <div class="analytics__chart-container" :class="{ '': !data }">
    <template v-if="data">
      <div class="analytics__chart-header">
        <p class="analytics__chart-title">Patterns of use</p>
        <div class="analytics__chart-info">
          <button
            class="analytics__chart-info-trigger"
            type="button"
            aria-label="More information about patterns of use"
            aria-describedby="patterns-of-use-info-tooltip"
          >
            <img :src="InfoInverseSvg" alt="" />
          </button>
          <div
            id="patterns-of-use-info-tooltip"
            class="analytics__chart-info-tooltip"
            role="tooltip"
          >
            Item access by hour of the day:
            <ul>
              <li><strong>Morning:</strong>0-6</li>
              <li><strong>Afternoon:</strong>6-12</li>
              <li><strong>Evening:</strong>12-18</li>
              <li><strong>Night:</strong>18-24</li>
            </ul>
          </div>
        </div>
      </div>
      <CcvHeatmapChart ref="chart" :data="data.series" :options="options" />
    </template>
    <div v-else class="analytics__chart-container--no-data">
      <p class="analytics__error-title">Views by time of day</p>
      <img :src="NoDataDayTimeHeatmapSvg" alt="No data available for views by time of day" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.analytics__chart-container {
  border-radius: 0.25rem;

  .analytics__chart-header {
    display: flex;
    align-items: center;
    gap: var(--pharos-spacing-one-half-x);
    margin-bottom: var(--pharos-spacing-one-half-x);
  }

  .analytics__chart-title {
    margin: 0;
    color: var(--cds-text-primary);
    font-size: 16px;
    font-family: var(--cds-charts-font-family);
    font-weight: 600;
  }

  .analytics__chart-info {
    position: relative;
    display: inline-flex;
    align-items: center;

    &:hover .analytics__chart-info-tooltip,
    &:focus-within .analytics__chart-info-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
  }

  .analytics__chart-info-trigger {
    border: 0;
    background: transparent;
    padding: 0;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .analytics__chart-info-trigger img {
    width: 1rem;
    height: 1rem;
    display: block;
  }

  .analytics__chart-info-tooltip {
    position: absolute;
    bottom: calc(100% + var(--pharos-spacing-one-half-x));
    left: 50%;
    z-index: 10;
    width: 18rem;
    padding: var(--pharos-spacing-one-quarter-x) var(--pharos-spacing-one-half-x);
    border-radius: var(--pharos-radius-base-standard);
    background-color: var(--pharos-tooltip-color-background-base);
    box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.2);
    color: var(--pharos-tooltip-color-text-base);
    font-family: var(--pharos-font-family-sans-serif);
    font-size: var(--pharos-tooltip-size-text-base);
    font-weight: var(--pharos-font-weight-regular);
    letter-spacing: calc(var(--pharos-tooltip-size-text-base) * -0.02);
    line-height: var(--pharos-line-height-small);
    white-space: normal;
    opacity: 0;
    visibility: hidden;
    transform: translateX(-50%) translateY(var(--pharos-spacing-one-quarter-x));
    transition:
      opacity 120ms ease,
      visibility 120ms ease,
      transform 120ms ease;
    pointer-events: none;
  }

  .analytics__chart-info-tooltip::before {
    content: '';
    position: absolute;
    bottom: calc(-1 * var(--pharos-spacing-one-quarter-x));
    left: 50%;
    width: 0.5rem;
    height: 0.5rem;
    background-color: var(--pharos-tooltip-color-background-base);
    transform: translateX(-50%) rotate(45deg);
  }

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
