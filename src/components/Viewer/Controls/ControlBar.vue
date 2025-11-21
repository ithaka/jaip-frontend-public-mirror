<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ControlButton from './ControlButton.vue'
import PageSelector from './PageSelector.vue'
import { TooltipPositions } from '@/interfaces/Tooltips'
import ZoomAndFitControls from './ZoomAndFitControls.vue'

const props = defineProps({
  isFitToWidth: {
    type: Boolean,
    required: true,
  },
  isInFullscreen: {
    type: Boolean,
    required: true,
  },
  isMenuOpen: {
    type: Boolean,
    required: true,
  },
  canFitHeight: {
    type: Boolean,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  paginationKey: {
    type: Number,
    required: true,
  },
})

// Emits
const emit = defineEmits([
  'toggle-menu',
  'rotate-left',
  'rotate-right',
  'zoom-in',
  'zoom-out',
  'fit-view',
  'update-page',
  'toggle-fullscreen',
])

// Determine supporting icon and tooltip for the fit view button
const fitIcon = computed(() => (props.isFitToWidth ? 'fit-to-width' : 'fit-to-view'))
const fitIconTooltip = computed(() => {
  if (props.canFitHeight) {
    return props.isFitToWidth ? 'Fit to width' : 'Fit to height'
  } else {
    return 'Page cannot be fit while rotated horizontally'
  }
})

// Determine supporting text for the fullscreen toggle button
const fullscreenToggleIcon = computed(() =>
  props.isInFullscreen ? 'fullscreen-minimize' : 'fullscreen',
)
const fullscreenToggleTooltip = computed(() =>
  props.isInFullscreen ? 'Exit full screen' : 'Enter full screen',
)

// This will close the menu if the user clicks outside of it.
const menuRef = ref<HTMLElement | null>(null)
const handleDocumentClick = (event: MouseEvent) => {
  if (!props.isMenuOpen) {
    return
  }
  const target = event.target as Node | null
  if (target && menuRef.value?.contains(target)) {
    return
  }
  emit('toggle-menu')
}
onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
<template>
  <div :class="['control-bar', { 'is-menu-open': props.isMenuOpen }]">
    <!-- Control Menu (Does not include page selector or fullscreen toggle button) -->
    <div ref="menuRef" class="control-bar__menu">
      <ControlButton
        icon-name="menu"
        :tooltip-text="isMenuOpen ? 'Close menu' : 'Open menu'"
        @clicked="emit('toggle-menu')"
      />
      <div :class="['control-bar__dropdown', { 'is-open': props.isMenuOpen }]">
        <ZoomAndFitControls
          class="control-bar__dropdown-group"
          :fit-icon="fitIcon"
          :fit-icon-tooltip="fitIconTooltip"
          :can-fit-height="props.canFitHeight"
          :tooltipPosition="TooltipPositions.RIGHT"
          @zoom-in="emit('zoom-in')"
          @zoom-out="emit('zoom-out')"
          @fit-view="emit('fit-view')"
        />
        <!-- Rotate Button -->
        <ControlButton
          icon-name="rotate"
          tooltip-text="Rotate clockwise"
          keyboard-shortcut="r"
          :tooltip-position="TooltipPositions.RIGHT"
          @clicked="emit('rotate-right')"
        />
      </div>
    </div>
    <!-- Zoom and Fit Buttons -->
    <ZoomAndFitControls
      class="control-bar__buttons-left"
      :fit-icon="fitIcon"
      :fit-icon-tooltip="fitIconTooltip"
      :can-fit-height="props.canFitHeight"
      @zoom-in="emit('zoom-in')"
      @zoom-out="emit('zoom-out')"
      @fit-view="emit('fit-view')"
    />
    <!-- Page Selector -->
    <div class="control-bar__page-selector">
      <PageSelector
        :key="props.paginationKey"
        :page-count="props.pageCount"
        :current-page="props.currentPage"
        @update-page="emit('update-page', $event)"
      />
    </div>
    <div class="control-bar__actions-right">
      <!-- Rotate Button -->
      <ControlButton
        icon-name="rotate"
        tooltip-text="Rotate clockwise"
        keyboard-shortcut="r"
        :tooltip-position="TooltipPositions.RIGHT"
        @clicked="emit('rotate-right')"
      />
      <!-- Fullscreen Toggle Button -->
      <ControlButton
        :icon-name="fullscreenToggleIcon"
        :tooltip-text="fullscreenToggleTooltip"
        @clicked="emit('toggle-fullscreen')"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.control-bar {
  background-color: var(--pharos-color-marble-gray-10);
  border-bottom: 1px solid var(--pharos-color-marble-gray-20);
  border-radius: 2px !important;
  width: 100%;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: var(--pharos-spacing-one-half-x);

  &__buttons-left,
  &__buttons-right {
    display: flex;
    gap: var(--pharos-spacing-one-quarter-x);
    align-items: center;
  }
  &__buttons-left {
    grid-column: 1;
    justify-content: flex-start;
  }
  &__actions-right {
    grid-column: 3;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--pharos-spacing-one-half-x);
  }
  &__buttons-right {
    justify-content: flex-end;
  }
  &__page-selector {
    grid-column: 2;
    display: flex;
    justify-content: center;
    align-items: center;

    .page-selector {
      width: auto;
      justify-content: center;
    }
  }
  &__menu {
    position: relative;
    display: none;
  }
  .control-page {
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    &__input {
      border-radius: 2px;
      border-style: none;
      color: var(--pharos-color-white);
      height: 28px;
      width: 28px;
      text-align: center;
    }
  }
  &__dropdown {
    display: none;
    position: absolute;
    top: calc(100% + var(--pharos-spacing-one-quarter-x));
    left: 0;
    padding: var(--pharos-spacing-one-half-x);
    border-radius: 4px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
    background-color: var(--pharos-color-white, #fff);
    z-index: 4;
    flex-direction: column;
    gap: var(--pharos-spacing-one-half-x);
    width: max-content;
  }
  &__dropdown.is-open {
    @media (max-width: 360px) {
      display: flex;
      background-color: var(--pharos-color-marble-gray-10);
    }
  }
  .control-buttons {
    display: flex;
    gap: var(--pharos-spacing-one-quarter-x);
    align-items: center;
  }
  @media (max-width: 360px) {
    .control-buttons {
      flex-direction: column;
      gap: var(--pharos-spacing-one-quarter-x);
      align-items: center;
      width: 100%;
      &::v-deep(.viewer-control-button) {
        width: max-content;
        justify-content: center;
      }
    }
    .control-buttons.control-bar {
      &__buttons-left,
      &__buttons-right {
        display: none;
      }
    }
    &__menu {
      display: flex;
      align-items: center;
    }
  }
}
</style>
