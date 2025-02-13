import type HistoryDetails from './HistoryDetails'
export default interface SearchResult {
  mediaReviewStatus: string
  statusCreatedAt: string
  entityName: string
  statusDetails: HistoryDetails
}
