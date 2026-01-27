// NOTE: These types must remain consistent with jaip-backend analytics.d.ts - update both files when making changes.
export type AnalyticsMetricType =
  | 'student_item_views'
  | 'student_searches'
  | 'time_of_day_item_views'

export const AnalyticsMetricLabels: Record<AnalyticsMetricType, string> = {
  student_item_views: 'Student Item Views',
  student_searches: 'Student Searches',
  time_of_day_item_views: 'Time of Day Item Views',
}

export interface TimeSeriesDataPoint {
  bucket: string // Date bucket in YYYY-MM-DD
  n: number // Number of events in that bucket
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

export interface TimeOfDayDataPoint {
  time: TimeOfDay
  day: DayOfWeek
  value: number // Number of events in that time of day
}

export type TimePeriod = 'days_30' | 'weeks_365' | 'months_all_time'

export const TimePeriodLabels: Record<TimePeriod, string> = {
  days_30: 'Last 30 days',
  weeks_365: 'Last 365 days',
  months_all_time: 'All time',
}

interface BaseAnalyticsMetric<SeriesType> {
  time_period: TimePeriod
  total: number // Sum of all events in the time period
  series: SeriesType[]
}

export type AnalyticsMetric = BaseAnalyticsMetric<TimeSeriesDataPoint>
export type TimeOfDayAnalyticsMetric = BaseAnalyticsMetric<TimeOfDayDataPoint>

export interface AnalyticsData {
  group_id: string
  group_name: string
  last_exported: string // ISO timestamp
  student_item_views: AnalyticsMetric[]
  student_searches: AnalyticsMetric[]
  time_of_day_item_views: TimeOfDayAnalyticsMetric[]
}
