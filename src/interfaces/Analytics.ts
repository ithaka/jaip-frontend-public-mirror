// NOTE: These types must remain consistent with jaip-backend analytics.d.ts - update both files when making changes.
export type AnalyticsMetricType =
  | 'student_item_views'
  | 'student_searches'
  | 'time_of_day_item_views'
  | 'discipline_item_views'
  | 'media_reviews'

export const AnalyticsMetricLabels: Record<AnalyticsMetricType, string> = {
  student_item_views: 'Student Item Views',
  student_searches: 'Student Searches',
  time_of_day_item_views: 'Time of Day Item Views',
  discipline_item_views: 'Discipline Item Views',
  media_reviews: 'Media Reviews',
}

export interface SeriesDataPoint {
  bucket: string // Date bucket in YYYY-MM-DD or string label format
  n: number // Number of events in that bucket
}

export type MediaReviewStatus = 'approved' | 'denied'

export interface MediaReviewDataPoint {
  status: MediaReviewStatus
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
  discipline_item_views?: AnalyticsMetric[]
  media_reviews?: MediaReviewAnalyticsMetric[]
}

// TODO: Remove when test media reviews are fully implemented
export const test_media_reviews: MediaReviewAnalyticsMetric[] = [
  {
    time_period: 'days_30',
    total: 2771,
    series: [
      { status: 'approved', n: 1995 },
      { status: 'denied', n: 499 },
    ],
  },
  {
    time_period: 'weeks_365',
    total: 41672,
    series: [
      { status: 'approved', n: 28337 },
      { status: 'denied', n: 9168 },
    ],
  },
  {
    time_period: 'months_all_time',
    total: 64726,
    series: [
      { status: 'approved', n: 47250 },
      { status: 'denied', n: 11003 },
    ],
  },
]

// TODO: Remove when discipline analytics are fully implemented
const disciplines_days_30: AnalyticsMetric = {
  time_period: 'days_30',
  total: 73,
  series: [
    { bucket: 'Engineering', n: 372 },
    { bucket: 'Meteorology', n: 293 },
    { bucket: 'Nursing', n: 373 },
    { bucket: 'Geography', n: 257 },
    { bucket: 'Astrophysics', n: 110 },
    { bucket: 'History', n: 282 },
    { bucket: 'Psychology', n: 257 },
    { bucket: 'Classics', n: 228 },
    { bucket: 'Biochemistry', n: 372 },
    { bucket: 'Environmental Science', n: 364 },
    { bucket: 'Dance', n: 42 },
    { bucket: 'Computer Science', n: 367 },
    { bucket: 'Medicine', n: 361 },
    { bucket: 'Comparative Literature', n: 243 },
    { bucket: 'Film Studies', n: 270 },
    { bucket: 'Mechanical Engineering', n: 371 },
    { bucket: 'Marine Biology', n: 357 },
    { bucket: 'Developmental Psychology', n: 147 },
    { bucket: 'Theology', n: 73 },
    { bucket: 'Drama', n: 335 },
    { bucket: 'Pharmacology', n: 282 },
    { bucket: 'Philosophy', n: 347 },
    { bucket: 'Botany', n: 312 },
    { bucket: 'Behavioral Neuroscience', n: 213 },
    { bucket: 'Ethics', n: 73 },
    { bucket: 'Quantum Mechanics', n: 128 },
    { bucket: 'International Relations', n: 228 },
    { bucket: 'Microbiology', n: 29 },
    { bucket: 'Civil Engineering', n: 369 },
    { bucket: 'Agricultural Science', n: 91 },
    { bucket: 'Genetics', n: 37 },
    { bucket: 'Neuroscience', n: 373 },
    { bucket: 'Zoology', n: 303 },
    { bucket: 'Linguistics', n: 46 },
    { bucket: 'Business Administration', n: 335 },
    { bucket: 'Law', n: 364 },
    { bucket: 'Analytical Chemistry', n: 197 },
    { bucket: 'Optics', n: 147 },
    { bucket: 'Jazz Studies', n: 58 },
    { bucket: 'Biology', n: 270 },
    { bucket: 'Physics', n: 312 },
    { bucket: 'Economics', n: 341 },
    { bucket: 'Archaeology', n: 243 },
    { bucket: 'Literature', n: 371 },
    { bucket: 'Constitutional Law', n: 110 },
    { bucket: 'English', n: 293 },
    { bucket: 'Thermodynamics', n: 163 },
    { bucket: 'Anthropology', n: 361 },
    { bucket: 'Organic Chemistry', n: 213 },
    { bucket: 'Art History', n: 352 },
    { bucket: 'Ecology', n: 320 },
    { bucket: 'Religious Studies', n: 58 },
    { bucket: 'Electrical Engineering', n: 367 },
    { bucket: 'Political Science', n: 328 },
    { bucket: 'Music Theory', n: 341 },
    { bucket: 'Art', n: 328 },
    { bucket: 'Sociology', n: 320 },
    { bucket: 'Geophysics', n: 91 },
    { bucket: 'Chemistry', n: 303 },
    { bucket: 'Geology', n: 352 },
    { bucket: 'Astronomy', n: 347 },
    { bucket: 'Mathematics', n: 369 },
    { bucket: 'Statistics', n: 357 },
    { bucket: 'Education', n: 373 },
    { bucket: 'Pharmaceutical Sciences', n: 197 },
    { bucket: 'Environmental Engineering', n: 180 },
    { bucket: 'Biomedical Engineering', n: 163 },
    { bucket: 'Physical Chemistry', n: 180 },
    { bucket: 'Cognitive Psychology', n: 128 },
    { bucket: 'Classics', n: 16 },
    { bucket: 'Archaeological Anthropology', n: 22 },
  ],
}

const disciplines_weeks_365: AnalyticsMetric = {
  time_period: 'weeks_365',
  total: 73,
  series: [
    { bucket: 'Philosophy', n: 18044 },
    { bucket: 'Genetics', n: 1924 },
    { bucket: 'Electrical Engineering', n: 19084 },
    { bucket: 'Dance', n: 2184 },
    { bucket: 'Medicine', n: 18772 },
    { bucket: 'Comparative Literature', n: 12636 },
    { bucket: 'Biochemistry', n: 19344 },
    { bucket: 'Thermodynamics', n: 8476 },
    { bucket: 'Jazz Studies', n: 3016 },
    { bucket: 'Nursing', n: 19396 },
    { bucket: 'Law', n: 18928 },
    { bucket: 'Psychology', n: 13364 },
    { bucket: 'Cognitive Psychology', n: 6656 },
    { bucket: 'Pharmacology', n: 14664 },
    { bucket: 'Mechanical Engineering', n: 19292 },
    { bucket: 'Zoology', n: 15756 },
    { bucket: 'Physics', n: 16224 },
    { bucket: 'Art History', n: 18304 },
    { bucket: 'Developmental Psychology', n: 7644 },
    { bucket: 'Behavioral Neuroscience', n: 11076 },
    { bucket: 'Statistics', n: 18564 },
    { bucket: 'Anthropology', n: 18772 },
    { bucket: 'Ethics', n: 3796 },
    { bucket: 'Education', n: 19396 },
    { bucket: 'Astrophysics', n: 5720 },
    { bucket: 'Mathematics', n: 19188 },
    { bucket: 'Ecology', n: 16640 },
    { bucket: 'Geography', n: 13364 },
    { bucket: 'Chemistry', n: 15756 },
    { bucket: 'Archaeology', n: 12636 },
    { bucket: 'Geology', n: 18304 },
    { bucket: 'Drama', n: 17420 },
    { bucket: 'Optics', n: 7644 },
    { bucket: 'Neuroscience', n: 19396 },
    { bucket: 'Agricultural Science', n: 4732 },
    { bucket: 'Linguistics', n: 2392 },
    { bucket: 'Film Studies', n: 14040 },
    { bucket: 'International Relations', n: 11856 },
    { bucket: 'Engineering', n: 19344 },
    { bucket: 'Environmental Science', n: 18928 },
    { bucket: 'Religious Studies', n: 3016 },
    { bucket: 'Economics', n: 17732 },
    { bucket: 'Business Administration', n: 17420 },
    { bucket: 'Analytical Chemistry', n: 10244 },
    { bucket: 'Botany', n: 16224 },
    { bucket: 'Organic Chemistry', n: 11076 },
    { bucket: 'Political Science', n: 17056 },
    { bucket: 'Environmental Engineering', n: 9360 },
    { bucket: 'Marine Biology', n: 18564 },
    { bucket: 'Geophysics', n: 4732 },
    { bucket: 'Astronomy', n: 18044 },
    { bucket: 'Constitutional Law', n: 5720 },
    { bucket: 'Literature', n: 19292 },
    { bucket: 'History', n: 14664 },
    { bucket: 'Computer Science', n: 19084 },
    { bucket: 'Theology', n: 3796 },
    { bucket: 'English', n: 15236 },
    { bucket: 'Biomedical Engineering', n: 8476 },
    { bucket: 'Meteorology', n: 15236 },
    { bucket: 'Pharmaceutical Sciences', n: 10244 },
    { bucket: 'Biology', n: 14040 },
    { bucket: 'Music Theory', n: 17732 },
    { bucket: 'Civil Engineering', n: 19188 },
    { bucket: 'Sociology', n: 16640 },
    { bucket: 'Classics', n: 11856 },
    { bucket: 'Physical Chemistry', n: 9360 },
    { bucket: 'Quantum Mechanics', n: 6656 },
    { bucket: 'Art', n: 17056 },
    { bucket: 'Microbiology', n: 1508 },
    { bucket: 'Archaeological Anthropology', n: 1144 },
    { bucket: 'Classics', n: 832 },
  ],
}

const disciplines_months_all_time: AnalyticsMetric = {
  time_period: 'months_all_time',
  total: 73,
  series: [
    { bucket: 'Developmental Psychology', n: 22932 },
    { bucket: 'Geophysics', n: 14196 },
    { bucket: 'Religious Studies', n: 9048 },
    { bucket: 'Marine Biology', n: 55692 },
    { bucket: 'Nursing', n: 58188 },
    { bucket: 'Economics', n: 53196 },
    { bucket: 'Organic Chemistry', n: 33228 },
    { bucket: 'Engineering', n: 58032 },
    { bucket: 'Biochemistry', n: 58032 },
    { bucket: 'Thermodynamics', n: 25428 },
    { bucket: 'Political Science', n: 51168 },
    { bucket: 'Optics', n: 22932 },
    { bucket: 'Meteorology', n: 45708 },
    { bucket: 'Linguistics', n: 7176 },
    { bucket: 'Computer Science', n: 57252 },
    { bucket: 'Physics', n: 48672 },
    { bucket: 'Zoology', n: 47268 },
    { bucket: 'Constitutional Law', n: 17160 },
    { bucket: 'Analytical Chemistry', n: 30732 },
    { bucket: 'Business Administration', n: 52260 },
    { bucket: 'History', n: 43992 },
    { bucket: 'Behavioral Neuroscience', n: 33228 },
    { bucket: 'Film Studies', n: 42120 },
    { bucket: 'Quantum Mechanics', n: 19968 },
    { bucket: 'Geography', n: 40092 },
    { bucket: 'Comparative Literature', n: 37908 },
    { bucket: 'Medicine', n: 56316 },
    { bucket: 'Neuroscience', n: 58188 },
    { bucket: 'Law', n: 56784 },
    { bucket: 'Mechanical Engineering', n: 57876 },
    { bucket: 'Art History', n: 54912 },
    { bucket: 'Music Theory', n: 53196 },
    { bucket: 'Classics', n: 35568 },
    { bucket: 'Ecology', n: 49920 },
    { bucket: 'Genetics', n: 5772 },
    { bucket: 'Pharmacology', n: 43992 },
    { bucket: 'Electrical Engineering', n: 57252 },
    { bucket: 'Education', n: 58188 },
    { bucket: 'Drama', n: 52260 },
    { bucket: 'Dance', n: 6552 },
    { bucket: 'Sociology', n: 49920 },
    { bucket: 'Civil Engineering', n: 57564 },
    { bucket: 'Jazz Studies', n: 9048 },
    { bucket: 'Statistics', n: 55692 },
    { bucket: 'Environmental Engineering', n: 28080 },
    { bucket: 'Microbiology', n: 4524 },
    { bucket: 'Biomedical Engineering', n: 25428 },
    { bucket: 'Astrophysics', n: 17160 },
    { bucket: 'Botany', n: 48672 },
    { bucket: 'Mathematics', n: 57564 },
    { bucket: 'Philosophy', n: 54132 },
    { bucket: 'Archaeology', n: 37908 },
    { bucket: 'Art', n: 51168 },
    { bucket: 'Anthropology', n: 56316 },
    { bucket: 'Chemistry', n: 47268 },
    { bucket: 'Cognitive Psychology', n: 19968 },
    { bucket: 'Psychology', n: 40092 },
    { bucket: 'Agricultural Science', n: 14196 },
    { bucket: 'Pharmaceutical Sciences', n: 30732 },
    { bucket: 'International Relations', n: 35568 },
    { bucket: 'Classics', n: 2496 },
    { bucket: 'Environmental Science', n: 56784 },
    { bucket: 'Theology', n: 11388 },
    { bucket: 'Geology', n: 54912 },
    { bucket: 'Literature', n: 57876 },
    { bucket: 'Ethics', n: 11388 },
    { bucket: 'Astronomy', n: 54132 },
    { bucket: 'Archaeological Anthropology', n: 3432 },
    { bucket: 'Biology', n: 42120 },
    { bucket: 'Physical Chemistry', n: 28080 },
    { bucket: 'English', n: 45708 },
  ],
}

export const test_disciplines: AnalyticsMetric[] = []
const test_discipline_metrics = [
  disciplines_days_30,
  disciplines_weeks_365,
  disciplines_months_all_time,
]
test_discipline_metrics.forEach((metric) => {
  test_disciplines.push(metric)
})
