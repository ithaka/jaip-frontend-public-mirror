a
<script setup lang="ts">
import TextBlock from '@/components/truncated/TextBlock.vue'
import ButtonsContainer from '@/components/buttons/adminButtons/ButtonsContainer.vue'
import AccessButtons from '@/components/AccessButtons.vue'
import { useUserStore } from '@/stores/user'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { getStatus } from '@/utils/helpers'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { ComputedRef, PropType } from 'vue'
import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import BibliographicalData from '@/components/results/BibliographicalData.vue'
import { ref, computed } from 'vue'
import UnrestrictButton from '@/components/buttons/adminButtons/UnrestrictButton.vue'
import RequestButton from '../buttons/RequestButton.vue'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
  hideDetails: Boolean,
  hideAbstract: Boolean,
  hideDescription: Boolean,
  hideSnippets: Boolean,
  hideButtons: Boolean,
  hideRequests: Boolean,
  hideStatuses: Boolean,
  hideAccess: Boolean,
  includePdf: Boolean,
  isRestrictedList: Boolean,
  small: Boolean,
  buttonName: {
    type: String,
    default: 'Cancel',
  },
  pdfView: Boolean,
})

const userStore = useUserStore()
const {
  featureDetails,
  isAuthenticatedStudent,
  isAuthenticatedAdmin,
  groupIDs,
  hasPossibleSubscriptionFacilities,
  canViewRestrictedList,
  hasUnsubscribedFacilities,
  ungroupedFeatures,
} = storeToRefs(userStore)

const searchStore = useSearchStore()
const { searchTerms, pageNo, searchResultsKey } = storeToRefs(searchStore)

const router = useRouter()
const searchFor = (term: string) => {
  router.push({
    path: '/search',
    query: {
      term: term,
      page: 1,
    },
  })
}

const status = computed(() => getStatus(props.doc.mediaReviewStatuses, groupIDs.value))
const emit = defineEmits(['close', 'approvalSubmitted', 'denialSubmitted', 'restrictSubmitted'])
const readRoute = ref(
  (featureDetails.value['view_document'] || {}).enabled
    ? `/page/${props.doc.iid}/0`
    : `/pdf/${props.doc.iid}`,
)

const showRestrictedLabel: ComputedRef<boolean> = computed(() => {
  return !!(
    props.doc.is_restricted &&
    canViewRestrictedList.value &&
    !hasPossibleSubscriptionFacilities.value
  )
})
const showRestrictedAlert: ComputedRef<boolean> = computed(() => {
  return !!(props.doc.is_restricted && hasPossibleSubscriptionFacilities.value)
})

const hideSearchSnippets: ComputedRef<boolean> = computed(() => {
  return !!((props.doc.is_restricted && isAuthenticatedStudent.value) || props.hideSnippets)
})

const showReviewerAccess = computed(() => {
  return (
    isAuthenticatedAdmin.value &&
    props.doc.is_restricted &&
    !hasUnsubscribedFacilities.value &&
    !props.pdfView &&
    !ungroupedFeatures.value['manage_restricted_list']
  )
})
const showReaderRestrictedLabel = computed(() => {
  return (
    isAuthenticatedAdmin.value &&
    props.doc.is_restricted &&
    !hasUnsubscribedFacilities.value &&
    props.pdfView
  )
})
</script>
<template>
  <div class="search-result">
    <div class="pr-6">
      <BibliographicalData :doc="doc" :small="small" :show-restricted-label="showRestrictedLabel" />

      <!-- Text Details -->
      <div v-if="!hideDetails">
        <!-- Semantic Terms -->
        <div v-if="doc.semanticTerms">
          <b>Topics: </b>
          <span v-for="(topic, key) in doc.semanticTerms" :key="key">
            <a href="#" @click.prevent.stop="searchFor(topic)">{{ topic }}</a
            ><span v-if="key + 1 != doc.semanticTerms.length">, </span>
          </span>
        </div>
        <!-- OCR -->
        <div v-if="doc.ocr">
          {{ doc.ocr }}
        </div>
        <!-- Book Description -->
        <TextBlock
          v-if="doc.book_description && !hideDescription"
          :text="doc.book_description"
          class="text-size-sm mt-4"
          small
        />
        <!-- Abstract -->
        <TextBlock
          v-if="doc.abstract && !hideAbstract"
          :text="doc.abstract"
          class="text-size-sm mt-4"
          small
        />
        <!-- Snippets -->
        <div v-if="(doc.snippets || []).length && !hideSearchSnippets" class="mt-4">
          <div v-for="(snip, i) in doc.snippets" :key="`snippet_${i}`" class="text-size-sm">
            <small v-if="snip.text">
              ...
              <span :class="{ 'text-size-xs': small }" v-html="snip.text" />
              ...
            </small>
          </div>
        </div>
      </div>
      <pep-pharos-alert
        v-if="showRestrictedAlert"
        class="mt-3"
        status="warning"
        icon="exclamation-inverse"
        :dismissible="false"
      >
        <span>
          Item restricted at other facilities.
          <pep-pharos-link
            @click.prevent.stop="
              changeRoute(router, emit, '/account', searchTerms, pageNo, undefined, undefined)
            "
            >Edit facility permissions</pep-pharos-link
          >
          to subscribe to Restricted Items.
        </span>
      </pep-pharos-alert>
    </div>

    <!-- Media Review -->
    <div :class="hideButtons ? 'mt-3' : 'mt-6'">
      <!-- Student Buttons -->
      <div
        v-if="isAuthenticatedStudent && !hideButtons"
        class="display-flex justify-content-end flex-direction-column"
      >
        <RequestButton :doc="doc" :hide-requests="hideRequests" :cancel-button-label="buttonName" />
        <!-- TODO: This won't work as it is, we'll need the actual pdf route and to create a pdf viewer -->
        <pep-pharos-button
          v-if="
            status === 'approved' &&
            !pdfView &&
            ((featureDetails['view_pdf'] || {}).enabled ||
              (featureDetails['view_document'] || {}).enabled)
          "
          full-width
          class="mb-3"
          variant="primary"
          icon-left="filetype-pdf"
          @click.prevent.stop="
            changeRoute(router, emit, readRoute, searchTerms, pageNo, undefined, undefined)
          "
        >
          <span>Read</span>
        </pep-pharos-button>
        <AccessButtons
          v-if="status === 'approved' && !hideAccess"
          :iid="doc.iid"
          variant="secondary"
          column
          :include-pdf="includePdf"
        />
      </div>
      <!-- Admin Buttons -->
      <div v-if="isAuthenticatedAdmin">
        <div v-if="showReviewerAccess">
          <pep-pharos-button
            full-width
            class="mb-2 lg-mr-3"
            variant="secondary"
            icon-left="filetype-pdf"
            @click.prevent.stop="
              changeRoute(router, emit, readRoute, searchTerms, pageNo, undefined, undefined)
            "
          >
            <span>Reviewer Access</span>
          </pep-pharos-button>
        </div>
        <div v-else-if="showReaderRestrictedLabel" class="restricted-label">
          <pep-pharos-heading preset="1--bold" :level="4" class="heading">
            Restricted
          </pep-pharos-heading>
          <p>Item restricted in this facility based on content guidelines.</p>
          <p><strong>Reason:&nbsp;</strong> {{ doc.restricted_reason }}</p>
          <UnrestrictButton :doc="doc" class="restricted-label__button" />
        </div>
        <!-- We want to re-render the admin buttons after a new search, because the statuses
        may have been updated. -->
        <ButtonsContainer
          v-else-if="!hideButtons"
          :key="searchResultsKey"
          :pdf-view="pdfView"
          :doc="doc"
          :include-pdf="includePdf"
          @approval-submitted="emit('approvalSubmitted')"
          @denial-submitted="emit('denialSubmitted')"
          @restrict-submitted="emit('restrictSubmitted')"
        />
      </div>

      <!-- Statuses -->
      <div
        v-if="!hideStatuses && status !== 'restricted'"
        class="display-flex justify-content-end flex-direction-column"
      >
        <span v-for="(statusData, key) in doc.mediaReviewStatuses" :key="`status_${key}`">
          <p>
            <small :class="{ 'text-size-xs': small }">
              <strong>Status:&nbsp;</strong>
              <span>{{ statusData.statusLabel || statusData.status }}</span
              ><span v-if="isAuthenticatedAdmin">&nbsp;({{ statusData.groupName }})</span> <br />
              <span v-if="statusData.createdAt">{{
                new Date(statusData.createdAt).toLocaleDateString()
              }}</span>
              <span v-if="statusData.statusDetails?.reason || statusData.statusDetails?.comments">
                <span
                  v-if="
                    statusData.status.toLowerCase() === 'denied' ||
                    statusData.status.toLowerCase() === 'incomplete' ||
                    isAuthenticatedAdmin
                  "
                >
                  <span
                    v-if="
                      statusData.statusDetails!.reason ||
                      statusData.status.toLowerCase() !== 'incomplete'
                    "
                  >
                    {{ statusData.statusDetails!.reason }}
                    <span v-if="statusData.statusDetails!.comments">-&nbsp;</span>
                  </span>
                  <span>{{ statusData.statusDetails!.comments }}</span>
                </span>
              </span>
            </small>
          </p>
        </span>
      </div>
      <div
        v-else-if="status === 'restricted' && isAuthenticatedStudent"
        class="display-flex justify-content-end flex-direction-column"
      >
        <pep-pharos-heading
          :level="3"
          preset="1--bold"
          no-margin
          class="restricted-label text-align-center"
        >
          <span>Item unavailable</span>
        </pep-pharos-heading>
      </div>
      <div v-if="isRestrictedList">
        <p>{{ doc.restricted_reason }}</p>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.restricted-label {
  border: 1px solid var(--pharos-color-marble-gray-50);
  border-radius: 4px;
  vertical-align: middle;
  padding: var(--pharos-spacing-one-half-x);
  &__button {
    margin-top: var(--pharos-spacing-one-half-x);
  }
  .heading {
    color: var(--pharos-color-living-coral-53);
  }
  p {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }
  span {
    color: var(--pharos-color-marble-gray-20);
  }
}
</style>
