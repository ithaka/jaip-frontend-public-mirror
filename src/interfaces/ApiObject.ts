import type { AxiosResponse } from 'axios'
import type { PaginatedQuery, PaginatedGroupedQuery } from '@/interfaces/Queries'
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
import type { Log } from './Log'
import type { RestrictArgs, UnrestrictArgs } from './RestrictArgs'
import type { Alert } from './Alert'
import type { Collections, CollectionMetadata } from './Collections'
import type { Discipline } from './Discipline'
interface Documents {
  pdfs: (arg: string) => Promise<AxiosResponse<unknown>>
  pages: (arg1: string, arg2: string) => Promise<AxiosResponse<unknown>>
  metadata: (arg: string) => Promise<AxiosResponse<SearchResponse>>
}

interface CollectionsRoutes {
  metadata: (collection: Collections) => Promise<AxiosResponse<CollectionMetadata[]>>
  pdf: (collection: Collections, filename: string) => Promise<AxiosResponse<Blob>>
}
interface Search {
  basic: (arg: SearchArgs) => Promise<AxiosResponse<SearchResponse>>
  status: (arg1: SearchArgs, arg2: string) => Promise<AxiosResponse<SearchResponse>>
}
interface Approvals {
  bulk: (arg: BulkApprovalArgs) => Promise<AxiosResponse<unknown>>
  bulkUndo: (arg: BulkApprovalUndoArgs) => Promise<AxiosResponse<unknown>>
  deny: (arg: DenialArgs) => Promise<AxiosResponse<unknown>>
  incomplete: (arg: DenialArgs) => Promise<AxiosResponse<unknown>>
  approve: (arg: ApprovalArgs) => Promise<AxiosResponse<unknown>>
  request: (arg: RequestArgs) => Promise<AxiosResponse<unknown>>
}
interface GlobalRestricts {
  restrict: (arg: RestrictArgs) => Promise<AxiosResponse<unknown>>
  unrestrict: (arg: UnrestrictArgs) => Promise<AxiosResponse<unknown>>
  get: (arg: {
    term: string
    page: number
    limit: number
  }) => Promise<AxiosResponse<SearchResponse>>
  download: () => Promise<AxiosResponse<unknown>>
  last_updated: {
    get: () => Promise<AxiosResponse<{ last_updated: Date | undefined }>>
  }
}

interface AlertsResponse {
  alerts: Alert[]
  total: number
}
interface Alerts {
  get: () => Promise<AxiosResponse<AlertsResponse>>
  getPaginated: (arg: PaginatedGroupedQuery) => Promise<AxiosResponse<AlertsResponse>>
  add: (arg: Alert) => Promise<AxiosResponse<Alert>>
  edit: (arg: Alert) => Promise<AxiosResponse<Alert>>
  delete: (id: number) => Promise<AxiosResponse<unknown>>
}

export default interface ApiObject {
  log: (arg: Log) => void
  auth: {
    session: () => Promise<AxiosResponse<User>>
    features: {
      basic: {
        get: (arg: FeatureRequest) => Promise<AxiosResponse<FeatureResponse>>
        add: (arg: Feature) => Promise<AxiosResponse<SimpleResponse>>
        remove: (arg: SimpleRequest) => Promise<AxiosResponse<unknown>>
        edit: (arg: Feature) => Promise<AxiosResponse<SimpleResponse>>
        reactivate: (arg: SimpleRequest) => Promise<AxiosResponse<unknown>>
      }
      ungrouped: {
        get: (arg: PaginatedQuery) => Promise<AxiosResponse<FeatureResponse>>
        add: (arg: Feature) => Promise<AxiosResponse<SimpleResponse>>
        remove: (arg: SimpleRequest) => Promise<AxiosResponse<unknown>>
        edit: (arg: Feature) => Promise<AxiosResponse<SimpleResponse>>
        reactivate: (arg: SimpleRequest) => Promise<AxiosResponse<unknown>>
      }
    }
    alerts: () => Promise<AxiosResponse<unknown>>
    validateSubdomains: () => Promise<AxiosResponse<unknown>>
    subdomains: {
      get: (arg: SubdomainRequest) => Promise<AxiosResponse<SubdomainsResponse>>
      add: (arg: SimpleRequest) => Promise<AxiosResponse<SimpleResponse>>
      remove: (arg: SimpleRequest) => Promise<AxiosResponse<unknown>>
      edit: (arg: SimpleRequest) => Promise<AxiosResponse<SimpleResponse>>
      reactivate: (arg: SimpleRequest) => Promise<AxiosResponse<unknown>>
    }
    entities: {
      get: (arg1: EntitiesArgs, arg2: string) => Promise<AxiosResponse<EntityResponse>>
      remove: (arg1: Entity, arg2: string) => Promise<AxiosResponse<unknown>>
      add: (arg1: Entity, arg2: string) => Promise<AxiosResponse<unknown>>
      edit: (arg1: Entity, arg2: string) => Promise<AxiosResponse<unknown>>
    }
    groups: {
      get: (arg: PaginatedQuery) => Promise<AxiosResponse<GroupResponse>>
      remove: (arg: EditingGroup) => Promise<AxiosResponse<unknown>>
      add: (arg: EditingGroup) => Promise<AxiosResponse<SimpleResponse>>
      edit: (arg: EditingGroup) => Promise<AxiosResponse<SimpleResponse>>
      reactivate: (arg: EditingGroup) => Promise<AxiosResponse<unknown>>
      clearHistory: (arg: EditingGroup) => Promise<AxiosResponse<unknown>>
      addAdministrator: (arg: SimpleRequest) => Promise<AxiosResponse<unknown>>
    }
  }
  collections: CollectionsRoutes
  environment: {
    get: () => Promise<AxiosResponse<{ environment: string }>>
  }
  disciplines: () => Promise<AxiosResponse<Discipline[]>>
  journals: (arg: string) => Promise<AxiosResponse<Journal[]>>
  search: Search
  approvals: Approvals
  global_restricts: GlobalRestricts
  documents: Documents
  alerts: Alerts
}
