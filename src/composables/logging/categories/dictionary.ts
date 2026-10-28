import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'
import { FootnoteDirectionOptions } from '@/interfaces/Dictionary'

const getDictionaryTermLogs = () => {
  const quickSearchLinkClick =
    (opts: { label: string }): (() => WorkingLog) =>
    (): WorkingLog => ({
      ...generics.linkClick(
        'quick-search-link',
        `Clicked link to quick search for term: ${opts.label}`,
      ),
      label: opts.label,
    })

  const footnoteLinkClick =
    (opts: {
      label: string
      index: number
      direction: FootnoteDirectionOptions
    }): (() => WorkingLog) =>
    (): WorkingLog => ({
      ...generics.linkClick(
        `footnote-link-${opts.index}`,
        `Clicked link to footnote ${opts.index}, ${opts.label}`,
      ),
      label: opts.label,
      index: opts.index,
      direction: opts.direction,
    })

  const backToDictionaryHomeLinkClick = (): WorkingLog => ({
    ...generics.linkClick('dictionary_home', 'internal_navigation'),
    event_description: 'user clicked back to dictionary home link from term page',
    action: 'back_to_dictionary_home',
  })

  return {
    quickSearchLinkClick,
    footnoteLinkClick,
    backToDictionaryHomeLinkClick,
  }
}

export const dictionaryLogs = {
  getDictionaryTermLogs,
}
