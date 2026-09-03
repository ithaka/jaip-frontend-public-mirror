import { LogEvent, type WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'

const getBuildLogs = () => {
  const assetPreloadErrorLog =
    (opts: { err: Error }): (() => WorkingLog) =>
    () => ({
      ...generics.error({ message: opts.err.message }),
      eventtype: LogEvent.asset_preload_error,
    })

  return {
    assetPreloadErrorLog,
  }
}

export const buildLogs = {
  getBuildLogs,
}
