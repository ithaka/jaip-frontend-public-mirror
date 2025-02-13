<script lang="ts" setup>
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const emit = defineEmits(['logout', 'close'])
const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)
const router = useRouter()
</script>
<template>
  <pep-pharos-alert status="warning" class="alert">
    <div>
      <span class="mb-2">Requests are temporarily disabled at this site. To browse pre-approved material, try:</span>
      <ul>
          <li>
          Filtering for Subjects or Journals in your 
          <pep-pharos-link
              @click.prevent.stop="changeRoute(router, emit, '/search', searchTerms, pageNo, undefined, undefined)"
          >search results</pep-pharos-link>
          </li>
          <li>
          Browsing approved 
          <pep-pharos-link
              @click.prevent.stop="changeRoute(router, emit, '/requests', searchTerms, pageNo, undefined, undefined)"
          >
              requests
          </pep-pharos-link> 
          by changing the Status field to "Approved"
          </li>
      </ul>

    </div>
  </pep-pharos-alert>
</template>