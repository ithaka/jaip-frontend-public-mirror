export interface DefinitionGroupInput {
  label: string
  entries: string[]
}

export interface DefinitionGroupWithNote extends DefinitionGroupInput {
  note: number
}

export interface FootnotedDefinitions {
  definitionGroups: DefinitionGroupWithNote[]
  footnotes: string[]
  etymologiesNote: number
}

const PART_OF_SPEECH_FOOTNOTES: Record<string, string> = {
  adjective: 'describes a noun',
  adverb: 'modifies a verb or adjective',
  idiom: 'a phrase that has figurative meaning',
  interjection: 'expresses emotion',
  'intransitive verb': "a verb that doesn't take an object",
  noun: 'a person, place, or thing',
  verb: 'an action or state of being',
  'transitive verb': 'expresses an action to an object',
}

const normalizeLabel = (label: string) => label.trim().toLowerCase().replace(/\s+/g, ' ')

/**
 * Adds footnote numbers to each definition group and builds a footnote list.
 * The etymologies footnote is always appended last as "word origins".
 */
export const addDefinitionGroupFootnotes = (
  definitionGroups: DefinitionGroupInput[],
): FootnotedDefinitions => {
  const footnotes: string[] = []
  const footnoteIndexByLabel: Record<string, number> = {}

  const groupsWithNotes = definitionGroups.map((group) => {
    const normalizedLabel = normalizeLabel(group.label)
    const knownFootnote = PART_OF_SPEECH_FOOTNOTES[normalizedLabel]
    const footnoteText = knownFootnote || 'part of speech'

    if (!footnoteIndexByLabel[normalizedLabel]) {
      footnotes.push(footnoteText)
      footnoteIndexByLabel[normalizedLabel] = footnotes.length
    }

    return {
      ...group,
      note: footnoteIndexByLabel[normalizedLabel],
    }
  })

  footnotes.push('word origins')

  return {
    definitionGroups: groupsWithNotes,
    footnotes,
    etymologiesNote: footnotes.length,
  }
}
