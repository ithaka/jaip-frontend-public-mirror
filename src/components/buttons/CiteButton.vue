<script setup lang="ts">
import { useCitationsStore } from '@/stores/citations'
import ModalSheet from '@/components/popups/ModalSheet.vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLogger } from '@/composables/logging/useLogger'
import type { CitationsResponse, CitationTypes } from '@/interfaces/Citations'
import { CitationTypeOptions } from '@/interfaces/Citations'
import { useRouter } from 'vue-router'
import { getStatus } from '@/utils/helpers'
import { useUserStore } from '@/stores/user'
import { useBreakpoints } from '@/composables/breakpoints'
import CopyButton from '@/components/buttons/CopyButton.vue'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
  hideRequests: Boolean,
  buttonLabel: {
    type: String,
    default: 'Cite',
  },
  fullWidth: {
    type: Boolean,
    default: true,
  },
})

// Stores
const citationsStore = useCitationsStore()
const { citations, gettingCitations } = storeToRefs(citationsStore)
const userStore = useUserStore()
const { groupIDs } = storeToRefs(userStore)

// Router
const router = useRouter()

// Logging
const { handleWithLog, logs } = useLogger()
const citationDois = [props.doc.doi]

// Citing Scholarly Work help route. Shared between router.push and the
// navigation log so the logged destination always matches the actual route.
const citationsHelpRouteName = 'help'
const citationsHelpTab = 'research-basics'
const citationsHelpHash = '#citing-scholarly-work'
const citationsHelpDestination = `/${citationsHelpRouteName}/${citationsHelpTab}${citationsHelpHash}`

const { openCitationsModalLog } = logs.getCiteButtonLogs({ dois: citationDois })
const { citationsLearnMoreLinkClickLog } = logs.getCitationsNavigationLogs({
  dois: citationDois,
  destination: citationsHelpDestination,
})

// State
const showCitationsModal = ref(false)
const showCitationType = ref<CitationTypes>(CitationTypeOptions.MLA)
const hasDismissedCitationError = ref(false)
const hasCopyError = ref(false)
const copyErrorAlertText = ref(
  'Sorry, copy may not be available on this device. Try again. If the issue persists, contact your administrator.',
)

const citationTypes: { type: CitationTypes; label: string }[] = [
  { type: CitationTypeOptions.MLA, label: 'MLA' },
  { type: CitationTypeOptions.CHICAGO, label: 'Chicago' },
  { type: CitationTypeOptions.APA, label: 'APA' },
]

// Computed
const currentCitations = computed<CitationsResponse>(
  () =>
    (props.doc.iid && citations.value[props.doc.iid]) || {
      apa: '',
      mla: '',
      chicago: '',
      has_error: false,
      error_message: '',
    },
)

const showCitationError = computed(
  () => currentCitations.value.has_error && !hasDismissedCitationError.value,
)

const selectedCitationLabel = computed(
  () =>
    citationTypes.find((citationType) => citationType.type === showCitationType.value)?.label ??
    'Citation',
)

const selectedCitationCopyText = computed(() => {
  const citationHtml = currentCitations.value[showCitationType.value] || ''
  if (!citationHtml) {
    return ''
  }

  if (typeof document === 'undefined') {
    return citationHtml
  }

  const citationContainer = document.createElement('div')
  citationContainer.innerHTML = citationHtml
  return citationContainer.innerText || citationContainer.textContent || ''
})

const isPending = computed(() => {
  const status = getStatus(props.doc.mediaReviewStatuses, groupIDs.value)
  return status === 'pending'
})

const isRestricted = computed(() => {
  const status = getStatus(props.doc.mediaReviewStatuses, groupIDs.value)
  return status === 'restricted'
})

// Functions
/**
 * Fetches the citations for the current document from the store, unless they
 * are already cached or the document has no `iid`.
 *
 * @returns {Promise<void>} Resolves once the citations have been fetched, or
 * immediately if the document has no `iid` or the citations are already cached.
 */
const getCitations = async () => {
  if (!props.doc.iid) {
    return
  }
  if (citations.value[props.doc.iid]) {
    return
  }
  await citationsStore.getCitations(props.doc.iid)
}

/**
 * Opens the citations modal, resetting the selected style to MLA and
 * triggering a fetch of the document's citations.
 *
 * @returns {void}
 */
const openCitationsDisplay = () => {
  showCitationType.value = CitationTypeOptions.MLA
  hasDismissedCitationError.value = false
  hasCopyError.value = false
  getCitations()
  showCitationsModal.value = true
}

/**
 * Closes the modal and navigates to the "Citing Scholarly Work" section of
 * the research basics help page, preserving the current query.
 *
 * @returns {Promise<void>} Resolves once the router navigation has completed.
 */
const openCitingScholarlyWork = async () => {
  showCitationsModal.value = false
  await router.push({
    name: citationsHelpRouteName,
    params: { tab: citationsHelpTab },
    query: router.currentRoute.value.query,
    hash: citationsHelpHash,
  })
}

/**
 * Builds the public PDF URL for the current document, or an empty string when
 * the document has no `iid`.
 *
 * @returns {string} The absolute PDF URL for the document, or an empty string
 * when the document has no `iid`.
 */
const getCitationUrl = () => {
  if (props.doc.iid) {
    return `${window.location.origin}/pdf/${props.doc.iid}`
  }
  return ''
}

/**
 * Records that the citation retrieval error alert was dismissed via the
 * built-in Pharos close button so it stays hidden until the sheet is reopened.
 *
 * @returns {void}
 */
const handleCitationErrorAlertClosed = () => {
  hasDismissedCitationError.value = true
}

/**
 * Shows the copy-related error alert when clipboard support is unavailable or
 * a copy attempt fails.
 *
 * @returns {void}
 */
const handleCopyError = () => {
  hasCopyError.value = true
}

/**
 * Clears the copy-related error alert after a successful copy action.
 *
 * @returns {void}
 */
const handleCopySuccess = () => {
  hasCopyError.value = false
}

/**
 * Clears the copy-related error alert when the user dismisses it with the
 * built-in Pharos close button.
 *
 * @returns {void}
 */
const handleCopyErrorAlertClosed = () => {
  hasCopyError.value = false
}
const { atMostSmall } = useBreakpoints()
</script>
<template>
  <div
    v-if="!isRestricted"
    class="cite-button-container"
    :class="{ 'cite-button-container--full-width': fullWidth }"
  >
    <div>
      <pep-pharos-button
        full-width
        icon-left="cite"
        :variant="isPending ? 'primary' : 'secondary'"
        a11y-label="Cite"
        data-cy="cite-button"
        :data-sheet-id="`citations-display-${props.doc.iid}`"
        @click.prevent.stop="handleWithLog(openCitationsModalLog, openCitationsDisplay)"
      >
        <span class="text-align-center">{{ buttonLabel }}</span>
      </pep-pharos-button>
    </div>
    <ModalSheet
      :id="`citations-display-${props.doc.iid}`"
      :header="`Cite this item`"
      size="medium"
      :min-height="600"
      :open="showCitationsModal"
      :has-close="true"
      :expanded="true"
      :breakpoint="atMostSmall"
      @close="showCitationsModal = false"
    >
      <div class="citation">
        <pep-pharos-toggle-button-group
          class="citation__toggle-button-group"
          group-label="Citation style"
        >
          <!-- The keydown events need to be stopped here so that selection works without
           propagating up to the sheet component, which would close it. -->
          <pep-pharos-toggle-button
            v-for="citationType in citationTypes"
            :id="`view_citations_${citationType.type}`"
            :key="citationType.type"
            @click.prevent.stop="showCitationType = citationType.type"
            @keydown.enter.stop
            @keydown.space.stop
          >
            {{ citationType.label }}
          </pep-pharos-toggle-button>
        </pep-pharos-toggle-button-group>
        <div>
          <div v-if="showCitationError">
            <pep-pharos-alert
              status="error"
              :closable="true"
              class="citation__error"
              @pharos-alert-closed="handleCitationErrorAlertClosed"
            >
              <span
                >Sorry, we were unable to cite this item. Try again. If the issue persists, contact
                your administrator.</span
              >
            </pep-pharos-alert>
          </div>
          <div v-if="hasCopyError">
            <pep-pharos-alert
              status="error"
              :closable="true"
              class="citation__error"
              @pharos-alert-closed="handleCopyErrorAlertClosed"
            >
              <span>{{ copyErrorAlertText }}</span>
            </pep-pharos-alert>
          </div>
          <pep-pharos-heading class="citation__label" preset="legend" :level="3">
            {{ selectedCitationLabel }}
          </pep-pharos-heading>
          <div class="citation__content-row">
            <div class="citation__text">
              <div
                v-if="currentCitations[showCitationType]"
                v-html="currentCitations[showCitationType]"
              ></div>
              <div v-else-if="gettingCitations[props.doc.iid]">Loading...</div>
              <div v-else>No citation available.</div>
            </div>
            <CopyButton
              v-if="showCitationsModal"
              :tooltip-id="`copy-citation-tooltip-${props.doc.iid}`"
              :copy-text="selectedCitationCopyText"
              :dois="[props.doc.doi]"
              copy-context="citation"
              @clipboard-unavailable="handleCopyError"
              @copy-error="handleCopyError"
              @success="handleCopySuccess"
            />
          </div>
          <p class="citation__note">
            <strong>Note:</strong>
            Always review your references and make any necessary corrections before using. Pay
            attention to names, capitalization, and dates. Consult your instructor for specific
            requirements.
            <pep-pharos-link
              @click.prevent="
                handleWithLog(citationsLearnMoreLinkClickLog, openCitingScholarlyWork)
              "
            >
              Learn more
            </pep-pharos-link>
          </p>
        </div>
        <div v-if="props.doc.iid">
          <div class="divider">or</div>
          <div>
            <pep-pharos-heading class="citation__label" preset="legend" :level="3">
              copy/search to find this item
            </pep-pharos-heading>
            <div class="citation__content-row">
              <div class="citation__text">
                <div v-if="props.doc.iid">
                  {{ getCitationUrl() }}
                </div>
                <div v-else>No title available.</div>
              </div>
              <CopyButton
                v-if="showCitationsModal"
                :tooltip-id="`copy-url-tooltip-${props.doc.iid}`"
                :copy-text="getCitationUrl()"
                :dois="[props.doc.doi]"
                copy-context="citation_url"
                @clipboard-unavailable="handleCopyError"
                @copy-error="handleCopyError"
                @success="handleCopySuccess"
              />
            </div>
          </div>
        </div>
      </div>
    </ModalSheet>
  </div>
</template>
<style lang="scss" scoped>
.citation {
  &__toggle-button-group {
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);
  }
  &__content-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--pharos-spacing-three-quarters-x);
  }
  &__label {
    color: var(--pharos-color-black);
  }
  &__text {
    border: 1px solid var(--pharos-color-marble-gray-50);
    border-radius: var(--pharos-border-radius-small);
    background-color: var(--pharos-color-background-base);
    padding: var(--pharos-spacing-one-half-x) var(--pharos-spacing-three-quarters-x);
    word-break: break-word;
    color: var(--pharos-color-black);
  }
  &__note {
    margin-top: var(--pharos-spacing-2-x);
    color: var(--pharos-color-black);
  }
  &__error {
    margin-bottom: var(--pharos-spacing-2-x);
    color: var(--pharos-color-black);
  }
  @media (max-width: 22.5rem) {
    &__toggle-button-group {
      margin-bottom: var(--pharos-spacing-1-x);
    }
    &__note {
      margin-top: var(--pharos-spacing-one-and-a-half-x);
    }
    &__error {
      margin-bottom: var(--pharos-spacing-one-and-a-half-x);
    }
  }
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  font-weight: bold;
  margin-top: var(--pharos-spacing-2-x);
  margin-bottom: var(--pharos-spacing-2-x);
  color: var(--pharos-color-black);
  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--pharos-color-marble-gray-40);
  }
  &::before {
    margin-right: var(--pharos-spacing-1-x);
  }
  &::after {
    margin-left: var(--pharos-spacing-1-x);
  }
  @media (max-width: 22.5rem) {
    margin-top: var(--pharos-spacing-one-and-a-half-x);
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);
  }
}
.cite-button-container {
  max-width: fit-content;
  justify-self: center;
  &--full-width {
    width: 100%;
    max-width: 100%;
  }
}
</style>
