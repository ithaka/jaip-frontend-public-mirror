import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'

const getCiteButtonLogs = (options: { dois: string[] }) => {
  const openCitationsModalLog = (): WorkingLog => ({
    ...generics.buttonClick('cite_button'),
    event_description: 'user opened cite this item modal',
    action: 'open_cite_modal',
    dois: options.dois,
  })

  return {
    openCitationsModalLog,
  }
}

const getCopyButtonLogs = (options: { dois?: string[]; copyContext: string }) => {
  const copyButtonLog = (): (() => WorkingLog) => () => ({
    ...generics.buttonClick(`copy_${options.copyContext}_button`),
    event_description: `user copied ${options.copyContext}`,
    action: `copy_${options.copyContext}`,
    dois: options.dois,
  })

  const copyAvailabilityLog = (): (() => WorkingLog) => () => ({
    ...generics.error({
      message: 'Clipboard API is not enabled on this device',
    }),
    event_description: `Unable to copy ${options.copyContext}`,
    action: `copy_${options.copyContext}_unavailable`,
    dois: options.dois,
  })

  const copyErrorLog =
    (opts: { error: unknown }): (() => WorkingLog) =>
    () => ({
      ...generics.error({
        message: opts.error instanceof Error ? opts.error.message : 'Unknown error',
      }),
      event_description: `Failed to copy ${options.copyContext}`,
      action: `copy_${options.copyContext}_error`,
      dois: options.dois,
    })

  return {
    copyButtonLog,
    copyErrorLog,
    copyAvailabilityLog,
  }
}

export const citationsLogs = {
  getCiteButtonLogs,
  getCopyButtonLogs,
}
