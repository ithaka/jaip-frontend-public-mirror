export interface PaginatedQuery {
  query?: string
  name?: string
  page: number
  limit: number
  is_active?: boolean
}

export interface PaginatedGroupedQuery extends PaginatedQuery {
  query?: string
  name?: string
  page: number
  limit: number
  is_active?: boolean
  groups: number[]
}

export enum PaginationDirectionOptions {
  prev = 'prev',
  next = 'next',
}
export type PaginationDirections = PaginationDirectionOptions.prev | PaginationDirectionOptions.next
