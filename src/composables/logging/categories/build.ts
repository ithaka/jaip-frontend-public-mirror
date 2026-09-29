import { LogEvent, type WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'

const getBuildLogs = () => {
  const assetPreloadErrorLog =
    (opts: { err: Error }): (() => WorkingLog) =>
    () => ({
      ...generics.error({ message: opts.err.message }),
      eventtype: LogEvent.asset_preload_error,
    })

  const versionCheckLog =
    (opts: {
      currentBuildId: string
      latestBuildId?: string
      status: 'new_version' | 'invalid_response' | 'reload_failed' | 'unavailable'
      reason?: string
    }): (() => WorkingLog) =>
    () => ({
      eventtype: LogEvent.version_check,
      event_description: `Version check ${opts.status.replace('_', ' ')}`,
      action: opts.status,
      value: opts.currentBuildId,
      new_value: opts.latestBuildId,
      reason: opts.reason,
    })

  return {
    assetPreloadErrorLog,
    versionCheckLog,
  }
}

export const buildLogs = {
  getBuildLogs,
}
