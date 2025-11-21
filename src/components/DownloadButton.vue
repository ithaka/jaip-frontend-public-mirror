<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { ref, type PropType } from 'vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { hasBrowserPDFViewer } from '@/utils/viewers'
import type { Collections } from '@/interfaces/Collections'
import { useValidDownloadURL } from '@/composables/urls'

const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)

const props = defineProps({
  iid: {
    type: String as PropType<string | undefined>,
    required: false,
    default: undefined,
  },
  filename: {
    type: String as PropType<string | undefined>,
    required: false,
    default: undefined,
  },
  collection: {
    type: String as PropType<Collections | undefined>,
    required: false,
    default: undefined,
  },
  variant: {
    type: String,
    default: 'primary',
  },
  includePdf: {
    type: Boolean,
    default: false,
  },
})

const isDisabledDownload = ref(false)

/**
 * Creates a hidden anchor pointing at a valid download URL and programmatically clicks it to start
 * the PDF download while temporarily disabling the button to prevent rapid repeat requests.
 */
const downloadPDF = () => {
  try {
    isDisabledDownload.value = true
    const a = document.createElement('a')
    a.style.display = 'none'
    document.body.appendChild(a)
    const url = useValidDownloadURL(props.iid, props.collection, props.filename)
    if (!url) {
      throw new Error('No valid URL for PDF document')
    }
    a.href = url
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

const route = useRoute()
const path = computed(() => route.path)
const isPDFPage = ref(path.value.startsWith('/pdf/'))
</script>

<template>
  <pep-pharos-button
    v-if="featureDetails['download_pdf']?.enabled"
    full-width
    data-cy="download-pdf-button"
    :variant="variant"
    icon-left="download"
    :disabled="isDisabledDownload"
    class="access-button"
    :class="{
      'lg-mr-3':
        (featureDetails['print_pdf']?.enabled && hasBrowserPDFViewer()) ||
        (featureDetails['view_pdf']?.enabled && includePdf) ||
        (featureDetails['view_document']?.enabled && isPDFPage),
    }"
    @click="downloadPDF"
  >
    <pep-pharos-loading-spinner v-if="isDisabledDownload" />
    Download
  </pep-pharos-button>
</template>
