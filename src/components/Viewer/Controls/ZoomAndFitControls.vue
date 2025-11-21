<script setup lang="ts">
import { TooltipPositions } from '@/interfaces/Tooltips'
import ControlButton from './ControlButton.vue'
import type { PropType } from 'vue'

const props = defineProps({
  fitIcon: {
    type: String,
    required: true,
  },
  fitIconTooltip: {
    type: String,
    required: true,
  },
  fitKeyboardShortcut: {
    type: String,
    required: false,
    default: undefined,
  },
  canFitHeight: {
    type: Boolean,
    required: true,
  },
  tooltipPosition: {
    type: String as PropType<TooltipPositions>,
    default: TooltipPositions.BOTTOM,
  },
})

const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
  'fit-view': []
}>()
</script>

<template>
  <div class="control-buttons">
    <ControlButton
      icon-name="zoom-in"
      tooltip-text="Zoom in"
      keyboard-shortcut="+"
      :tooltip-position="props.tooltipPosition"
      @clicked="emit('zoom-in')"
    />
    <ControlButton
      icon-name="zoom-out"
      tooltip-text="Zoom out"
      keyboard-shortcut="-"
      :tooltip-position="props.tooltipPosition"
      @clicked="emit('zoom-out')"
    />
    <ControlButton
      :icon-name="props.fitIcon"
      :tooltip-text="props.fitIconTooltip"
      :keyboard-shortcut="props.fitKeyboardShortcut"
      :disabled="!props.canFitHeight"
      :tooltip-position="props.tooltipPosition"
      @clicked="emit('fit-view')"
    />
  </div>
</template>
