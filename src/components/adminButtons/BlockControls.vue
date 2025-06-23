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
import { changeRoute } from '@/utils/helpers'

const coreStore = useCoreStore()
const searchStore = useSearchStore()
const userStore = useUserStore()
const { reviewStatus, searchTerms, pageNo } = storeToRefs(searchStore)
const { enabledUngroupedFeatures, entityName } = storeToRefs(userStore)

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
})

const hasBlock = ref(enabledUngroupedFeatures.value['manage_block_list']?.enabled)
const showBlock = ref(hasBlock.value && !props.doc.is_blocked)
const showUnblock = ref(hasBlock.value && props.doc.is_blocked)

const showBlockModal = ref(false)
const blockModalKey = ref(0)

const reasons = [
  'Sexually explicit',
  'Instructive for explosives, weapons, or escapes',
  'Inflammatory or inciting violence, uprisings, or riots',
  'Detrimental to the good order of the facility or rehabilitation',
]
const selectedReason = ref('Sexually explicit')
const otherReason = ref('')
const invalidReason = ref(false)

const handleReasonInput = (e: InputFileEvent) => {
  otherReason.value = e.target.value
  selectedReason.value = otherReason.value
}

const handleSelectedReason = (e: InputFileEvent) => {
  selectedReason.value = e.target.value.trim()
  invalidReason.value = !selectedReason.value
}

const openBlockModal = () => {
  blockModalKey.value++
  showBlockModal.value = true
}
const closeBlockModal = () => {
  showBlockModal.value = false
  blockModalKey.value++
}

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['blockSubmitted', 'close'])

const handleBlock = async () => {
  if (!selectedReason.value.trim()) {
    invalidReason.value = true
    return
  } else if (invalidReason.value) {
    return
  } else if (!hasBlock.value) {
    return
  }
  const args = {
    doi: props.doc.doi,
    reason: selectedReason.value.trim(),
  }
  try {
    await coreStore.$api.global_blocks.block(args)
    const msg = 'Your block has been submitted.'
    coreStore.toast(msg, 'success')
    searchStore.doSearch(route.path === '/requests' ? reviewStatus.value : '', false)
    emit('blockSubmitted', {
      ...args,
      reason: selectedReason.value,
    })
    if (route.path.startsWith('/pdf') || route.path.startsWith('/page')) {
      changeRoute(router, emit, '/requests', searchTerms.value, pageNo.value, undefined, undefined)
    }
    coreStore.$api.log({
      eventtype: 'pep_block_submitted',
      event_description: 'user submitted block',
      dois: [args.doi],
      reason: args.reason,
    })
  } catch {
    const msg = 'There was an error and your block was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeBlockModal()
  }
}
const handleUnblock = async () => {
  const args = {
    doi: props.doc.doi,
  }
  try {
    await coreStore.$api.global_blocks.unblock(args)
    const msg = 'Your unblock has been submitted.'
    coreStore.toast(msg, 'success')
    searchStore.doSearch(route.path === '/requests' ? reviewStatus.value : '', false)
    emit('blockSubmitted', {
      ...args,
    })
    if (route.path.startsWith('/pdf') || route.path.startsWith('/page')) {
      changeRoute(router, emit, '/requests', searchTerms.value, pageNo.value, undefined, undefined)
    }
    coreStore.$api.log({
      eventtype: 'pep_unblock_submitted',
      event_description: 'user submitted unblock',
      dois: [args.doi],
    })
  } catch {
    const msg = 'There was an error and your unblock was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    closeBlockModal()
  }
}
</script>

<template>
  <pep-pharos-button
    v-if="showBlock"
    full-width
    class="mb-2 lg-mr-3"
    icon-left="checkmark-inverse"
    :data-modal-id="`block-modal-${doc.iid}`"
    variant="secondary"
    @click.prevent.stop="openBlockModal"
  >
    <span>Block</span>
  </pep-pharos-button>
  <pep-pharos-button
    v-if="showUnblock"
    full-width
    class="mb-2 lg-mr-3"
    icon-left="checkmark-inverse"
    :data-modal-id="`unblock-modal-${doc.iid}`"
    variant="secondary"
    @click.prevent.stop="handleUnblock"
  >
    <span>Unblock</span>
  </pep-pharos-button>
  <Teleport to="body">
    <pep-pharos-modal
      :id="`block-modal-${doc.iid}`"
      :key="blockModalKey"
      header="Block Material"
      :open="showBlockModal"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <p
        slot="description"
        class="mb-3"
      >
        What is your reason to block access
        <!-- eslint-disable-next-line vue/no-v-html  -->
        <span v-if="doc.title">to <em v-html="doc.title" /> globally?</span>
      </p>
      <pep-pharos-radio-group
        :value="selectedReason"
        @input="handleSelectedReason"
      >
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
            </span>
          </span>
        </pep-pharos-radio-button>
        <pep-pharos-radio-button
          :value="otherReason"
          :checked="otherReason === selectedReason"
        >
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

      <p>
        <span>The record will show that {{ entityName }} globally denied <em>{{ doc.title }}</em> on
          {{ new Date().toLocaleDateString() }}.</span>
      </p>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="closeBlockModal">
        Cancel
      </pep-pharos-button>

      <!-- eslint-disable vue/no-deprecated-slot-attribute -->
      <pep-pharos-button
        slot="footer"
        @click.prevent.stop="handleBlock"
      >
        Block
      </pep-pharos-button>
      <!-- eslint-enable vue/no-deprecated-slot-attribute -->
    </pep-pharos-modal>
  </Teleport>
</template>
