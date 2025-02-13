export default interface SearchArgs {
  facets: Array<string>
  fields: Array<string>
  filters: Array<string>
  limit: number
  pageNo: number
  query?: string
  sort: string
  statusStartDate?: Date
  statusEndDate?: Date
  statusQuery?: string
  selectedGroupIds?: Array<number>
  groups?: Array<number>
}
