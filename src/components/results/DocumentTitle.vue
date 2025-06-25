<script setup lang="ts">
import type { PropType } from 'vue'
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '[Untitled]',
  },
  subtitle: {
    type: [Array<string>, String] as PropType<string[] | string>,
    default: '',
  },
  small: Boolean,
})
// Subtitle Handling
const separateSubtitle = (title: string, subtitle: string) => {
  if (title.endsWith(':') || subtitle.startsWith(':')) {
    return `&nbsp;${subtitle}`
  } else {
    return `:&nbsp;${subtitle}`
  }
}
const component = ref(props.small ? 'small' : 'span')
</script>

<template>
  <span>
    <span>
      <!-- eslint-disable vue/no-v-html -->
      <component
        :is="component"
        v-if="title"
        class="document-title"
      >
        <span v-html="title" />
      </component>
      <!-- eslint-enable vue/no-v-html  -->

      <component
        :is="component"
        v-else
        class="document-title"
      > [Untitled] </component>
      <component
        :is="component"
        v-if="Array.isArray(subtitle) && (subtitle || []).length"
      >
        <!-- eslint-disable vue/no-v-html -->
        <span
          v-for="(sub, i) in subtitle"
          :key="`subtitle_${i}`"
          v-html="separateSubtitle(title, sub as string)"
        />
        <!-- eslint-enable vue/no-v-html  -->
      </component>
      <component
        :is="component"
        v-else-if="subtitle && !Array.isArray(subtitle)"
      >
        <!-- eslint-disable vue/no-v-html -->
        <span v-html="separateSubtitle(title, subtitle as string)" />
        <!-- eslint-enable vue/no-v-html  -->
      </component>
    </span>
  </span>
</template>
