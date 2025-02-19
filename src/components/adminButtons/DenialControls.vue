<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'

import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import type { PropType } from 'vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import {
  makeGrammaticalList,
  arraysAreEqual,
  combineArrays,
  hideButton,
  getGroupsWithStatus,
} from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import type { Group, GroupSelection } from '@/interfaces/Group'

const coreStore = useCoreStore()
const searchStore = useSearchStore()
const userStore = useUserStore()
const { reviewStatus } = storeToRefs(searchStore)
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
    ? featureDetails.value['deny_requests'].groups
    : getGroupsWithStatus(statuses.value, 'denied'),
)
const incompleteReason = 'Missing required information'
const reasons = [
  'Sexually explicit/pornographic',
  'Instructive for explosives, weapons, or escapes',
  'Inflammatory or inciting violence, uprisings, or riots',
  'Detrimental to the good order of the facility or rehabilitation',
  incompleteReason,
]
const selectedReason = ref('Sexually explicit/pornographic')
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
  featureDetails.value['deny_requests'].groups.reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[]),
)

const handleGroupChange = (event: GroupSelection) => {
  denyGroups.value = event.groups
}
const route = useRoute()

const selectAllGroups = () => {
  selectedGroups.value['deny_requests'] = featureDetails.value['deny_requests'].groups
}
if (featureDetails.value['deny_requests'].groups.length === 1) {
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
    if (selectedReason.value === incompleteReason) {
      await coreStore.$api.approvals.incomplete(args)
    } else {
      await coreStore.$api.approvals.deny(args)
    }
    const msg = 'Your denial has been submitted.'
    coreStore.toast(msg, 'success')
    searchStore.doSearch(route.path === '/requests' ? reviewStatus.value : '', false)
    emit('denialSubmitted')
  } catch {
    const msg = 'There was an error and your denial was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeDenyModal()
  }
}
const emit = defineEmits(['denialSubmitted'])
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
      header="Deny Material"
      :open="showDenyModal"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <p slot="description" class="mb-3">
        <!-- eslint-disable-next-line vue/no-v-html  -->
        What is your reason to deny access
        <span v-if="doc.title">to <em v-html="doc.title"></em></span
        ><span v-if="!denyGroups.length">?</span>
        <span v-if="denyGroups.length"
          >&nbsp;for
          {{
            makeGrammaticalList(denyGroups.map((group) => (groupMap.get(group) || {}).name || ''))
          }}?</span
        >
      </p>

      <div v-if="featureDetails['deny_requests'].groups.length > 1" class="mb-3">
        <GroupSelector
          :groups="selectorGroupOptions"
          :feature-name="'deny_requests'"
          :start-full="false"
          multiple
          @change="handleGroupChange"
        />
      </div>
      <pep-pharos-radio-group :value="selectedReason" @input="handleSelectedReason">
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <span slot="legend"> Reason </span>
        <pep-pharos-radio-button
          v-for="(reason, index) in reasons"
          :key="`reason_${index}`"
          :value="reason"
          :checked="reason === selectedReason"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">
            <span class="display-flex align-items-center">
              {{ reason }}
              <span v-if="reason === incompleteReason">
                <pep-pharos-icon
                  :data-tooltip-id="`incomplete_explanation`"
                  name="question-inverse"
                  class="mt-0 pl-2 fill-gray-40 small-icon"
                  :aria-describedby="`incomplete_explanation`"
                />
                <pep-pharos-tooltip :id="`incomplete_explanation`" placement="top">
                  <span class="text-none"
                    >Selecting this option will list the item as Incomplete rather than
                    Denied.</span
                  >
                </pep-pharos-tooltip>
              </span>
            </span>
          </span>
        </pep-pharos-radio-button>
        <pep-pharos-radio-button :value="otherReason" :checked="otherReason === selectedReason">
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">
            <pep-pharos-text-input
              :value="otherReason"
              :invalidated="invalidReason"
              :message="invalidReason ? 'A reason is required' : ''"
              @focus="selectedReason = otherReason"
              @input="handleReasonInput"
              @click.prevent.stop
            />
          </span>
        </pep-pharos-radio-button>
      </pep-pharos-radio-group>

      <pep-pharos-textarea
        :value="comments"
        :invalidated="invalidComments.length"
        :message="invalidComments"
        placeholder="Contains a map of the area on page 46."
        class="mb-4"
        @input="handleCommentInput"
      >
        <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
        <div slot="label">Notes</div>
      </pep-pharos-textarea>

      <p>
        <span
          >The record will show that {{ entityName }} denied <em>{{ doc.title }}</em> on
          {{ new Date().toLocaleDateString() }}</span
        >
        <span v-if="denyGroups.length"
          >&nbsp;for use in
          {{
            makeGrammaticalList(denyGroups.map((group) => (groupMap.get(group) || {}).name || ''))
          }}</span
        >
        <span>.</span>
      </p>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="closeDenyModal">
        Cancel
      </pep-pharos-button>

      <!-- eslint-disable vue/no-deprecated-slot-attribute -->
      <pep-pharos-button
        slot="footer"
        :disabled="
          !selectedGroups['deny_requests'] ||
          !selectedGroups['deny_requests'].length ||
          !denyGroups.length ||
          arraysAreEqual(
            denyGroups,
            combineArrays(
              getGroupsWithStatus(statuses, 'denied'),
              getGroupsWithStatus(statuses, 'incomplete'),
            ),
          )
        "
        @click.prevent.stop="handleDenial"
      >
        Deny
      </pep-pharos-button>
      <!-- eslint-enable vue/no-deprecated-slot-attribute -->
    </pep-pharos-modal>
  </Teleport>
</template>
