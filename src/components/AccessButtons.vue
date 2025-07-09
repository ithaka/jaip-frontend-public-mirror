<script setup lang="ts">
import printJS from 'print-js'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
// @ts-expect-error The viewer utils are not typed
import { hasBrowserPDFViewer } from '@/utils/viewers'
import { hasStaticBlock } from '@/utils/helpers'

const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)
const coreStore = useCoreStore()

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

const isDisabledPrint = ref(false)
const isDisabledDownload = ref(false)

const downloadPDF = () => {
  try {
    isDisabledDownload.value = true
    const a = document.createElement('a')
    a.style.display = 'none'
    document.body.appendChild(a)
    a.href = `/api/v2/page/${props.iid}`
    // Use download attribute to set set desired file name
    a.setAttribute('download', (props.iid || 'document') + '.pdf')
    // Trigger the download by simulating click
    a.click()
    // Cleanup
    document.body.removeChild(a)
    // This solution is not ideal, but there's not a great way to know when downloads are complete
    // This avoids repeated clicking by disabling the button for a few seconds.
    setTimeout(() => {
      isDisabledDownload.value = false
    }, 3000)
  } catch {
    isDisabledDownload.value = false
  }
}

const printPDF = () => {
  isDisabledPrint.value = true
  printJS({
    printable: `api/v2/page/${props.iid}`,
    type: 'pdf',
    onPrintDialogClose: () => {
      isDisabledPrint.value = false
    },
    onError: () => {
      isDisabledPrint.value = false
      coreStore.toast('Error printing document', 'error')
    },
  })
}

const route = useRoute()
const path = computed(() => route.path)
const isPDFPage = ref(path.value.startsWith('/pdf/'))
const hasStructuredClone = ref(typeof window.structuredClone === 'function')
</script>

<template>
  <pep-pharos-button
    v-if="featureDetails['download_pdf'].enabled"
    full-width
    :variant="variant"
    icon-left="download"
    :disabled="isDisabledDownload"
    class="mb-2"
    :class="{
      'lg-mr-3':
        (featureDetails['print_pdf'].enabled && hasBrowserPDFViewer()) ||
        (featureDetails['view_pdf'].enabled && includePdf) ||
        (featureDetails['view_document'].enabled && isPDFPage),
    }"
    data-cy="download-pdf-button"
    @click="downloadPDF"
  >
    <pep-pharos-loading-spinner v-if="isDisabledDownload" />
    Download
  </pep-pharos-button>
  <pep-pharos-button
    v-if="featureDetails['print_pdf'].enabled && hasBrowserPDFViewer()"
    icon-left="view-list"
    a11y-label="Print PDF"
    class="mb-2"
    :class="{
      'lg-mr-3':
        (featureDetails['view_pdf'].enabled && includePdf) ||
        (featureDetails['view_document'].enabled && isPDFPage),
    }"
    :variant="variant"
    full-width
    :disabled="isDisabledPrint"
    data-cy="print-pdf-button"
    @click.prevent.stop="printPDF"
  >
    <pep-pharos-loading-spinner v-if="isDisabledPrint" />
    Print
  </pep-pharos-button>
  <pep-pharos-button
    v-if="
      hasStaticBlock() && featureDetails['view_pdf'].enabled && includePdf && hasStructuredClone
    "
    icon-left="filetype-pdf"
    a11y-label="View PDF"
    class="mb-2"
    full-width
    data-cy="view-pdf-button"
    :variant="variant"
    :href="hasBrowserPDFViewer() ? `/api/v2/page/${iid}` : `/pdf/${iid}`"
  >
    View PDF
  </pep-pharos-button>
  <pep-pharos-button
    v-else-if="featureDetails['view_document'].enabled && isPDFPage"
    icon-left="filetype-pdf"
    a11y-label="View Document"
    class="mb-2"
    full-width
    :variant="variant"
    :href="`/page/${iid}/0`"
  >
    Read
  </pep-pharos-button>
</template>
