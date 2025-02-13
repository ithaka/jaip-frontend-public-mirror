import type StatusHistory from './StatusHistory'
export default interface SearchResult {
  _id: string
  _score: number
  authors: Array<string>
  contentType: string
  doi: string
  title: string
  history?: StatusHistory
}
