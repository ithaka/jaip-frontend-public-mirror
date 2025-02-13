import type { BulkHistory } from './MediaRecord'
import type { Journal } from './Journal'

export interface Counts {
  books: number
  journals: number
  pamphlets: number
}

export interface Discipline {
  bulk_approval?: BulkHistory[]
  journals?: Journal[]
  code: string
  count?: number
  counts: Counts
  label: string
  parent: boolean
  parent_code?: string
  parent_label?: string
  titleCount: number
  titles: string
}

export interface DisciplineObject {
  [key: string]: Discipline
}
