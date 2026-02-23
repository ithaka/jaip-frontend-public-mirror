import { navigationLogs } from './categories/navigation'
import { entityLogs } from './categories/entities'
import { mediaReviewLogs } from './categories/media_review_controls'
import { featureLogs } from './categories/features'
import { pageLandingLogs } from './categories/pageLandings'
import { viewerLogs } from './categories/viewers'
import { analyticsLogs } from './categories/analytics'

export const logs = {
  ...navigationLogs,
  ...entityLogs,
  ...mediaReviewLogs,
  ...featureLogs,
  ...pageLandingLogs,
  ...viewerLogs,
  ...analyticsLogs,
}
