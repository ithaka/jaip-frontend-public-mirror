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

export const useAnalyticsStore = defineStore('analytics', () => {
  const selectedTimePeriod = ref<TimePeriod>('days_30')
  const analyticsDataByGroupId = ref<Record<string, AnalyticsData>>({})
  const lastExported = ref<string | null>(null)
  const isError = ref(false)

  function setSelectedTimePeriod(period: TimePeriod) {
    selectedTimePeriod.value = period
    isError.value = false
  }

  function setAnalyticsData(data: AnalyticsData) {
    lastExported.value = data.last_exported || null
    analyticsDataByGroupId.value[data.group_id] = data
    isError.value = false
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

    const metricArray = data[metricType as keyof AnalyticsData]
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

    const metricArray = data[metricType as keyof AnalyticsData]
    if (!metricArray || !Array.isArray(metricArray)) return 0
    const metricObj = metricArray.find((metric) => metric.time_period === selectedTimePeriod.value)
    return metricObj ? metricObj.total : 0
  }

  function setError(value: boolean) {
    isError.value = value
  }

  function resetError() {
    isError.value = false
  }

  return {
    selectedTimePeriod,
    analyticsDataByGroupId,
    lastExported,
    isError,
    setSelectedTimePeriod,
    setAnalyticsData,
    getAnalyticsDataByGroupId,
    getMetricDataForSelectedTimePeriod,
    clearAnalyticsData,
    getMetricTotalForSelectedTimePeriod,
    setError,
    resetError,
  }
})
