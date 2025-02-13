import type { MediaRecord } from './MediaRecord'
import type ContentType from './ContentType'

export interface SearchResponse {
  total: number
  qtime: number
  docs: MediaRecord[]
  stats: null
  page: number
  facets: Facets
}

export interface Facets {
  disciplines: ContentType[]
  contentType: ContentType[]
}
