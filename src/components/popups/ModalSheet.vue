<script setup lang="ts">
import { useTemplateRef, type ComputedRef, type PropType } from 'vue'
import { useBreakpoints } from '@/composables/breakpoints'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    required: true,
  },
  size: {
    type: String as PropType<'small' | 'medium' | 'large'>,
    default: 'medium',
  },
  header: {
    type: String,
    default: '',
  },
  footerDivider: {
    type: Boolean,
    default: false,
  },
  hasClose: {
    type: Boolean,
    default: false,
  },
  expanded: {
    type: [Boolean, Object] as PropType<boolean | ComputedRef<boolean>>,
    default: () => useBreakpoints().atMostMedium,
  },
  enableExpansion: {
    type: Boolean,
    default: true,
  },
  minHeight: {
    type: Number,
    default: 0,
  },
  omitOverlay: {
    type: Boolean,
    default: false,
  },
  docked: {
    type: Boolean,
    default: false,
  },
  // Whether to use the sheet or modal component. If true, the sheet will be used; if false, the modal will be used.
  // If a breakpoint is provided, it will override this prop and determine which component to use based on the current viewport width.
  // The default value is to be a sheet through the medium breakpoint, and a modal for larger viewports.
  breakpoint: {
    type: [Boolean, Object] as PropType<boolean | ComputedRef<boolean>>,
    default: () => useBreakpoints().atMostMedium,
  },
})

// NOTE: This strategy for handling touch events might end up better as a composable
// if we start seeing similar issues in other components. In this case, it's being used
// to prevent scrolling from automatically closing the sheet.
/**
 * Template reference to the sheet content element.
 * Used to determine if touch events originate from within the content area.
 */
const sheetContent = useTemplateRef<HTMLElement>(`${props.id}-sheet-content`)

/**
 * Handles touch events on the sheet.
 * Stops propagation for touch events that originate inside the sheet content
 * to allow scrolling without triggering parent handlers (which would close the sheet)
 *
 * @param {TouchEvent} event - The touch event to handle
 */
const handleTouchEvent = (event: TouchEvent) => {
  const isInsideContentWrapper =
    sheetContent.value && sheetContent.value.contains(event.target as Node)
  // Prevent touch event propagation inside the chat wrapper to allow content scrolling
  if (isInsideContentWrapper) {
    event?.stopPropagation()
  }
}

defineEmits(['close'])
</script>
<template>
  <!-- Both modals and sheets will behave very strangely if they're opened on one of the viewer
   pages, which require some positioning that seems to break these components. Teleporting them
   to the body prevents those issues entirely. -->
  <Teleport to="body">
    <div>
      <!-- NOTE: The "header" prop here functions only for the aria-label, and unlike the modal prop
       does not produce a visible heading. The heading is therefore added in the sheet content.
       For the same reason, the sheet's built-in `has-close` close button renders outside the
       heading row; when `hasClose` is set we render our own close button inline with the
       heading, styled to match the built-in one.
       Also, some props register only the presence of a value and treat any value (include false) as
       true. To avoid that, we use null for these props.
       Also, the key value is there because triggering a re-render seems to be the only way to prevent broken
       positioning in the case that a user is zoomed in such that the sheet is taller than the screen size and 
       they close the sheet by clicking outside of it or using the escape key rather than the close button. -->
      <pep-pharos-sheet
        v-if="breakpoint"
        :id="`${id}-sheet`"
        :key="`${id}-sheet-${open ? 'open' : 'closed'}`"
        :size="size"
        :open="open || null"
        :min-height="minHeight"
        :header="header"
        :expanded="expanded || null"
        :enable-expansion="enableExpansion || null"
        :omit-overlay="omitOverlay || null"
        :docked="docked || null"
        class="sheet"
        @touchmove.capture.passive="handleTouchEvent"
        @touchstart.capture.passive="handleTouchEvent"
        @touchend.capture.passive="handleTouchEvent"
        @pharos-sheet-closed="$emit('close')"
      >
        <div :ref="`${id}-sheet-content`" class="sheet__content">
          <div class="sheet__heading-row">
            <pep-pharos-heading preset="5" :level="3" no-margin class="sheet__heading">
              {{ header }}
            </pep-pharos-heading>
            <pep-pharos-button
              v-if="hasClose"
              id="close-button"
              type="button"
              variant="subtle"
              icon="close"
              a11y-label="Close sheet"
              class="sheet__close-button"
              @click="$emit('close')"
            ></pep-pharos-button>
          </div>
          <slot></slot>
        </div>
      </pep-pharos-sheet>

      <div v-else class="modal">
        <pep-pharos-modal
          v-if="open"
          :id="`${id}-modal`"
          :key="`${id}-modal`"
          :header="header"
          :size="size"
          :open="open"
          :footer-divider="footerDivider"
          class="modal"
          @pharos-modal-closed="$emit('close')"
        >
          <slot></slot>
        </pep-pharos-modal>
      </div>
    </div>
  </Teleport>
</template>
<style lang="scss" scoped>
.sheet {
  &__content {
    padding: var(--pharos-spacing-2-x);
    padding-top: 0;
    color: var(--pharos-color-black);
  }
  // Matches the pharos-sheet built-in `.sheet__header` margins so the close
  // button sits in the same visual position, but as a flex row inline with the
  // heading rather than above it.
  &__heading-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--pharos-spacing-one-and-a-half-x);
    margin-top: var(--pharos-spacing-one-and-a-half-x);
    margin-right: var(--pharos-spacing-one-and-a-half-x);
  }
  &__heading {
    margin-bottom: var(--pharos-spacing-2-x);
    color: var(--pharos-color-black);
  }
  &__close-button {
    flex: 0 0 auto;
  }
  @media (max-width: 22.5rem) {
    &__heading-row {
      margin-right: 1.25rem;
    }
    &__heading {
      margin-bottom: var(--pharos-spacing-one-and-a-half-x);
    }
  }
}
</style>
