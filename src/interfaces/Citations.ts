export interface CitationsResponse {
  has_error: boolean
  error_message: string
  apa: string
  chicago: string
  mla: string
}

export enum CitationTypeOptions {
  APA = 'apa',
  CHICAGO = 'chicago',
  MLA = 'mla',
}
export type CitationTypes =
  CitationTypeOptions.MLA | CitationTypeOptions.CHICAGO | CitationTypeOptions.APA
