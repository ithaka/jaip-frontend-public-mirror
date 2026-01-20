export interface Alert {
  id?: number
  text: string
  status: AlertStatus
  is_active: boolean
  start_date: Date
  end_date: Date
  subdomains?: string[]
  groups?: number[]
  facilities?: number[]
  alerts_subdomains?: AlertSubdomain[]
  alerts_groups?: AlertGroup[]
  alerts_facilities?: AlertFacility[]
  created_at?: string
  updated_at?: string
}

export interface AlertFacility {
  facilities: {
    jstor_id: string
    entities: {
      id: number
      name: string
    }
  }
}

export interface AlertSubdomain {
  subdomain: string
}

export interface AlertGroup {
  groups: {
    id: number
    name: string
  }
}
export interface StatusOption {
  value: AlertStatus
  label: string
  tooltip: string
}

export enum AlertStatus {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface AlertsResponse {
  alerts: Alert[]
  total: number
}
