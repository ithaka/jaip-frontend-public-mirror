import { navigationLogs } from './categories/navigation'
import { entityLogs } from './categories/entities'
import { mediaReviewLogs } from './categories/media_review_controls'

export const logs = {
  ...navigationLogs,
  ...entityLogs,
  ...mediaReviewLogs,
}
