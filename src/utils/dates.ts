export const defaultDateOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
} as const

/**
 * Sets the start of the day for a given date.
 *
 * @param date The date to set to the start of the day.
 * @returns A new Date object set to the start of the given day.
 */
export const setStartDate = (date: Date) => {
  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)
  return startDate
}
/**
 * Sets the end of the day for a given date.
 *
 * @param date The date to set to the end of the day.
 * @returns A new Date object set to the end of the given day.
 */
export const setEndDate = (date: Date) => {
  const endDate = new Date(date)
  endDate.setHours(23, 59, 59, 999)
  return endDate
}

/**
 * Normalizes an array of dates by ensuring the first date is the start of the day
 * and the second date is the end of the day. If only one date is provided, it is
 * used for both the start and end dates.
 *
 * @param dates An array containing one or two Date objects.
 * @returns An array containing the normalized start and end Date objects.
 */
export const normalizeDates = (dates: Array<Date>) => {
  const firstDate = new Date(dates[0]!)
  const secondDate = new Date(dates[1] || dates[0]!)
  const [startDate, endDate] =
    firstDate <= secondDate ? [firstDate, secondDate] : [secondDate, firstDate]
  const normalizedStartDate = setStartDate(startDate)
  const normalizedEndDate = setEndDate(endDate)
  return [normalizedStartDate, normalizedEndDate]
}

/**
 * Formats a given date as a locale-specific string using the provided options.
 *
 * @param date The date to format. If the date is `null` or `undefined`, an empty string is returned.
 * @param options The formatting options to use (defaults to `defaultDateOptions`).
 * @returns A string representing the formatted date.
 */
export const defaultLocaleDateString = (
  date: Date | null | undefined,
  options = defaultDateOptions,
) => {
  if (!date) return ''
  return date.toLocaleDateString('en-US', options)
}

/**
 * Formats a date range as a locale-specific string. If the start and end dates are the same, only the start date is returned. If the start date is not provided, an empty string is returned.
 *
 * @param startDate The start date of the range.
 * @param endDate The end date of the range.
 * @param options The formatting options to use (defaults to `defaultDateOptions`).
 * @returns A string representing the formatted date range.
 */
export const defaultLocaleDateRangeString = (
  startDate: Date | null | undefined,
  endDate: Date | null | undefined,
  options = defaultDateOptions,
) => {
  if (!startDate) return ''

  // We use setStartDate to compare only the date portion, ignoring the time. setStartDate
  // automatically sets the time to the start of the day (00:00:00.000), so we can confirm
  // that two dates fall on the same calendar day.
  if (!endDate || setStartDate(startDate).getTime() === setStartDate(endDate).getTime()) {
    return defaultLocaleDateString(startDate, options)
  }
  return `${defaultLocaleDateString(startDate, options)} - ${defaultLocaleDateString(endDate, options)}`
}
