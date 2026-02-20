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
  const isNoDataYet = ref(false)

  const isEmptyPayload = (payload: unknown) => {
    return !!payload && typeof payload === 'object' && Object.keys(payload as object).length === 0
  }

  const hasOnlyNullOrEmptySeries = (payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
      return false
    }

    const metricKeys = [
      'student_item_views',
      'student_searches',
      'time_of_day_item_views',
      'discipline_views',
      'media_reviews',
    ] as const

    const metricEntries = metricKeys.flatMap((key) => {
      const value = (payload as Record<string, unknown>)[key]
      return Array.isArray(value) ? value : []
    })

    if (metricEntries.length === 0) {
      return true
    }

    return metricEntries.every((metricEntry) => {
      if (!metricEntry || typeof metricEntry !== 'object') {
        return true
      }

      const series = (metricEntry as Record<string, unknown>).series
      if (!Array.isArray(series) || series.length === 0) {
        return true
      }

      return series.every((point) => point == null)
    })
  }

  function setSelectedTimePeriod(period: TimePeriod) {
    selectedTimePeriod.value = period
    isError.value = false
  }

  function setAnalyticsData(data: AnalyticsData | Record<string, unknown>, groupId?: string) {
    const hasNoData = isEmptyPayload(data) || hasOnlyNullOrEmptySeries(data)

    isNoDataYet.value = hasNoData
    isError.value = false

    if (hasNoData) {
      lastExported.value = null
      if (groupId) {
        delete analyticsDataByGroupId.value[groupId]
      }
      return
    }

    const analyticsData = data as AnalyticsData
    const resolvedGroupId = analyticsData.group_id || groupId
    if (!resolvedGroupId) {
      return
    }

    lastExported.value = analyticsData.last_exported || null
    analyticsDataByGroupId.value[resolvedGroupId] = analyticsData
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
    if (value) {
      isNoDataYet.value = false
    }
  }

  function resetError() {
    isError.value = false
  }

  function resetNoDataYet() {
    isNoDataYet.value = false
  }

  return {
    selectedTimePeriod,
    analyticsDataByGroupId,
    lastExported,
    isError,
    isNoDataYet,
    setSelectedTimePeriod,
    setAnalyticsData,
    getAnalyticsDataByGroupId,
    getMetricDataForSelectedTimePeriod,
    clearAnalyticsData,
    getMetricTotalForSelectedTimePeriod,
    setError,
    resetError,
    resetNoDataYet,
  }
})
