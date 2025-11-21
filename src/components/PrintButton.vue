<script lang="ts" setup>
import printJS from 'print-js'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { computed, type PropType } from 'vue'
import { hasBrowserPDFViewer } from '@/utils/viewers'
import { Collections } from '@/interfaces/Collections'
import { useValidDownloadURL } from '@/composables/urls'

const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)
const coreStore = useCoreStore()

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

const isDisabledPrint = ref(false)

/**
 * Prevents repeated clicks, builds a valid download URL, and invokes printJS so the browser opens
 * its native print dialog for the PDF while surfacing errors via the toast system.
 */
const printPDF = () => {
  isDisabledPrint.value = true

  const url = useValidDownloadURL(props.iid, props.collection, props.filename)

  printJS({
    printable: url,
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

const adjustMargin = computed(() => {
  return (
    (featureDetails.value['view_pdf']?.enabled && props.includePdf) ||
    (featureDetails.value['view_document']?.enabled && isPDFPage.value)
  )
})

const route = useRoute()
const path = computed(() => route.path)
const isPDFPage = ref(path.value.startsWith('/pdf/'))
</script>
<template>
  <pep-pharos-button
    v-if="featureDetails['print_pdf']?.enabled && hasBrowserPDFViewer()"
    icon-left="view-list"
    class="access-button"
    data-cy="print-pdf-button"
    :class="{
      'lg-mr-3': adjustMargin,
    }"
    :variant="variant"
    full-width
    :disabled="isDisabledPrint"
    @click.prevent.stop="printPDF"
  >
    <pep-pharos-loading-spinner v-if="isDisabledPrint" />
    Print
  </pep-pharos-button>
</template>
