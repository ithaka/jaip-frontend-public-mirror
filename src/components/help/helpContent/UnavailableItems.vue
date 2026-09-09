<script setup lang="ts">
import { useRouter } from 'vue-router'
import itemUnavailableExample from '@/assets/images/item-unavailable.png'
import { useLogger } from '@/composables/logging/useLogger'
import { changeRoute } from '@/utils/helpers'

const router = useRouter()
const { handleWithLog, logs } = useLogger()
const { unavailableItemsPolicyLinkClickLog } = logs.getMediaReviewHelpLogs()
</script>
<template>
  <div class="help-tab__inner">
    <pep-pharos-heading :level="2" preset="4--bold"> Unavailable Items</pep-pharos-heading>
    <p>
      JSTOR contains millions of articles and chapters, and whether a single document is available
      inside a specific facility is determined by the Department of Corrections responsible for that
      facility. Usually, only a tiny fraction of all of the items in JSTOR will be unavailable.
    </p>
    <pep-pharos-heading :level="3" preset="4--bold">
      How do I know if an item is unavailable?
    </pep-pharos-heading>
    <p>
      Unavailable items will appear with the message "Item unavailable." This means the item didn't
      meet your facility's review criteria.
    </p>
    <img
      :src="itemUnavailableExample"
      alt="Example result indicating 'Item unavailable' with link to help text."
      class="help-tab__image help-tab__image--unavailable-example"
    />
    <pep-pharos-heading :level="3" preset="4--bold">
      Considerations that inform availability
    </pep-pharos-heading>
    <p>
      DOC administrators use a variety of frameworks, policies, and rubrics to assess whether access
      to material can be granted. Together, these guidelines help administrators weigh student and
      reader rights against the risk that a given item might threaten security, good order,
      discipline, or rehabilitation. These factors can be complicated, and administrators at each
      facility are responsible for decisions that affect the people in their custody.
    </p>
    <p>
      One of the frameworks that DOC administrators use was developed by Ithaka S+R, part of the
      nonprofit ITHAKA (ITHAKA is also JSTOR’s parent organization). Ithaka S+R studied media review
      policies across state prison systems and published a model policy meant to strengthen content
      protections for educational, informative, and recreational material. You can
      <pep-pharos-link
        @click.prevent.stop="
          handleWithLog(unavailableItemsPolicyLinkClickLog, () =>
            changeRoute(
              router,
              undefined,
              '/help/media-review-policy',
              '',
              0,
              undefined,
              undefined,
              undefined,
            ),
          )
        "
        >read the model media review policy here</pep-pharos-link
      >
      to get a deeper understanding of the factors that determine availability.
    </p>
  </div>
</template>
<style scoped lang="scss">
.help-tab__inner {
  max-width: 100%;
  p {
    padding-bottom: var(--pharos-spacing-2-x);
  }

  .help-tab__image--unavailable-example {
    margin: 0 auto var(--pharos-spacing-2-x) 0;
    max-width: 20rem;
    border: 1px solid var(--pharos-color-gray-300);
  }
}
</style>
