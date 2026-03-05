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

  const supportLinkClickLog = (): WorkingLog => ({
    ...generics.linkClick('analytics_support_link'),
    destination:
      'https://support.jstor.org/hc/en-us/articles/38769417042839-JSTOR-Access-in-Prison-Using-the-analytics-dashboard',
  })

  return {
    groupSelectorClickLog,
    dateRangeSelectorClickLog,
    chartButtonClickLog,
    supportLinkClickLog,
  }
}

export const analyticsLogs = {
  getAnalyticsLogs,
}
