import type { TimePeriod } from '@/interfaces/Analytics'

const COUNT_FORMATTER = new Intl.NumberFormat('en-US')
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** SVG path markup from public/images/download-icon.svg for Carbon custom toolbar controls. */
export const downloadIconSvg = `<path d="M13 4V12.5857L17.0001 8.58564L18.4143 9.99985L12.0001 16.4141L5.58588 9.99985L7.00009 8.58564L11 12.5855V4H13Z"/><path d="M20 18H4V20H20V18Z"/>`

/**
 * Formats an analytics count value with thousands separators.
 * @param value - Numeric count to format.
 * @returns Formatted count string (e.g., 12,345).
 */
export const formatAnalyticsCount = (value: number) => COUNT_FORMATTER.format(value)

/**
 * Formats a date value for the Views over time chart.
 * @param value - Date-like value from chart data.
 * @param timePeriod - Active analytics time period.
 * @returns Display date string matching the selected time period.
 */
export const formatViewsOverTimeDate = (value: unknown, timePeriod: TimePeriod) => {
  const date = value instanceof Date ? value : new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const month = MONTH_NAMES[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  if (timePeriod === 'months_all_time') {
    return `${month} ${year}`
  }

  return `${month} ${day}, ${year}`
}

/**
 * Formats numbers over 999 with K for thousands and M for millions
 * @param val - The number to format
 * @returns Formatted string with K or M suffix
 */
export const formatDisplayNumbers = (val: number): string => {
  if (val >= 1000000) {
    return `${parseFloat((val / 1000000).toFixed(1))}M`
  } else if (val >= 1000) {
    return `${parseFloat((val / 1000).toFixed(1))}K`
  }
  return val.toString()
}

/**
 * Formats an ISO date string into a human-readable local date and time.
 * @param isoString - ISO date string to format.
 * @returns Formatted date-time string or "Invalid Date".
 */
export const formatDisplayDateTime = (isoString: string): string => {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
