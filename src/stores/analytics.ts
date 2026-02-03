import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  TimePeriod,
  AnalyticsData,
  AnalyticsMetricType,
  AnalyticsMetric,
  TimeOfDayAnalyticsMetric,
  MediaReviewAnalyticsMetric,
} from '@/interfaces/Analytics'
import { test_disciplines, test_media_reviews } from '@/interfaces/Analytics'

export const useAnalyticsStore = defineStore('analytics', () => {
  const selectedTimePeriod = ref<TimePeriod>('days_30')
  const analyticsDataByGroupId = ref<Record<string, AnalyticsData>>({})
  const lastExported = ref<string | null>(null)

  /**
   * Returns new metrics with each series sorted by `n` in descending order.
   * @param metrics - Analytics metrics to sort.
   * @returns New metrics with sorted series arrays.
   */
  function sortSeriesDescending(metrics: AnalyticsMetric[]): AnalyticsMetric[] {
    return metrics.map((metric) => ({
      ...metric,
      series: [...metric.series].sort((a, b) => a.n - b.n),
    }))
  }

  function setSelectedTimePeriod(period: TimePeriod) {
    selectedTimePeriod.value = period
  }

  function setAnalyticsData(data: AnalyticsData) {
    // TODO: Remove when discipline analytics are fully implemented
    if (!data.discipline_item_views) {
      data.discipline_item_views = sortSeriesDescending(test_disciplines)
    }
    // TODO: Remove when media review analytics are fully implemented
    if (!data.media_reviews) {
      data.media_reviews = test_media_reviews
    }

    lastExported.value = data.last_exported || null
    analyticsDataByGroupId.value[data.group_id] = data
  }

  function getAnalyticsDataByGroupId(groupId: string): AnalyticsData | undefined {
    const data = analyticsDataByGroupId.value[groupId]
    return data
  }

  function getMetricDataForSelectedTimePeriod(
    metricType: AnalyticsMetricType,
    groupId: string,
  ): AnalyticsMetric | TimeOfDayAnalyticsMetric | MediaReviewAnalyticsMetric | undefined {
    const data = getAnalyticsDataByGroupId(groupId)
    if (!data) return undefined

    const metricArray = data[metricType]
    if (!metricArray || !Array.isArray(metricArray)) return undefined
    return metricArray.find((metric) => metric.time_period === selectedTimePeriod.value)
  }

  function clearAnalyticsData(groupId?: string) {
    if (groupId) {
      delete analyticsDataByGroupId.value[groupId]
    } else {
      analyticsDataByGroupId.value = {}
    }
  }

  function getMetricTotalForSelectedTimePeriod(
    metricType: AnalyticsMetricType,
    groupId: string,
  ): number {
    const data = getAnalyticsDataByGroupId(groupId)
    if (!data) return 0

    const metricArray = data[metricType]
    if (!metricArray || !Array.isArray(metricArray)) return 0
    const metricObj = metricArray.find((metric) => metric.time_period === selectedTimePeriod.value)
    return metricObj ? metricObj.total : 0
  }

  return {
    selectedTimePeriod,
    analyticsDataByGroupId,
    lastExported,
    setSelectedTimePeriod,
    setAnalyticsData,
    getAnalyticsDataByGroupId,
    getMetricDataForSelectedTimePeriod,
    clearAnalyticsData,
    getMetricTotalForSelectedTimePeriod,
  }
})
