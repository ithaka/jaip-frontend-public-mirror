import { LogEvent, type WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'

const getViewportPatchLogs = () => {
  const viewportPatchErrorLog =
    (opts: { err: Error }): (() => WorkingLog) =>
    () => ({
      ...generics.error({ message: opts.err.message }),
      eventtype: LogEvent.viewport_patch_error,
    })

  return {
    viewportPatchErrorLog,
  }
}

export const viewportPatchLogs = {
  getViewportPatchLogs,
}
