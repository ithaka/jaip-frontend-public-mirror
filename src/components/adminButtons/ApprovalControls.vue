<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'

import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import type { PropType } from 'vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import {
  makeGrammaticalList,
  arraysAreEqual,
  hideButton,
  getGroupsWithStatus,
} from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import type { Group } from '@/interfaces/Group'
import { changeRoute } from '@/utils/helpers'

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

const statuses = ref(props.doc.mediaReviewStatuses)
const showApprove = !hideButton(
  featureDetails.value,
  statuses.value,
  'approved',
  'approve_requests',
)
const useApproveModal = ref(
  showApprove && featureDetails.value['approve_requests'].groups.length > 1,
)
const showApproveModal = ref(false)
const approveModalKey = ref(0)
const approveGroups = ref(featureDetails.value['approve_requests'].groups)

selectedGroups.value['approve_requests'] = approveGroups.value
const openApproveModal = () => {
  if (useApproveModal.value) {
    approveModalKey.value++
    showApproveModal.value = true
  } else {
    handleSingleGroupApproval()
  }
}
const closeApproveModal = () => {
  showApproveModal.value = false
  approveModalKey.value++
}

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['approvalSubmitted', 'close'])

const handleApproval = async () => {
  if (featureDetails.value['approve_requests'].groups.length === 1) {
    selectedGroups.value['approve_requests'] = featureDetails.value['approve_requests'].groups
  }
  const args = {
    doi: props.doc.doi,
    groups: selectedGroups.value['approve_requests'],
  }
  if (!args.groups.length || args.doi === '') {
    return
  }
  try {
    await coreStore.$api.approvals.approve(args)
    const msg = 'Your approval has been submitted!'
    coreStore.toast(msg, 'success')
    searchStore.doSearch(route.path === '/requests' ? reviewStatus.value : '', false)
    emit('approvalSubmitted')
    if (route.path.startsWith('/pdf') || route.path.startsWith('/page')) {
      changeRoute(router, emit, '/requests', searchTerms.value, pageNo.value, undefined, undefined)
    }
    coreStore.$api.log({
      eventtype: 'pep_approval_submitted',
      event_description: 'user submitted approval',
      dois: [args.doi],
      groups: args.groups,
    })
  } catch {
    const msg = 'There was an error and your approval was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeApproveModal()
  }
}
const handleSingleGroupApproval = () => {
  selectedGroups.value['approve_requests'] = featureDetails.value['approve_requests'].groups
  handleApproval()
}

const selectorGroupOptions = ref(
  (featureDetails.value['approve_requests'] || {}).groups.reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[]),
)
</script>

<template>
  <pep-pharos-button
    v-if="showApprove"
    full-width
    class="mb-2 lg-mr-3"
    icon-left="checkmark-inverse"
    @click.prevent.stop="openApproveModal"
  >
    <span>Approve</span>
  </pep-pharos-button>
  <Teleport to="body">
    <pep-pharos-modal
      :id="`approve-modal-${doc.iid}`"
      :key="approveModalKey"
      header="Approve material"
      size="large"
      :open="showApproveModal"
    >
      <p slot="description">
        <span
          >The record will show that {{ entityName }} approved <em>{{ doc.title }}</em> on
          {{ new Date().toLocaleDateString() }}</span
        >
        <span v-if="approveGroups.length"
          >&nbsp;for use in
          {{
            makeGrammaticalList(
              selectedGroups['approve_requests'].map((id) => (groupMap.get(id) || {}).name || ''),
            )
          }}</span
        >
        <span>.</span>
      </p>
      <div v-if="featureDetails['approve_requests'].groups.length > 1">
        <GroupSelector
          :groups="selectorGroupOptions"
          :feature-name="'approve_requests'"
          :start-full="true"
          multiple
        />
      </div>
      <span v-if="!selectedGroups['approve_requests'].length" class="error">
        At least one group must be selected
      </span>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="closeApproveModal">
        Cancel
      </pep-pharos-button>

      <!-- eslint-disable vue/no-deprecated-slot-attribute -->
      <pep-pharos-button
        slot="footer"
        :disabled="
          !approveGroups.length ||
          arraysAreEqual(approveGroups, getGroupsWithStatus(statuses, 'approved'))
        "
        @click.prevent.stop="handleApproval"
      >
        Approve
      </pep-pharos-button>
      <!-- eslint-enable vue/no-deprecated-slot-attribute -->
    </pep-pharos-modal>
  </Teleport>
</template>
