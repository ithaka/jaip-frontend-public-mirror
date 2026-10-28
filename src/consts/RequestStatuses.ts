import { RequestStatus, RequestStatusLabel } from '@/interfaces/RequestStatus'

export const REQUEST_STATUSES = [
  { label: RequestStatusLabel.Pending, value: RequestStatus.Pending },
  { label: RequestStatusLabel.Completed, value: RequestStatus.Completed },
  { label: RequestStatusLabel.Incomplete, value: RequestStatus.Incomplete },
  { label: RequestStatusLabel.Denied, value: RequestStatus.Denied },
  { label: RequestStatusLabel.Approved, value: RequestStatus.Approved },
  { label: RequestStatusLabel.Restricted, value: RequestStatus.Restricted },
] satisfies { label: RequestStatusLabel; value: RequestStatus }[]
