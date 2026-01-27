import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  TimePeriod,
  AnalyticsData,
  AnalyticsMetricType,
  AnalyticsMetric,
  TimeOfDayAnalyticsMetric,
} from '@/interfaces/Analytics'

export const useAnalyticsStore = defineStore('analytics', () => {
  const selectedTimePeriod = ref<TimePeriod>('days_30')
  const analyticsDataByGroupId = ref<Record<string, AnalyticsData>>({})

  function setSelectedTimePeriod(period: TimePeriod) {
    selectedTimePeriod.value = period
  }

  function setAnalyticsData(data: AnalyticsData) {
    analyticsDataByGroupId.value[data.group_id] = data
  }

  function getAnalyticsDataByGroupId(groupId: string): AnalyticsData | undefined {
    const data = analyticsDataByGroupId.value[groupId]
    return data
  }

  function getMetricDataForSelectedTimePeriod(
    metricType: AnalyticsMetricType,
    groupId: string,
  ): AnalyticsMetric | TimeOfDayAnalyticsMetric | undefined {
    const data = getAnalyticsDataByGroupId(groupId)
    if (!data) return undefined

    const metricArray = data[metricType]
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
    const metricObj = metricArray.find((metric) => metric.time_period === selectedTimePeriod.value)
    return metricObj ? metricObj.total : 0
  }

  return {
    selectedTimePeriod,
    analyticsDataByGroupId,
    setSelectedTimePeriod,
    setAnalyticsData,
    getAnalyticsDataByGroupId,
    getMetricDataForSelectedTimePeriod,
    clearAnalyticsData,
    getMetricTotalForSelectedTimePeriod,
  }
})
