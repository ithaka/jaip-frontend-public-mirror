import { navigationLogs } from './categories/navigation'
import { entityLogs } from './categories/entities'

export const logs = {
  ...navigationLogs,
  ...entityLogs,
}
