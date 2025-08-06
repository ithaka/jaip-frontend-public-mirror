<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import type { PropType } from 'vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import { useRouter } from 'vue-router'
import { changeRoute } from '@/utils/helpers'
import { useUserStore } from '@/stores/user'
import ApprovalControls from '@/components/adminButtons/ApprovalControls.vue'
import DenialControls from '@/components/adminButtons/DenialControls.vue'
import RestrictedControls from '@/components/adminButtons/RestrictedControls.vue'
import DocumentHistory from '@/components/results/DocumentHistory.vue'
import AccessButtons from '@/components/AccessButtons.vue'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
  pdfView: Boolean,
  includePdf: Boolean,
})

const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)

const router = useRouter()
const emit = defineEmits(['close', 'approvalSubmitted', 'denialSubmitted', 'restrictSubmitted'])

const hasHistory = (props.doc.history || []).length || (props.doc.national_history || []).length
const showHistoryModal = ref(false)
const historyUpdateKey = ref(0)
const openHistoryModal = () => {
  historyUpdateKey.value++
  showHistoryModal.value = true
}
const closeHistoryModal = () => {
  historyUpdateKey.value++
  showHistoryModal.value = false
}
const isGlobal = ref((props.doc.history || []).length ? false : true)
const readRoute = ref(
  featureDetails.value['view_document'].enabled
    ? `/page/${props.doc.iid}/0`
    : `/pdf/${props.doc.iid}`,
)
</script>
<template>
  <div>
    <div>
      <div class="display-flex justify-content-end md-flex-direction-column flex-direction-column">
        <ApprovalControls :doc="doc" @approval-submitted="emit('approvalSubmitted')" />
        <DenialControls :doc="doc" @denial-submitted="emit('denialSubmitted')" />
        <RestrictedControls :doc="doc" @restrict-submitted="emit('restrictSubmitted')" />
      </div>
      <div class="display-flex justify-content-end md-flex-direction-column flex-direction-column">
        <pep-pharos-button
          v-if="hasHistory"
          full-width
          class="mb-2 lg-mr-3"
          variant="secondary"
          icon-left="calendar"
          :data-modal-id="`history-modal-${doc.iid}`"
          @click.prevent.stop="openHistoryModal"
        >
          <span>History</span>
        </pep-pharos-button>
        <AccessButtons
          v-if="pdfView"
          :iid="doc.iid"
          variant="secondary"
          column
          :include-pdf="includePdf"
        />

        <pep-pharos-button
          v-if="
            !pdfView &&
            (featureDetails['view_pdf'].enabled || featureDetails['view_document'].enabled)
          "
          full-width
          class="mb-2 mr-3"
          variant="secondary"
          icon-left="filetype-pdf"
          @click.prevent.stop="
            changeRoute(router, emit, readRoute, searchTerms, pageNo, undefined, undefined)
          "
        >
          <span>Read</span>
        </pep-pharos-button>
      </div>
    </div>

    <Teleport to="body">
      <pep-pharos-modal
        v-if="showHistoryModal"
        :id="`history-modal-${doc.iid}`"
        :key="historyUpdateKey"
        size="large"
        header="History"
        :open="showHistoryModal"
        @pharos-modal-closed="closeHistoryModal"
      >
        <pep-pharos-toggle-button-group
          v-if="(props.doc.history || []).length && (props.doc.national_history || []).length"
          group-label="Area Options"
        >
          <pep-pharos-toggle-button
            id="local-button"
            :selected="!isGlobal"
            @click.prevent.stop="isGlobal = false"
          >
            Local History
          </pep-pharos-toggle-button>
          <pep-pharos-toggle-button
            id="global-button"
            :selected="isGlobal"
            @click.prevent.stop="isGlobal = true"
          >
            Global Statuses
          </pep-pharos-toggle-button>
        </pep-pharos-toggle-button-group>
        <DocumentHistory :doc="doc" :scope="isGlobal ? 'global' : 'local'" />
      </pep-pharos-modal>
    </Teleport>
  </div>
</template>
