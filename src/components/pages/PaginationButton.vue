<script lang="ts">
import { v4 as uuidv4 } from 'uuid'

export default {
  name: 'PaginationButton',
  props: {
    direction: {
      type: String,
      required: true,
      validator: function (value: string) {
        // The value must match one of these strings
        return ['left', 'right'].indexOf(value) !== -1
      },
    },
    isRtl: {
      type: Boolean,
      required: false,
    },
    tooltipText: {
      type: String,
      default: null,
    },
    tooltipPosition: {
      type: String,
      default: 'top',
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
  },
  emits: ['page'],
  data() {
    return {
      tooltipId: uuidv4(),
    }
  },
  computed: {
    ariaLabel() {
      if (this.isRtl) {
        return this.direction === 'right' ? 'Previous page' : 'Next page'
      } else {
        return this.direction === 'right' ? 'Next page' : 'Previous page'
      }
    },
  },
  methods: {
    applyFocus() {
      ;(this.$refs.paginationButton as HTMLElement)?.focus()
    },
  },
}
</script>

<template>
  <div>
    <button
      ref="paginationButton"
      class="pagination"
      :aria-label="ariaLabel"
      :data-tooltip-id="tooltipId"
      @click="$emit('page', direction)"
    >
      <pep-pharos-icon
        :name="`arrow-${direction}`"
        class="button-icon"
      />
    </button>
    <pep-pharos-tooltip
      v-if="tooltipText"
      :id="tooltipId"
      :placement="tooltipPosition"
    >
      {{ tooltipText }}
      (<span
        v-if="keyboardShortcut"
        class="tooltip__shortcut"
      > {{ keyboardShortcut }} </span>)
    </pep-pharos-tooltip>
  </div>
</template>

<style lang="scss" scoped>
.pagination {
  width: 40px;
  height: 40px;
  border: none;
  background: #27282f;
  color: var(--pharos-color-white);
  display: flex !important;
  justify-content: center;
  align-items: center;

  &:focus,
  &:hover {
    background-color: #3b3d47;
  }

  .button-icon {
    fill: var(--pharos-color-white);
  }
}
</style>
