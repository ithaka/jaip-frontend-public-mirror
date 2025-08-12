<script setup lang="ts">
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import { DenialReasons } from '@/interfaces/MediaReview'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'
import { useUserStore } from '@/stores/user'
import { changeRoute } from '@/utils/helpers'
import { storeToRefs } from 'pinia'
import { ref, type PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
})

const searchStore = useSearchStore()
const { reviewStatus, searchTerms, pageNo } = storeToRefs(searchStore)

const userStore = useUserStore()
const { ungroupedFeatures, entityName } = storeToRefs(userStore)

const coreStore = useCoreStore()
const { isSpinning } = storeToRefs(coreStore)

const router = useRouter()
const route = useRoute()

const reasons: DenialReasons | string[] = [
  DenialReasons.Sex,
  DenialReasons.Instruction,
  DenialReasons.Violence,
  DenialReasons.Order,
]
const selectedReason = ref(DenialReasons.Sex as DenialReasons | string)
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

const emit = defineEmits(['restrictSubmitted', 'close'])

const handleRestrict = async () => {
  if (!selectedReason.value.trim()) {
    invalidReason.value = true
    return
  } else if (invalidReason.value) {
    return
  } else if (!ungroupedFeatures.value['manage_restricted_list']?.enabled) {
    return
  }
  const args = {
    doi: props.doc.doi,
    reason: selectedReason.value.trim(),
  }
  try {
    isSpinning.value = true
    await coreStore.$api.global_restricts.restrict(args)
    await searchStore.doSearch(route.path === '/requests' ? reviewStatus.value : '', false)
    emit('restrictSubmitted', {
      ...args,
    })
    const msg = 'This material has been restricted.'
    coreStore.toast(msg, 'success')

    if (route.path.startsWith('/pdf') || route.path.startsWith('/page')) {
      changeRoute(router, emit, '/requests', searchTerms.value, pageNo.value, undefined, undefined)
    }

    coreStore.$api.log({
      eventtype: 'pep_restrict_submitted',
      event_description: 'user submitted restricted item',
      dois: [args.doi],
      reason: args.reason,
    })
  } catch {
    const msg = 'There was an error and your restricted item was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    isSpinning.value = false
  }
}
</script>
<template>
  <pep-pharos-button
    full-width
    class="mb-2 lg-mr-3"
    icon-left="exclamation-inverse"
    :data-modal-id="`restrict-modal-${doc.iid}`"
    variant="secondary"
  >
    <span>Restrict</span>
  </pep-pharos-button>
  <Teleport to="body">
    <pep-pharos-modal :id="`restrict-modal-${doc.iid}`" header="Restrict material">
      <p slot="description" class="mb-3">
        What is your reason to restrict access
        <span v-if="doc.title">to <em v-html="doc.title" /> globally?</span>
      </p>
      <pep-pharos-radio-group :value="selectedReason" class="mb-6" @input="handleSelectedReason">
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
            </span>
          </span>
        </pep-pharos-radio-button>
        <pep-pharos-radio-button :value="otherReason" :checked="otherReason === selectedReason">
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
        <span
          >The record will show that {{ entityName }} globally denied <em>{{ doc.title }}</em> on
          {{ new Date().toLocaleDateString() }}.</span
        >
      </p>

      <pep-pharos-button slot="footer" variant="secondary" data-modal-close>
        Cancel
      </pep-pharos-button>

      <pep-pharos-button
        slot="footer"
        :data-modal-close="invalidReason ? undefined : true"
        @click="handleRestrict"
      >
        Restrict
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
