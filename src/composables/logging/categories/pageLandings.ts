import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'

const getPageLandingLogs = () => {
  const landingLog = (uuid: string): WorkingLog => {
    return {
      ...generics.pageLanding(),
      event_uuid: uuid,
    }
  }
  const exitLog = (uuid: string): WorkingLog => {
    return {
      ...generics.pageExit(),
      event_uuid: uuid,
    }
  }
  return {
    landingLog,
    exitLog,
  }
}

export const pageLandingLogs = {
  getPageLandingLogs,
}
