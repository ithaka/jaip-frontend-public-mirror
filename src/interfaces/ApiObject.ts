import type { AxiosResponse } from 'axios'
import type { PaginatedQuery } from '@/interfaces/Queries'
import type { Feature, FeatureRequest, FeatureResponse } from '@/interfaces/Features'
import type { SubdomainRequest } from '@/interfaces/Subdomains'
import type { EntitiesArgs } from '@/interfaces/AccountManagement'
import type { Entity, EntityResponse, User } from '@/interfaces/Entities'
import type { EditingGroup, GroupResponse } from '@/interfaces/Group'
import type { SearchResponse } from '@/interfaces/SearchResponse'
import type SearchArgs from '@/interfaces/SearchArgs'
import type BulkApprovalArgs from '@/interfaces/BulkApprovalArgs'
import type BulkApprovalUndoArgs from '@/interfaces/BulkApprovalUndoArgs'
import type DenialArgs from '@/interfaces/DenialArgs'
import type ApprovalArgs from '@/interfaces/ApprovalArgs'
import type RequestArgs from '@/interfaces/RequestArgs'
import type { Journal } from './Journal'
import type { SubdomainsResponse } from './Subdomains'
import type { SimpleRequest, SimpleResponse } from './BasicSubmissions'
interface Documents {
  pdfs: (arg: string) => Promise<AxiosResponse<unknown, unknown>>
  pages: (arg1: string, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
  metadata: (arg: string) => Promise<AxiosResponse<SearchResponse, unknown>>
}
interface Search {
  basic: (arg: SearchArgs) => Promise<AxiosResponse<SearchResponse, unknown>>
  status: (arg1: SearchArgs, arg2: string) => Promise<AxiosResponse<SearchResponse, unknown>>
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
    session: () => Promise<AxiosResponse<User, unknown>>
    features: {
      basic: {
        get: (arg: FeatureRequest) => Promise<AxiosResponse<FeatureResponse, unknown>>
        add: (arg: Feature) => Promise<AxiosResponse<SimpleResponse, unknown>>
        remove: (arg: SimpleRequest) => Promise<AxiosResponse<unknown, unknown>>
        edit: (arg: Feature) => Promise<AxiosResponse<SimpleResponse, unknown>>
        reactivate: (arg: SimpleRequest) => Promise<AxiosResponse<unknown, unknown>>
      }
      ungrouped: {
        get: (arg: PaginatedQuery) => Promise<AxiosResponse<FeatureResponse, unknown>>
        add: (arg: Feature) => Promise<AxiosResponse<SimpleResponse, unknown>>
        remove: (arg: SimpleRequest) => Promise<AxiosResponse<unknown, unknown>>
        edit: (arg: Feature) => Promise<AxiosResponse<SimpleResponse, unknown>>
        reactivate: (arg: SimpleRequest) => Promise<AxiosResponse<unknown, unknown>>
      }
    }
    alerts: () => Promise<AxiosResponse<unknown, unknown>>
    validateSubdomains: () => Promise<AxiosResponse<unknown, unknown>>
    subdomains: {
      get: (arg: SubdomainRequest) => Promise<AxiosResponse<SubdomainsResponse, unknown>>
      add: (arg: SimpleRequest) => Promise<AxiosResponse<SimpleResponse, unknown>>
      remove: (arg: SimpleRequest) => Promise<AxiosResponse<unknown, unknown>>
      edit: (arg: SimpleRequest) => Promise<AxiosResponse<SimpleResponse, unknown>>
      reactivate: (arg: SimpleRequest) => Promise<AxiosResponse<unknown, unknown>>
    }
    entities: {
      get: (arg1: EntitiesArgs, arg2: string) => Promise<AxiosResponse<EntityResponse, unknown>>
      remove: (arg1: Entity, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
      add: (arg1: Entity, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
      edit: (arg1: Entity, arg2: string) => Promise<AxiosResponse<unknown, unknown>>
    }
    groups: {
      get: (arg: PaginatedQuery) => Promise<AxiosResponse<GroupResponse, unknown>>
      remove: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      add: (arg: EditingGroup) => Promise<AxiosResponse<SimpleResponse, unknown>>
      edit: (arg: EditingGroup) => Promise<AxiosResponse<SimpleResponse, unknown>>
      reactivate: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      clearHistory: (arg: EditingGroup) => Promise<AxiosResponse<unknown, unknown>>
      addAdministrator: (arg: SimpleRequest) => Promise<AxiosResponse<unknown, unknown>>
    }
  }
  environment: {
    get: () => Promise<AxiosResponse<{ environment: string }, unknown>>
  }
  disciplines: () => Promise<AxiosResponse<unknown, unknown>>
  journals: (arg: string) => Promise<AxiosResponse<Journal[], unknown>>
  search: Search
  approvals: Approvals
  documents: Documents
}
