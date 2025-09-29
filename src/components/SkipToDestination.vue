<script setup lang="ts">
const { target } = defineProps({
  target: {
    type: String,
    default: 'main-content', // Default target id to skip to on keyboard activation
  },
})

/**
 * Handles the skip link action for accessibility.
 *
 * The SkipToDestination component provides a visually hidden skip link that allows keyboard and screen reader users
 * to quickly jump to the main content or another landmark region of the page.
 *
 * When activated, this function moves focus to the element with the specified `target` id, ensuring it is focusable
 * for accessibility tools.
 *
 * @param {Object} event - The click event from the skip link.
 * @param {Function} event.preventDefault - Prevents the default anchor behavior.
 */
const handleSkip = (event: { preventDefault: () => void }) => {
  event.preventDefault()
  const destinationElement = document.getElementById(target)
  if (destinationElement) {
    destinationElement.setAttribute('tabindex', '-1')
    ;(destinationElement as HTMLElement).focus()
  }
}
</script>

<template>
  <div class="skip-to">
    <pep-pharos-link href="#" @click="handleSkip">
      <slot></slot>
    </pep-pharos-link>
  </div>
</template>

<style lang="scss" scoped>
.skip-to {
  position: relative;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
  overflow: hidden;
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  border: 0;

  &:focus-within {
    position: relative;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    white-space: normal;
    clip-path: none;
    display: flex;
    justify-content: center;
  }
}
</style>
