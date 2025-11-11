export enum Collections {
  REENTRY = 'reentry',
}

export interface AlternateDocumentVersion {
  filename: string
  language: string
  label: string
}

export interface CustomMetadata {
  title: string
  description: string
  filename: string
  creator: string
  contributor: string
  publisher: string
  date: string
  type: string
  format: string
  alternate_versions: AlternateDocumentVersion[]
  subject: string
  location: string
  language: string
  jurisdiction: string
  national: boolean
  state_code: string
  subject_arr: string[]
}
