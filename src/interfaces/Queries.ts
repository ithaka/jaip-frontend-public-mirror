export interface PaginatedQuery {
  query: string
  page: number
  limit: number
  is_active?: string
}
