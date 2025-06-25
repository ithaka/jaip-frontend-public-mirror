<script setup lang="ts">
import truncate from 'html-truncate'
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
const expand = ref(props.startOpen)
const component = ref(props.small ? 'small' : 'span')
</script>
<template>
  <div>
    <component :is="component">
      <!-- eslint-disable vue/no-v-html -->
      <span
        v-if="expand"
        :class="[{ 'text-size-xs': small }, 'inline']"
        v-html="text"
      />
      <!-- eslint-enable vue/no-v-html -->
      <!-- eslint-disable vue/no-v-html -->
      <span
        v-else
        :class="[{ 'text-size-xs': small }, 'inline']"
        v-html="truncate(text, limit, {})"
      />
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
