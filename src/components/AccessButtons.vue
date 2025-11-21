<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { hasStaticBlock } from '@/utils/helpers'
import PrintButton from './PrintButton.vue'
import DownloadButton from './DownloadButton.vue'

const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)

const props = defineProps({
  iid: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'primary',
  },
  column: {
    type: Boolean,
    default: false,
  },
  includePdf: {
    type: Boolean,
    default: false,
  },
  pdfView: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const path = computed(() => route.path)
const isPDFPage = ref(path.value.startsWith('/pdf/'))
const hasStructuredClone = ref(typeof window.structuredClone === 'function')
</script>

<template>
  <DownloadButton :iid="props.iid" :variant="variant" :includePdf="includePdf" />
  <PrintButton :iid="props.iid" :variant="variant" :includePdf="includePdf" />
  <pep-pharos-button
    v-if="
      hasStaticBlock() && featureDetails['view_pdf']?.enabled && includePdf && hasStructuredClone
    "
    icon-left="filetype-pdf"
    class="access-button"
    full-width
    :variant="variant"
    :href="`/pdf/${iid}`"
  >
    View PDF
  </pep-pharos-button>
  <pep-pharos-button
    v-else-if="featureDetails['view_document']?.enabled && isPDFPage"
    icon-left="filetype-pdf"
    class="access-button"
    full-width
    :variant="variant"
    :href="`/page/${iid}/0`"
  >
    Read
  </pep-pharos-button>
</template>
<style lang="scss" scoped>
.access-button {
  margin-bottom: var(--pharos-spacing-one-quarter-x);
  text-wrap: nowrap;
}
</style>
