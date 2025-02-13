<script setup lang="ts">
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'
import DocumentTitle from '@/components/results/DocumentTitle.vue'
import { ref } from 'vue'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({})
  },
  small: Boolean
})

// Page Extraction
const getPages = (doc: MediaRecord) => {
  if (doc.fpage && doc.lpage && doc.fpage !== doc.lpage) {
    return `(pp. ${doc.fpage}-${doc.lpage})`
  } else if (doc.fpage || doc.fpage === doc.lpage) {
    return `(p. ${doc.fpage})`
  } else {
    return `(p. ${doc.lpage})`
  }
}

// Publisher Extraction
const getPublisher = (doc: MediaRecord) => {
  if (doc.book_publisher) {
    try {
      const parsed = JSON.parse(doc.book_publisher)
      if (parsed.length && parsed[0].publisher) {
        return parsed[0].publisher
      }
    } catch {
      return ''
    }
  }
  return ''
}
const component = ref(props.small ? 'small' : 'span')
</script>
<template>
  <div>
    <div class="pr-6">
      <div>
        <!-- Content Type -->
        <div class="text-color-gray-40 text-uppercase text-weight-bold text-size-sm">
          <component :is="component">{{ doc.contentType }}</component>
        </div>
        <div class="search-result-title">
          <!-- Title -->
          <pep-pharos-heading :level="3" preset="3">
            <DocumentTitle :title="doc.title" :subtitle="doc.subtitle" :small="small" />
          </pep-pharos-heading>
          <!-- Pages -->
          <pep-pharos-heading :level="3" preset="3">
            <span
              v-if="doc.cty === 'chapter' && (doc.fpage || doc.lpage)"
              class="text-size-md text-color-gray-40 text-font-sans"
            >
              {{ getPages(doc) }} <br />
            </span>
          </pep-pharos-heading>
        </div>
        <!-- Authors -->
        <div>
          <span v-if="doc.authors">
            <component :is="component">{{ doc.authors.join(', ') }}</component>
          </span>
        </div>
        <!-- Book Publisher -->
        <div v-if="doc.tb || doc.book_publisher">
          <span>
            <component :is="component">From:&nbsp;</component>
          </span>
          <span v-if="doc.tb">
            <component :is="component"
              ><em>{{ doc.tb }}</em
              ><span v-if="getPublisher(doc)">,&nbsp;</span></component
            >
          </span>
          <span v-if="getPublisher(doc)">
            <component :is="component">{{ getPublisher(doc) }}</component>
          </span>
          <span v-if="doc.year">
            <component :is="component">{{ `&nbsp;(${doc.year})` }}</component>
          </span>
        </div>
        <!-- Metadata Citation Line -->
        <component :is="component" v-else>
          <!-- eslint-disable vue/no-v-html -->
          <span class="text-color-gray-40" v-html="doc.citation_line" />
          <!-- eslint-enable vue/no-v-html  -->
        </component>
      </div>
    </div>
  </div>
</template>
