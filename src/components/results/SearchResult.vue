a
<script setup lang="ts">
import TextBlock from '@/components/truncated/TextBlock.vue'
import ButtonsContainer from '@/components/adminButtons/ButtonsContainer.vue'
import AccessButtons from '@/components/AccessButtons.vue'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { getStatus } from '@/utils/helpers'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'
import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import BibliographicalData from '@/components/results/BibliographicalData.vue'
import { ref, computed } from 'vue'

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
  small: Boolean,
  buttonName: {
    type: String,
    default: 'Cancel',
  },
  pdfView: Boolean,
})

const coreStore = useCoreStore()
const { reqs } = storeToRefs(coreStore)

const userStore = useUserStore()
const { featureDetails, isAuthenticatedStudent, isAuthenticatedAdmin, groupIDs } =
  storeToRefs(userStore)

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

const showExcessiveRequestsWarningModal = ref(false)
const cartFull = computed(() => reqs.value.length >= 10)
// const parsedReqs = reqs.value.map((req: string) => JSON.parse(req))

const addRequest = (doc: string) => {
  if (!cartFull.value) {
    coreStore.addRequest(doc)
  } else {
    showExcessiveRequestsWarningModal.value = true
  }
}
const status = computed(() => getStatus(props.doc.mediaReviewStatuses, groupIDs.value))
const canRequest = computed(() => {
  return (
    !reqs.value.includes(JSON.stringify(props.doc)) &&
    status.value !== 'approved' &&
    status.value !== 'pending' &&
    userStore.features['submit_requests'] &&
    !props.hideRequests
  )
})
const emit = defineEmits(['close', 'approvalSubmitted', 'denialSubmitted', 'blockSubmitted'])
const readRoute = ref(
  (featureDetails.value['view_document'] || {}).enabled
    ? `/page/${props.doc.iid}/0`
    : `/pdf/${props.doc.iid}`,
)
</script>
<template>
  <div class="search-result">
    <div class="pr-6">
      <BibliographicalData
        :doc="doc"
        :small="small"
      />

      <!-- Text Details -->
      <div v-if="!hideDetails">
        <!-- Semantic Terms -->
        <div v-if="doc.semanticTerms">
          <b>Topics: </b>
          <span
            v-for="(topic, key) in doc.semanticTerms"
            :key="key"
          >
            <a
              href="#"
              @click.prevent.stop="searchFor(topic)"
            >{{ topic }}</a><span v-if="key + 1 != doc.semanticTerms.length">, </span>
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
        <div
          v-if="(doc.snippets || []).length && !hideSnippets"
          class="mt-4"
        >
          <div
            v-for="(snip, i) in doc.snippets"
            :key="`snippet_${i}`"
            class="text-size-sm"
          >
            <!-- eslint-disable vue/no-v-html -->
            <small v-if="snip.text">
              ...
              <span
                :class="{ 'text-size-xs': small }"
                v-html="snip.text"
              />
              ...
            </small>
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </div>
      </div>
    </div>

    <!-- Media Review -->
    <div :class="hideButtons ? 'mt-3' : 'mt-6'">
      <!-- Student Buttons -->
      <div
        v-if="isAuthenticatedStudent && !hideButtons"
        class="display-flex justify-content-end flex-direction-column"
      >
        <pep-pharos-button
          v-if="canRequest"
          full-width
          class="mb-2"
          icon-left="checkmark-inverse"
          @click.prevent.stop="addRequest(JSON.stringify(doc))"
        >
          <span class="text-align-center">Request This</span>
        </pep-pharos-button>
        <pep-pharos-button
          v-else-if="reqs.includes(JSON.stringify(doc)) && !hideRequests"
          full-width
          class="mb-2"
          icon-left="close-inverse"
          variant="secondary"
          @click.prevent.stop="coreStore.removeRequest(JSON.stringify(doc))"
        >
          <span>{{ buttonName }}</span>
        </pep-pharos-button>
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
        <!-- We want to re-render the admin buttons after a new search, because the statuses
        may have been updated. -->
        <ButtonsContainer
          v-if="!hideButtons"
          :key="searchResultsKey"
          :pdf-view="pdfView"
          :doc="doc"
          :include-pdf="includePdf"
          @approval-submitted="emit('approvalSubmitted')"
          @denial-submitted="emit('denialSubmitted')"
          @block-submitted="emit('blockSubmitted')"
        />
      </div>

      <!-- Statuses -->
      <div
        v-if="!hideStatuses"
        class="display-flex justify-content-end flex-direction-column"
      >
        <span
          v-for="(statusData, key) in doc.mediaReviewStatuses"
          :key="`status_${key}`"
        >
          <p>
            <small :class="{ 'text-size-xs': small }">
              <strong>Status:&nbsp;</strong>
              <span>{{ statusData.statusLabel || statusData.status }}</span><span v-if="isAuthenticatedAdmin">&nbsp;({{ statusData.groupName }})</span> <br>
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
                    {{ statusData.statusDetails!.reason }} -&nbsp;
                  </span>
                  <span>{{ statusData.statusDetails!.comments }}</span>
                </span>
              </span>
            </small>
          </p>
        </span>
      </div>
    </div>
    <Teleport to="div#app">
      <pep-pharos-modal
        v-if="showExcessiveRequestsWarningModal"
        :id="`excessive-requests-warning-modal`"
        :key="`excessive-requests-warning-modal`"
        :header="`Too Many Requests`"
        size="large"
        :open="showExcessiveRequestsWarningModal"
        @pharos-modal-closed="showExcessiveRequestsWarningModal = false"
      >
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <div slot="description">
          <p class="mb-4">
            Your cart is full. Please remove an item or submit your current requests before adding
            more.
          </p>
          <p>
            Media review can be time consuming. Reviewers may deny requests or limit access at times
            when they are dealing with requests they deem excessive.
          </p>
        </div>
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <template slot="footer">
          <pep-pharos-button
            variant="primary"
            @click.prevent.stop="showExcessiveRequestsWarningModal = false"
          >
            Cancel
          </pep-pharos-button>
        </template>
      </pep-pharos-modal>
    </Teleport>
  </div>
</template>
