export interface Subdomain {
  id?: string
  subdomain: string
  is_active: boolean
}

export interface SubdomainRequest {
  name?: string
  page?: number
  limit?: number
  is_active: boolean
}
export interface SubdomainsResponse {
  total: number
  subdomains: Subdomain[]
}
