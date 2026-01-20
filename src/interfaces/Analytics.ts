// NOTE: variables names are consistent in jaip-backend analytics.d.ts so please update both files if changes are made.
export interface AnalyticsMetrics {
  viewsOverTime: 'views_over_time'
  totalViewsByDiscipline: 'total_views_by_discipline'
  patternsOfUse: 'patterns_of_use'
  rateOfReview: 'rate_of_review'
  requestsByStatus: 'requests_by_status'
}

export interface TimeSeriesDataPoint {
  bucket: string //Date bucket in YYYY-MM-DD
  n: number //Number of events in that bucket
}

export type TimePeriod = 'days_30' | 'days_365' | 'years_all'

export const TimePeriodLabels: Record<TimePeriod, string> = {
  days_30: 'Last 30 days',
  days_365: 'Last 365 days',
  years_all: 'All time',
}

// Generic structure for all the analytics metrics that use time series
export interface AnalyticsMetric {
  time_period: TimePeriod
  total: number //Sum of all events in the time period
  series: TimeSeriesDataPoint[]
}

// Main analytics data structure returned from S3
export interface AnalyticsData {
  group_id: string
  group_name: string
  last_exported: string //ISO timestamp
  student_item_views: AnalyticsMetric[]
  student_searches: AnalyticsMetric[]
}
