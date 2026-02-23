import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'
import type { Ref } from 'vue'
import type { TimePeriod } from '@/interfaces/Analytics'

const getAnalyticsLogs = (options: {
  selectedGroupId: Ref<number>
  selectedTimePeriod: Ref<TimePeriod>
}) => {
  const groupSelectorClickLog = (): WorkingLog => ({
    ...generics.dropdownSelect('analytics_group'),
    group_id: options.selectedGroupId.value,
  })

  const dateRangeSelectorClickLog = (): WorkingLog => ({
    ...generics.dropdownSelect('analytics_date_range'),
    group_id: options.selectedGroupId.value,
    date_range: options.selectedTimePeriod.value,
  })

  const chartButtonClickLog =
    (opts: { controlId: string }): (() => WorkingLog) =>
    () => ({
      ...generics.buttonClick(opts.controlId),
      group_id: options.selectedGroupId.value,
      date_range: options.selectedTimePeriod.value,
    })

  return {
    groupSelectorClickLog,
    dateRangeSelectorClickLog,
    chartButtonClickLog,
  }
}

export const analyticsLogs = {
  getAnalyticsLogs,
}
