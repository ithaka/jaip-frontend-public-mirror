<script setup lang="ts">
import PrintButton from './PrintButton.vue'
import DownloadButton from './DownloadButton.vue'

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
</script>

<template>
  <DownloadButton :iid="props.iid" :variant="variant" :includePdf="includePdf" />
  <PrintButton :iid="props.iid" :variant="variant" :includePdf="includePdf" />
</template>
<style lang="scss" scoped>
.access-button {
  margin-bottom: var(--pharos-spacing-one-quarter-x);
  text-wrap: nowrap;
}
</style>
