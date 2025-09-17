<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'

import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import type { PropType } from 'vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import {
  makeGrammaticalList,
  arraysAreEqual,
  hideButton,
  getGroupsWithStatus,
} from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import { changeRoute } from '@/utils/helpers'
import type { Group, GroupSelection } from '@/interfaces/Group'
import { DenialReasons } from '@/interfaces/MediaReview'

const coreStore = useCoreStore()
const searchStore = useSearchStore()
const userStore = useUserStore()
const { reviewStatus, searchTerms, pageNo } = storeToRefs(searchStore)
const { featureDetails, selectedGroups, entityName, groupMap } = storeToRefs(userStore)

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
})

const isSingleGroup = userStore.isSingleGroupFeature('deny_requests')
const statuses = ref(props.doc.mediaReviewStatuses)
const showDeny = !hideButton(featureDetails.value, statuses.value, 'denied', 'deny_requests')
const showDenyModal = ref(false)
const denyModalKey = ref(0)
const denyGroups = ref(
  isSingleGroup
    ? featureDetails.value['deny_requests']?.groups
    : getGroupsWithStatus(statuses.value, 'denied'),
)
const reasons = [
  DenialReasons.Sex,
  DenialReasons.Instruction,
  DenialReasons.Violence,
  DenialReasons.Order,
  DenialReasons.Incomplete,
]
const selectedReason = ref(DenialReasons.Sex as DenialReasons | string)
const otherReason = ref('')
const comments = ref('')
const invalidComments = ref('')
const invalidReason = ref(false)

const handleReasonInput = (e: InputFileEvent) => {
  otherReason.value = e.target.value
  selectedReason.value = otherReason.value
}
const handleCommentInput = (e: InputFileEvent) => {
  comments.value = e.target.value
  if (!comments.value.trim()) {
    invalidComments.value = 'Additional details are required'
  } else if (comments.value.trim().length < 2) {
    invalidComments.value = 'Please provide additional information'
  } else if (comments.value.length > 3000) {
    invalidComments.value = 'Please enter a shorter comment'
  } else {
    invalidComments.value = ''
  }
}
const handleSelectedReason = (e: InputFileEvent) => {
  selectedReason.value = e.target.value.trim()
  invalidReason.value = !selectedReason.value
}

const openDenyModal = () => {
  denyModalKey.value++
  showDenyModal.value = true
}
const closeDenyModal = () => {
  showDenyModal.value = false
  denyModalKey.value++
}

selectedGroups.value['deny_requests'] = []
const selectorGroupOptions = ref(
  featureDetails.value['deny_requests']?.groups.reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[]) || [],
)

const handleGroupChange = (event: GroupSelection) => {
  denyGroups.value = event.groups
}

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['denialSubmitted', 'close'])

const selectAllGroups = () => {
  selectedGroups.value['deny_requests'] = featureDetails.value['deny_requests']?.groups || []
}
if (featureDetails.value['deny_requests']?.groups.length === 1) {
  selectAllGroups()
}

const handleDenial = async () => {
  if (!comments.value) {
    invalidComments.value = 'Additional details are required'
    return
  } else if (!selectedReason.value) {
    invalidReason.value = true
    return
  } else if (invalidComments.value || invalidReason.value) {
    return
  } else if (
    !selectedGroups.value['deny_requests'] ||
    !selectedGroups.value['deny_requests'].length
  ) {
    return
  }
  const args = {
    doi: props.doc.doi,
    groups: selectedGroups.value['deny_requests'],
    reason: selectedReason.value.trim(),
    comments: comments.value.trim(),
  }
  try {
    if (selectedReason.value === DenialReasons.Incomplete) {
      await coreStore.$api.approvals.incomplete(args)
    } else {
      await coreStore.$api.approvals.deny(args)
    }
    const msg = 'Your denial has been submitted.'
    coreStore.toast(msg, 'success')
    searchStore.doSearch(route.path === '/requests' ? reviewStatus.value : '', false)
    emit('denialSubmitted')
    if (route.path.startsWith('/pdf') || route.path.startsWith('/page')) {
      changeRoute(router, emit, '/requests', searchTerms.value, pageNo.value, undefined, undefined)
    }
    coreStore.$api.log({
      eventtype:
        selectedReason.value === DenialReasons.Incomplete
          ? 'pep_incomplete_submitted'
          : 'pep_denial_submitted',
      event_description:
        selectedReason.value === DenialReasons.Incomplete
          ? 'user submitted incomplete'
          : 'user submitted denial',
      dois: [args.doi],
      groups: args.groups,
      reason: args.reason,
      comments: args.comments,
    })
  } catch {
    const msg = 'There was an error and your denial was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeDenyModal()
  }
}
</script>

<template>
  <pep-pharos-button
    v-if="showDeny"
    full-width
    class="mb-2 lg-mr-3"
    icon-left="checkmark-inverse"
    :data-modal-id="`deny-modal-${doc.iid}`"
    variant="secondary"
    @click.prevent.stop="openDenyModal"
  >
    <span>Deny</span>
  </pep-pharos-button>
  <Teleport to="body">
    <pep-pharos-modal
      :id="`deny-modal-${doc.iid}`"
      :key="denyModalKey"
      header="Deny material"
      :open="showDenyModal"
    >
      <p slot="description" class="mb-3">
        What is your reason to deny access
        <span v-if="doc.title">to <em v-html="doc.title" /></span
        ><span v-if="!denyGroups?.length">?</span>
        <span v-if="denyGroups?.length"
          >&nbsp;for
          {{
            makeGrammaticalList(denyGroups.map((group) => (groupMap.get(group) || {}).name || ''))
          }}?</span
        >
      </p>

      <div v-if="(featureDetails['deny_requests']?.groups?.length || 0) > 1" class="mb-3">
        <GroupSelector
          :groups="selectorGroupOptions"
          :feature-name="'deny_requests'"
          :start-full="false"
          multiple
          @change="handleGroupChange"
        />
      </div>
      <pep-pharos-radio-group
        :value="selectedReason"
        class="mb-6"
        required
        @input="handleSelectedReason"
      >
        <span slot="legend"> Reason </span>
        <pep-pharos-radio-button
          v-for="(reason, index) in reasons"
          :key="`reason_${index}`"
          :value="reason"
          :checked="reason === selectedReason"
        >
          <span slot="label">
            <span class="display-flex align-items-center">
              {{ reason }}
              <span v-if="reason === DenialReasons.Incomplete">
                <pep-pharos-icon
                  :data-tooltip-id="`incomplete_explanation`"
                  name="question-inverse"
                  :a11y-title="'Incomplete Reason Explanation'"
                  class="mt-0 pl-2 fill-gray-40 small-icon"
                  role="button"
                  tabindex="0"
                  :aria-describedby="`incomplete_explanation`"
                />
                <pep-pharos-tooltip :id="`incomplete_explanation`" placement="top">
                  <span
                    >Selecting this option will list the item as Incomplete rather than
                    Denied.</span
                  >
                </pep-pharos-tooltip>
              </span>
            </span>
          </span>
        </pep-pharos-radio-button>
        <pep-pharos-radio-button :value="otherReason" :checked="otherReason === selectedReason">
          <span slot="label">
            Other:
            <pep-pharos-text-input
              :value="otherReason"
              :invalidated="invalidReason"
              :message="invalidReason ? 'A reason is required' : ''"
              :hideLabel="true"
              placeholder="Describe reason"
              @focus="selectedReason = otherReason"
              @input="handleReasonInput"
              @click.prevent.stop
              ><span slot="label" class="sr-only"> Describe reason </span>
            </pep-pharos-text-input>
          </span>
        </pep-pharos-radio-button>
      </pep-pharos-radio-group>

      <pep-pharos-textarea
        :value="comments"
        :invalidated="invalidComments.length"
        :message="invalidComments"
        placeholder="Contains a map of the area on page 46."
        class="mb-4"
        required
        @input="handleCommentInput"
      >
        <span slot="label"> Notes </span>
      </pep-pharos-textarea>

      <p>
        <span
          >The record will show that {{ entityName }} denied <em>{{ doc.title }}</em> on
          {{ new Date().toLocaleDateString() }}</span
        >
        <span v-if="denyGroups?.length"
          >&nbsp;for use in
          {{
            makeGrammaticalList(
              selectedGroups['deny_requests']?.map((id) => (groupMap.get(id) || {}).name || '') ||
                [],
            )
          }}</span
        >
        <span>.</span>
      </p>

      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="closeDenyModal">
        Cancel
      </pep-pharos-button>

      <pep-pharos-button
        slot="footer"
        :disabled="
          !selectedGroups['deny_requests'] ||
          !selectedGroups['deny_requests'].length ||
          !denyGroups?.length ||
          arraysAreEqual(denyGroups, getGroupsWithStatus(statuses, 'denied'))
        "
        @click.prevent.stop="handleDenial"
      >
        Deny
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
