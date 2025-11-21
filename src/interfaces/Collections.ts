export enum Collections {
  reentry = 'reentry',
}

export interface AlternateDocumentVersion {
  filename: string
  language: string
  label: string
}

export interface CollectionMetadata {
  title: string
  description: string
  filename: string
  thumbnail: string
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
