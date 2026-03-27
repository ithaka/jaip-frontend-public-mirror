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

  return {
    quickSearchLinkClick,
    footnoteLinkClick,
  }
}

export const dictionaryLogs = {
  getDictionaryTermLogs,
}
