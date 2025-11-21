<script lang="ts" setup>
import { TooltipPositions } from '@/interfaces/Tooltips'
import { v4 as uuidv4 } from 'uuid'
import type { PropType } from 'vue'

const tooltipId = uuidv4()

defineProps({
  iconName: {
    type: String,
    required: false,
    default: null,
  },
  text: {
    type: String,
    required: false,
    default: null,
  },
  tooltipText: {
    type: String,
    required: false,
    default: null,
  },
  tooltipPosition: {
    type: String as PropType<TooltipPositions>,
    default: TooltipPositions.BOTTOM,
  },
  keyboardShortcut: {
    type: String,
    default: null,
  },
  analyticsTag: {
    type: String,
    required: false,
    default: null,
  },
  buttonPadding: {
    type: Boolean,
    required: false,
    default: false,
  },
  hideShortcutText: {
    type: Boolean,
    required: false,
    default: false,
  },
  mirror: {
    type: Boolean,
    required: false,
    default: false,
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits(['clicked'])
function buttonClick() {
  emit('clicked')
  // this is to close tool tips on click
  ;(document.activeElement as HTMLElement | null)?.blur()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    emit('clicked')
    event.preventDefault()
  }
}
</script>

<template>
  <button
    :aria-label="tooltipText"
    :data-tooltip-id="tooltipId"
    :data-sc="analyticsTag"
    :class="['viewer-control-button', !text ? 'icon-only-button' : 'button-with-text']"
    :disabled="disabled"
    @click="buttonClick"
    @keydown.enter="handleKeyDown"
  >
    <pep-pharos-icon
      v-if="iconName"
      :name="iconName"
      :class="[text ? 'icon-with-right-padding' : 'icon', { mirror: mirror }]"
      a11y-hidden="true"
    />

    <strong v-if="text">
      {{ text }}
    </strong>
  </button>

  <pep-pharos-tooltip v-if="tooltipText" :id="tooltipId" :placement="tooltipPosition">
    {{ tooltipText }}
    <template v-if="keyboardShortcut && !hideShortcutText">
      (<span class="tooltip__shortcut"> {{ keyboardShortcut }} </span>)
    </template>
  </pep-pharos-tooltip>
</template>

<style lang="scss" scoped>
.viewer-control-button {
  pointer-events: all;
  background-color: var(--pharos-color-marble-gray-10);
  border: none;
  height: 42px;
  border-radius: var(--pharos-radius-base-standard);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  opacity: 90%;

  .icon {
    fill: var(--pharos-color-white);
  }

  .mirror {
    transform: scale(-1, 1);
  }

  .icon-with-right-padding {
    fill: var(--pharos-color-white);
    padding-right: var(--pharos-spacing-one-quarter-x);
  }

  &:active {
    outline-width: 0;
  }
  &:focus {
    outline: 2px solid var(--pharos-color-focus);
    outline-offset: 2px;
    z-index: 3000;
  }

  &:hover,
  &:focus {
    cursor: pointer;
    background-color: var(--pharos-color-marble-gray-20);
  }
}

.icon-only-button {
  padding: 0 calc(var(--pharos-spacing-one-half-x) + 1px);
}

.button-with-text {
  padding: 0 var(--pharos-spacing-three-quarters-x);
}
</style>
