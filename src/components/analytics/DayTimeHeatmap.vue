<script setup lang="ts">
import { computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType, TimeOfDayDataPoint } from '@/interfaces/Analytics'

const props = defineProps<{
  metricType: AnalyticsMetricType
  groupId: string
}>()

const analyticsStore = useAnalyticsStore()

/**
 * Fetches metric data and transforms values to replace 0 with null for heatmap visualization.
 * Null values display as striped patterns to differentiate from low values.
 * @returns {Object|null} Transformed analytics data with null for zero values or null if unavailable
 */
const data = computed(() => {
  const metricData = analyticsStore.getMetricDataForSelectedTimePeriod(
    props.metricType,
    props.groupId,
  )
  if (metricData) {
    return {
      ...metricData,
      series: (metricData.series as TimeOfDayDataPoint[]).map((item: TimeOfDayDataPoint) => ({
        ...item,
        value: item.value === 0 ? null : item.value,
      })),
    }
  } else {
    console.warn('No metric data found for', props.metricType, 'groupId:', props.groupId)
    return null
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
  <div class="analytics__chart-container">
    <CcvHeatmapChart v-if="data" :data="data.series" :options />
  </div>
</template>
