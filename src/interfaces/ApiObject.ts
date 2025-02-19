import type { AxiosResponse } from 'axios'
import type { PaginatedQuery } from '@/interfaces/Queries'
import type { Feature } from '@/interfaces/Features'
import type { Subdomain } from '@/interfaces/Subdomains'
import type { EntitiesArgs } from '@/interfaces/AccountManagement'
import type { User } from '@/interfaces/Entities'
import type { EditingGroup } from '@/interfaces/Group'
import type { SearchResponse } from '@/interfaces/SearchResponse'
import type SearchArgs from '@/interfaces/SearchArgs'
import type StatusSearchArgs from '@/interfaces/StatusSearchArgs'
import type BulkApprovalArgs from '@/interfaces/BulkApprovalArgs'
import type BulkApprovalUndoArgs from '@/interfaces/BulkApprovalUndoArgs'
import type DenialArgs from '@/interfaces/DenialArgs'
import type ApprovalArgs from '@/interfaces/ApprovalArgs'
import type RequestArgs from '@/interfaces/RequestArgs'
import type { Journal } from './Journal'

interface Documents {
  pdfs: (arg: string) => Promise<AxiosResponse<unknown, unknown>>
  pages: (arg1: string, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
  metadata: (arg: string) => Promise<AxiosResponse<SearchResponse, unknown>>
}
interface Search {
  basic: (arg: SearchArgs) => Promise<AxiosResponse<SearchResponse, unknown>>
  status: (arg1: StatusSearchArgs, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
}
interface Approvals {
  bulk: (arg: BulkApprovalArgs) => Promise<AxiosResponse<unknown, unknown>>
  bulkUndo: (arg: BulkApprovalUndoArgs) => Promise<AxiosResponse<unknown, unknown>>
  deny: (arg: DenialArgs) => Promise<AxiosResponse<unknown, unknown>>
  incomplete: (arg: DenialArgs) => Promise<AxiosResponse<unknown, unknown>>
  approve: (arg: ApprovalArgs) => Promise<AxiosResponse<unknown, unknown>>
  request: (arg: RequestArgs) => Promise<AxiosResponse<unknown, unknown>>
}
export default interface ApiObject {
  auth: {
    session: () => Promise<AxiosResponse<unknown, unknown>>
    features: {
      basic: {
        get: (arg: PaginatedQuery) => Promise<AxiosResponse<unknown, unknown>>
        add: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
        remove: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
        edit: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
        reactivate: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
      }
      ungrouped: {
        get: (arg: PaginatedQuery) => Promise<AxiosResponse<unknown, unknown>>
        add: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
        remove: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
        edit: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
        reactivate: (arg: Feature) => Promise<AxiosResponse<unknown, unknown>>
      }
    }
    alerts: () => Promise<AxiosResponse<unknown, unknown>>
    validateSubdomains: (arg: string) => Promise<AxiosResponse<unknown, unknown>>
    subdomains: {
      get: (arg: PaginatedQuery) => Promise<AxiosResponse<unknown, unknown>>
      add: (arg: Subdomain) => Promise<AxiosResponse<unknown, unknown>>
      remove: (arg: Subdomain) => Promise<AxiosResponse<unknown, unknown>>
      edit: (arg: Subdomain) => Promise<AxiosResponse<unknown, unknown>>
      reactivate: (arg: Subdomain) => Promise<AxiosResponse<unknown, unknown>>
    }
    entities: {
      get: (arg1: EntitiesArgs, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
      remove: (arg1: User, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
      add: (arg1: User, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
      edit: (arg1: User, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
    }
    groups: {
      get: (arg: PaginatedQuery) => Promise<AxiosResponse<unknown, unknown>>
      remove: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      add: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      edit: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      reactivate: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      clearHistory: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      addAdministrator: (arg: User) => Promise<AxiosResponse<unknown, unknown>>
    }
  }
  disciplines: () => Promise<AxiosResponse<unknown, unknown>>
  journals: (arg: string) => Promise<AxiosResponse<Journal[], unknown>>
  search: Search
  approvals: Approvals
  documents: Documents
}
