import type SearchArgs from './SearchArgs'

export default interface StatusSearchArgs extends SearchArgs {
  statusStartDate: Date
  statusEndDate: Date
  groups?: Array<number>
  limit: number
}
