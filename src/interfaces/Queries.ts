export interface PaginatedQuery {
  query?: string
  name?: string
  page: number
  limit: number
  is_active?: boolean
}
