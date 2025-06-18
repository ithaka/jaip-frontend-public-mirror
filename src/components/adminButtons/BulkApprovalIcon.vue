<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import type { Discipline } from '@/interfaces/Discipline'
import type { BulkHistory } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'
import { makeGrammaticalList } from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import type { Group, GroupSelection } from '@/interfaces/Group'

const props = defineProps({
  tooltipId: {
    type: String,
    default: 'tooltip',
  },
  placement: {
    type: String,
    default: 'top',
  },
  icon: {
    type: String,
    default: 'checkmark-inverse',
  },
  text: {
    type: String,
    default: 'This articles in this subject are generally approved automatically.',
  },
  color: {
    type: Boolean,
    default: true,
  },
  disc: {
    type: Object as PropType<Discipline>,
    default: () => ({}),
  },
})
const coreStore = useCoreStore()
const searchStore = useSearchStore()
const userStore = useUserStore()
const { entityName, featureDetails, groupMap, selectedGroups } = storeToRefs(userStore)

const { disciplineList } = storeToRefs(searchStore)

const getInitialBulkApprovalState = (approval: BulkHistory[]) => {
  return approval
    .filter((hist: BulkHistory) => {
      return hist.status.toLowerCase() === 'approved'
    })
    .map((hist: BulkHistory) => {
      return hist.groupID
    })
}
const initialBulkApprovalState = getInitialBulkApprovalState(props.disc.bulk_approval || [])
const updateKey = ref(0)
const showBulkApprovalModal = ref(false)

// We only want to show groups where the user has the ability to undo bulk approvals and that are currently bulk approved.
const possibleBulkUndoGroups = ref(
  initialBulkApprovalState.filter((group: number) =>
    featureDetails.value['undo_bulk_approve'].groups.includes(group),
  ),
)
const selectorGroupOptions = ref(
  (possibleBulkUndoGroups.value || {}).reduce((arr, id: number) => {
    const group = groupMap.value.get(id)
    if (group) {
      arr.push(group)
    }
    return arr
  }, [] as Group[]),
)
selectedGroups.value['undo_bulk_approve'] = possibleBulkUndoGroups.value
const handleGroupSelection = (event: GroupSelection) => {
  selectedGroups.value['undo_bulk_approve'] = event.groups
}

const openBulkApprovalModal = () => {
  if (featureDetails.value['undo_bulk_approve'].enabled) {
    showBulkApprovalModal.value = true
  }
}
const closeBulkApproveModal = () => {
  showBulkApprovalModal.value = false
  updateKey.value++
}
const emit = defineEmits(['render'])

const submitBulkApproval = async () => {
  const args = {
    groups: selectedGroups.value['undo_bulk_approve'],
    code: props.disc.code,
  }

  try {
    await coreStore.$api.approvals.bulkUndo(args)
    const msg = 'Your change has been submitted.'
    coreStore.toast(msg, 'success')
    const resp = await coreStore.$api.disciplines()
    disciplineList.value = resp.data as Discipline[]
    emit('render')
    coreStore.$api.log({
      eventtype: 'pep_bulk_undo_submitted',
      event_description: 'user submitted bulk undo',
      groups: args.groups,
      code: args.code,
    })
  } catch {
    const msg = 'There was an error and the change was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeBulkApproveModal()
  }
}
</script>
<template>
  <div>
    <div>
      <pep-pharos-icon
        :data-tooltip-id="tooltipId"
        :name="icon"
        :aria-describedby="tooltipId"
        :class="{ 'fill-jstor-red': color }"
        @click.prevent.stop="openBulkApprovalModal"
      />
      <pep-pharos-tooltip :id="tooltipId" :placement="placement">
        <span class="text-none">{{ text }}</span>
      </pep-pharos-tooltip>
    </div>
    <div>
      <Teleport to="body">
        <pep-pharos-modal
          v-if="featureDetails['undo_bulk_approve'].enabled"
          :id="`bulk-${disc.code}-modal`"
          :key="updateKey"
          :header="`Revoke Approval`"
          :open="showBulkApprovalModal"
          @pharos-modal-closed="closeBulkApproveModal()"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <p class="my-4">
            <span
              v-if="
                selectedGroups['undo_bulk_approve'] && selectedGroups['undo_bulk_approve'].length
              "
              >The record will show that {{ entityName }} revoked approval for {{ disc.label }} in
              {{
                makeGrammaticalList(
                  (selectedGroups['undo_bulk_approve'] || []).map(
                    (group: number) => (groupMap.get(group) || {}).name || '',
                  ),
                )
              }}. Material in this discipline will no longer be automatically available.</span
            >
            <span v-else class="error">Please select at least one group to revoke approval.</span>
          </p>

          <div v-if="possibleBulkUndoGroups.length > 1" class="mb-3">
            <GroupSelector
              :groups="selectorGroupOptions"
              :feature-name="`undo_bulk_approve`"
              :start-full="true"
              multiple
              @change="handleGroupSelection"
            />
          </div>
          <!-- eslint-disable vue/no-deprecated-slot-attribute -->
          <pep-pharos-button
            slot="footer"
            variant="secondary"
            @click.prevent.stop="closeBulkApproveModal"
          >
            Cancel
          </pep-pharos-button>
          <pep-pharos-button
            slot="footer"
            :disabled="
              !selectedGroups['undo_bulk_approve'] || !selectedGroups['undo_bulk_approve'].length
            "
            @click.prevent.stop="submitBulkApproval"
          >
            Submit
          </pep-pharos-button>
          <!-- eslint-enable vue/no-deprecated-slot-attribute -->
        </pep-pharos-modal>
      </Teleport>
    </div>
  </div>
</template>
