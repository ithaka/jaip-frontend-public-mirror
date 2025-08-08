<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  startOpen: {
    type: Boolean,
    default: false,
  },
  limit: {
    type: Number,
    default: 220,
  },
  small: Boolean,
})
const expand = ref(false)
const component = ref(props.small ? 'small' : 'span')
</script>
<template>
  <div>
    <component :is="component">
      <!-- eslint-disable vue/no-v-html -->
      <span v-if="expand" :class="[{ 'text-size-xs': small }, 'inline text-full']" v-html="text" />
      <!-- eslint-enable vue/no-v-html -->
      <!-- eslint-disable vue/no-v-html -->
      <span v-else :class="[{ 'text-size-xs': small }, 'inline text-truncate']" v-html="text" />
    </component>
    <!-- eslint-enable vue/no-v-html -->
    <pep-pharos-button
      v-if="(text || []).length > limit"
      variant="subtle"
      class="inline-button"
      @click="expand = !expand"
    >
      <span :class="[{ 'text-size-xs': small }, 'text-weight-regular']">{{
        expand ? 'less' : 'more'
      }}</span>
    </pep-pharos-button>
  </div>
</template>
<style scoped lang="scss">
.text-truncate {
  display: -webkit-box !important;
  -webkit-line-clamp: 3; /* Limit to 3 lines */
  line-clamp: 3; /* Standard property for compatibility */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.inline-button {
  height: var(--pharos-spacing-1-x);
  margin-left: 0.5rem;
  > * {
    line-height: 16px; /* Ensure button text is vertically centered */
  }
}
</style>
