export interface WordnikEtymology {
  etymologyXML: string
  sourceDictionary: string
  id: string
}

export interface WordnikPronunciation {
  raw: string
  attributionText: string
  id: string
}

export interface WordnikDefinition {
  partOfSpeech: string
  attributionText: string
  text: string | string[]
  word: string
  id: string
}

export interface WordnikEtymologiesResult {
  response: WordnikEtymology[]
  is_error: boolean
}

export interface WordnikPronunciationsResult {
  response: WordnikPronunciation[]
  is_error: boolean
}

export interface WordnikDefinitionsResult {
  response: WordnikDefinition[]
  is_error: boolean
}

export interface WordnikWordData {
  etymologies: WordnikEtymologiesResult
  pronunciations: WordnikPronunciationsResult
  definitions: WordnikDefinitionsResult
}

export enum FootnoteDirectionOptions {
  toFootnote = 'to_footnote',
  toSource = 'to_source',
}
export type FootnoteDirections =
  | FootnoteDirectionOptions.toFootnote
  | FootnoteDirectionOptions.toSource
