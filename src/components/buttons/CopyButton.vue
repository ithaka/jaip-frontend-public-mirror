<script setup lang="ts">
import { useLogger } from '@/composables/logging/useLogger'
import type { PropType } from 'vue'
import { ref, computed } from 'vue'

const props = defineProps({
  tooltipId: {
    type: String,
    required: true,
  },
  defaultTooltipText: {
    type: String,
    default: 'Copy to clipboard',
  },
  tooltipSuccessText: {
    type: String,
    default: 'Copied!',
  },
  copyText: {
    type: String,
    default: '',
  },
  dois: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  copyContext: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: 'Copy',
  },
})

const emit = defineEmits(['clipboard-unavailable', 'copy-error', 'success'])

const { handleWithLog, logs } = useLogger()
const { copyButtonLog, copyErrorLog, copyAvailabilityLog, copyLegacyFallbackLog } =
  logs.getCopyButtonLogs({
    dois: props.dois,
    copyContext: props.copyContext,
  })

const tooltipText = ref(props.defaultTooltipText)

const isClipboardAvailable = computed(() => {
  return !!(navigator.clipboard && navigator.clipboard.writeText)
})

// Fallback for browsers/contexts that deny navigator.clipboard writes (e.g. NotAllowedError).
const legacyCopy = (text: string): boolean => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

/**
 * Copies the currently displayed citation text to the user's clipboard.
 *
 * @returns {Promise<void>} Resolves once the text has been written to the
 * clipboard.
 */
const handleCopy = async () => {
  try {
    if (!isClipboardAvailable.value) {
      handleWithLog(copyAvailabilityLog(), () => emit('clipboard-unavailable'))
      return
    }
    await navigator.clipboard.writeText(props.copyText)
    tooltipText.value = props.tooltipSuccessText
    handleWithLog(copyButtonLog(), () => emit('success'))

    // Keep success feedback visible briefly before restoring the default text.
    setTimeout(() => {
      tooltipText.value = props.defaultTooltipText
    }, 5000)
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'NotAllowedError' &&
      legacyCopy(props.copyText)
    ) {
      handleWithLog(copyLegacyFallbackLog(), () => {
        tooltipText.value = props.tooltipSuccessText
        emit('success')
        setTimeout(() => {
          tooltipText.value = props.defaultTooltipText
        }, 5000)
      })
      return
    }
    handleWithLog(copyErrorLog({ error }), () => emit('copy-error'))
    return
  }
}
</script>

<template>
  <pep-pharos-button
    variant="primary"
    icon-left="copy"
    :aria-describedby="tooltipId"
    :data-tooltip-id="tooltipId"
    :data-cy="`copy-${copyContext}-button`"
    @click.prevent.stop="handleCopy"
  >
    <span class="text-align-center">{{ label }}</span>
  </pep-pharos-button>
  <pep-pharos-tooltip v-if="isClipboardAvailable" :id="tooltipId" placement="top">
    {{ tooltipText }}
  </pep-pharos-tooltip>
</template>
