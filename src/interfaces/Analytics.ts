// NOTE: These types must remain consistent with jaip-backend analytics.d.ts - update both files when making changes.
export type AnalyticsMetricType =
  | 'student_item_views'
  | 'student_searches'
  | 'time_of_day_item_views'
  | 'discipline_views'
  | 'media_review_events'

export const AnalyticsMetricLabels: Record<AnalyticsMetricType, string> = {
  student_item_views: 'Student Item Views',
  student_searches: 'Student Searches',
  time_of_day_item_views: 'Time of Day Item Views',
  discipline_views: 'Discipline Item Views',
  media_review_events: 'Media Reviews',
}

export interface SeriesDataPoint {
  bucket: string // Date bucket in YYYY-MM-DD or string label format
  n: number // Number of events in that bucket
}

export type MediaReviewStatus = 'approved' | 'denied'

export interface MediaReviewDataPoint {
  bucket: MediaReviewStatus
  n: number // Number of media reviews with that status
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
  total: number // Sum of all events in the time period or count (for disciplines, count of disciplines with views)
  series: SeriesType[]
}

export type AnalyticsMetric = BaseAnalyticsMetric<SeriesDataPoint>
export type TimeOfDayAnalyticsMetric = BaseAnalyticsMetric<TimeOfDayDataPoint>
export type MediaReviewAnalyticsMetric = BaseAnalyticsMetric<MediaReviewDataPoint>

export interface AnalyticsData {
  group_id: string
  group_name: string
  last_exported: string // ISO timestamp
  student_item_views: AnalyticsMetric[]
  student_searches: AnalyticsMetric[]
  time_of_day_item_views: TimeOfDayAnalyticsMetric[]
  discipline_views?: AnalyticsMetric[]
  media_reviews?: MediaReviewAnalyticsMetric[]
}
