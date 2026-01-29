<script setup lang="ts">
import type { PropType } from 'vue'
import { ref } from 'vue'
import RestrictedItemLabel from './RestrictedItemLabel.vue'
const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '[Untitled]',
  },
  subtitle: {
    type: [Array<string>, String] as PropType<string[] | string>,
    default: '',
  },
  showRestrictedLabel: {
    type: Boolean,
    default: false,
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
  <span class="document-title-container">
    <span class="title-and-subtitle">
      <span v-if="title" class="document-title">
        <component :is="component">
          <span v-html="title" />
        </component>
        <RestrictedItemLabel v-if="showRestrictedLabel && !subtitle?.length && !small" :id="id" />
      </span>

      <span v-else>
        <component :is="component" class="document-title">
          <span>[Untitled]</span>
        </component>
        <RestrictedItemLabel v-if="showRestrictedLabel && !subtitle?.length && !small" :id="id" />
      </span>

      <span v-if="Array.isArray(subtitle) && (subtitle || []).length">
        <component :is="component" class="document-subtitle">
          <span
            v-for="(sub, i) in subtitle"
            :key="`subtitle_${i}`"
            v-html="separateSubtitle(title, sub as string)"
          />
        </component>
        <RestrictedItemLabel v-if="showRestrictedLabel && !small" :id="id" />
      </span>

      <span v-else-if="subtitle && !Array.isArray(subtitle)">
        <component :is="component" class="document-subtitle">
          <span v-html="separateSubtitle(title, subtitle as string)" />
        </component>
        <RestrictedItemLabel v-if="showRestrictedLabel && !small" :id="id" />
      </span>
    </span>

    <pep-pharos-tooltip :id="`restricted-tooltip-${id}`" placement="top">
      <span>
        Item not accessible in facilities that subscribe to the Restricted Items list. Reviewers can
        still access item.
      </span>
    </pep-pharos-tooltip>
  </span>
</template>
<style lang="scss" scoped>
.title-and-subtitle {
  .document-subtitle,
  .document-title {
    display: inline-block;
    vertical-align: middle;
  }
}
</style>
