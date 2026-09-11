<script lang="ts" setup>
import { changeRoute } from '@/utils/helpers'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useLogger } from '@/composables/logging/useLogger'

const emit = defineEmits(['logout', 'close'])
const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)
const router = useRouter()

const { handleWithLog, logs } = useLogger()
const { searchLinkLog, requestsLinkLog } = logs.getRequestWarningLogs()
</script>
<template>
  <pep-pharos-alert status="warning" class="alert">
    <div>
      <span class="mb-2"
        >Requests are temporarily disabled at this site. To browse pre-approved material, try:</span
      >
      <ul>
        <li>
          Filtering for Subjects or Journals in your
          <pep-pharos-link
            @click.prevent.stop="
              handleWithLog(searchLinkLog, () =>
                changeRoute(router, { emit, path: '/search', term: searchTerms, page: pageNo }),
              )
            "
          >
            search results
          </pep-pharos-link>
        </li>
        <li>
          Browsing approved
          <pep-pharos-link
            @click.prevent.stop="
              handleWithLog(requestsLinkLog, () =>
                changeRoute(router, { emit, path: '/requests', term: searchTerms, page: pageNo }),
              )
            "
          >
            requests
          </pep-pharos-link>
          by changing the Status field to "Approved"
        </li>
      </ul>
    </div>
  </pep-pharos-alert>
</template>
