import type { WorkingLog } from '@/interfaces/Log'
import { generics } from './generic'

const getMediaReviewHelpLogs = () => {
  const unavailableItemsPolicyLinkClickLog = (): WorkingLog => ({
    ...generics.linkClick('media_review_policy', 'internal_navigation'),
    event_description:
      'user clicked "read the model media review policy here" link from unavailable items help content',
  })

  const backToHelpGuideLog = (): WorkingLog => ({
    ...generics.linkClick('help_guide', 'internal_navigation'),
    event_description: 'user clicked back link from media review policy page',
  })

  const backFromAdminMediaReviewHelpLog = (): WorkingLog => ({
    ...generics.linkClick('admin_media_review_help', 'internal_navigation'),
    event_description: 'user clicked back link from admin media review help page',
  })

  const helpTabViewLog =
    (tabParam: string): (() => WorkingLog) =>
    () => ({
      ...generics.linkClick(tabParam, 'tab_view'),
      event_description: `user viewed the ${tabParam} help tab`,
    })

  return {
    unavailableItemsPolicyLinkClickLog,
    backToHelpGuideLog,
    backFromAdminMediaReviewHelpLog,
    helpTabViewLog,
  }
}

export const mediaReviewHelpLogs = {
  getMediaReviewHelpLogs,
}
