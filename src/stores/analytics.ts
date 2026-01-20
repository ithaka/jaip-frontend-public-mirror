import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TimePeriod } from '@/interfaces/Analytics'

export const useAnalyticsStore = defineStore('analytics', () => {
  const selectedTimePeriod = ref<TimePeriod>('days_30')

  function setSelectedTimePeriod(period: TimePeriod) {
    selectedTimePeriod.value = period
  }

  return { selectedTimePeriod, setSelectedTimePeriod }
})
