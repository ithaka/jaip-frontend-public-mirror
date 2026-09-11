<script setup lang="ts">
import { useRouter } from 'vue-router'
import itemUnavailableExample from '@/assets/images/item-unavailable.png'
import { useLogger } from '@/composables/logging/useLogger'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'
import { changeRoute } from '@/utils/helpers'

const router = useRouter()
const { handleWithLog, logs } = useLogger()
const { backFromAdminMediaReviewHelpLog, unavailableItemsPolicyLinkClickLog } =
  logs.getMediaReviewHelpLogs()

const { logPageView } = usePageViewLogger()
logPageView()

const goBack = () => {
  router.back()
}
</script>

<template>
  <pep-pharos-layout row-gap="0">
    <div class="admin-media-review-help">
      <div class="admin-media-review-help__back">
        <pep-pharos-link
          flex
          class="admin-media-review-help__back-link"
          data-cy="admin-media-review-help-back-link"
          @click.prevent="handleWithLog(backFromAdminMediaReviewHelpLog, goBack)"
        >
          <pep-pharos-icon
            class="admin-media-review-help__back-icon"
            name="arrow-left"
            a11y-hidden="true"
          >
          </pep-pharos-icon>
          Back
        </pep-pharos-link>
      </div>
      <div class="admin-media-review-help__content">
        <pep-pharos-heading :level="2" preset="4--bold" class="admin-media-review-help__title">
          Unavailable Items
        </pep-pharos-heading>
        <div class="admin-media-review-help__body">
          <p>
            JSTOR contains millions of articles and chapters, and whether a single document is
            available inside a specific facility is determined by the Department of Corrections
            responsible for that facility. Usually, only a tiny fraction of all of the items in
            JSTOR will be unavailable.
          </p>

          <pep-pharos-heading :level="3" preset="4--bold">
            How do I know if an item is unavailable?
          </pep-pharos-heading>
          <p>
            Unavailable items will appear with the message "Item unavailable." This means the item
            didn't meet your facility's review criteria.
          </p>
          <img
            :src="itemUnavailableExample"
            alt="Example result indicating 'Item unavailable' with link to help text."
            class="admin-media-review-help__image"
          />
          <pep-pharos-heading :level="3" preset="4--bold">
            Considerations that inform availability
          </pep-pharos-heading>
          <p>
            DOC administrators use a variety of frameworks, policies, and rubrics to assess whether
            access to material can be granted. Together, these guidelines help administrators weigh
            student and reader rights against the risk that a given item might threaten security,
            good order, discipline, or rehabilitation. These factors can be complicated, and
            administrators at each facility are responsible for decisions that affect the people in
            their custody.
          </p>
          <p>
            One of the frameworks that DOC administrators use was developed by Ithaka S+R, part of
            the nonprofit ITHAKA (ITHAKA is also JSTOR’s parent organization). Ithaka S+R studied
            media review policies across state prison systems and published a model policy meant to
            strengthen content protections for educational, informative, and recreational material.
            You can
            <pep-pharos-link
              @click.prevent.stop="
                handleWithLog(unavailableItemsPolicyLinkClickLog, () =>
                  changeRoute(router, { path: '/help/media-review-policy', term: '', page: 0 }),
                )
              "
              >read the model media review policy here</pep-pharos-link
            >
            to get a deeper understanding of the factors that determine availability.
          </p>
        </div>
      </div>
    </div>
  </pep-pharos-layout>
</template>

<style scoped lang="scss">
.admin-media-review-help {
  display: grid;
  grid-column: span 12;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 0;
  margin-bottom: var(--pharos-spacing-1-x);

  @media screen and (max-width: 1056px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media screen and (max-width: 768px) {
    grid-column: span 8;
  }
  @media screen and (max-width: 360px) {
    grid-column: span 4;
  }

  &__back {
    display: flex;
    grid-column: 2 / -2;
    align-items: center;
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);

    @media screen and (max-width: 1056px) {
      grid-column: 1 / -1;
    }

    &-link {
      gap: var(--pharos-spacing-one-half-x);
    }
  }

  &__content {
    grid-column: 2 / -2;
    margin-top: var(--pharos-spacing-1-x);

    @media screen and (max-width: 1056px) {
      grid-column: 1 / -1;
    }

    &:last-child {
      margin-bottom: var(--pharos-spacing-1-x);
    }
  }

  &__title {
    margin-bottom: var(--pharos-spacing-1-x);
  }

  &__body {
    line-height: 1.55;
    word-break: break-word;

    p {
      margin-bottom: var(--pharos-spacing-1-x);
    }

    ol {
      list-style: decimal;
      list-style-position: outside;
      margin: 0 0 var(--pharos-spacing-2-x) var(--pharos-spacing-2-x);
      padding-left: var(--pharos-spacing-one-half-x);
    }

    li {
      margin-bottom: var(--pharos-spacing-one-half-x);
    }
  }

  &__paragraph {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--pharos-spacing-1-x);
  }

  &__image {
    margin: 0 auto var(--pharos-spacing-2-x) 0;
    max-width: 20rem;
    border: 1px solid var(--pharos-color-gray-300);
  }
}
</style>
