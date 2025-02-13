<template>
  <div :class="['control-bar', buttonDirection]">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'ControlBar',
  props: {
    buttonDirection: {
      type: String,
      default: 'horizontal',
      validator: function (value) {
        // The value must match one of these strings
        return ['horizontal', 'vertical'].indexOf(value) !== -1
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.control-bar {
  box-shadow: 0 4px 12px 0 rgba(51, 51, 51, 0.5);
  border-radius: 2px !important;
  display: flex;
  margin: 0;
  padding: 0;

  &.vertical {
    flex-direction: column;

    &::v-deep(button:first-of-type) {
      border-top-left-radius: 2px !important;
      border-top-right-radius: 2px !important;
    }

    &::v-deep(button:last-of-type) {
      border-bottom-left-radius: 2px !important;
      border-bottom-right-radius: 2px !important;
    }
  }

  &.horizontal {
    flex-direction: row;

    &::v-deep(button:first-of-type) {
      border-bottom-left-radius: 2px !important;
      border-top-left-radius: 2px !important;
    }

    &::v-deep(button:last-of-type) {
      border-bottom-right-radius: 2px !important;
      border-top-right-radius: 2px !important;
    }
  }
}
</style>
