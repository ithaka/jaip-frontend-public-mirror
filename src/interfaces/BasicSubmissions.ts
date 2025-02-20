export interface SimpleRequest {
  id?: string | number | undefined
  name?: string
}

export interface SimpleResponse {
  duplicate: boolean
  results: unknown
}
