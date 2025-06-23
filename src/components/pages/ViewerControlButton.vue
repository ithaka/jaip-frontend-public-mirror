<template>
  <button
    :aria-label="tooltipText"
    :data-tooltip-id="tooltipId"
    :data-sc="analyticsTag"
    :class="['viewer-control-button', !text ? 'icon-only-button' : 'button-with-text']"
    @click="buttonClick"
  >
    <pep-pharos-icon
      v-if="iconName"
      :name="iconName"
      :class="text ? 'icon-with-right-padding' : 'icon'"
    />

    <strong v-if="text">
      {{ text }}
    </strong>
  </button>

  <pep-pharos-tooltip
    v-if="tooltipText"
    :id="tooltipId"
    :placement="tooltipPosition"
  >
    {{ tooltipText }}
    <template v-if="keyboardShortcut && !hideShortcutText">
      (<span class="tooltip__shortcut"> {{ keyboardShortcut }} </span>)
    </template>
  </pep-pharos-tooltip>
</template>

<script lang="ts">
import { v4 as uuidv4 } from 'uuid'

export default {
  name: 'ViewerControlButton',
  props: {
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
      type: String,
      default: 'bottom',
      validator: function (value: string) {
        // The value must match one of these strings
        return (
          [
            'top',
            'top-start',
            'top-end',
            'bottom',
            'bottom-start',
            'bottom-end',
            'left',
            'left-start',
            'left-end',
            'right',
            'right-start',
            'right-end',
            'auto',
            'auto-start',
            'auto-end',
          ].indexOf(value) !== -1
        )
      },
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
  },
  emits: ['clicked'],
  data() {
    return {
      tooltipId: uuidv4(),
    }
  },
  methods: {
    buttonClick() {
      // @ts-expect-error This emit value does not have a type
      this.$emit('clicked')(
        // this is to close tool tips on click
        document.activeElement as HTMLElement,
      )?.blur()
    },
  },
}
</script>

<style lang="scss" scoped>
.viewer-control-button {
  pointer-events: all;
  background-color: var(--pharos-color-marble-gray-10);
  border: none;
  height: 42px;
  border-radius: 0;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  opacity: 90%;

  .icon {
    fill: var(--pharos-color-white);
  }

  .icon-with-right-padding {
    fill: var(--pharos-color-white);
    padding-right: var(--pharos-spacing-one-quarter-x);
  }

  &:active,
  &:focus {
    outline-width: 0;
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
