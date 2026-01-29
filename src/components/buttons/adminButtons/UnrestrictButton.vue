<script setup lang="ts">
import { useLogger } from '@/composables/logging/useLogger'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import { useCoreStore } from '@/stores/core'
import { useSearchStore } from '@/stores/search'
import { useUserStore } from '@/stores/user'
import { changeRoute } from '@/utils/helpers'
import { storeToRefs } from 'pinia'
import { type PropType } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
})

const searchStore = useSearchStore()
const { reviewStatus, searchTerms, pageNo } = storeToRefs(searchStore)

const userStore = useUserStore()
const { ungroupedFeatures } = storeToRefs(userStore)

const coreStore = useCoreStore()
const { isSpinning } = storeToRefs(coreStore)

const { handleWithLog, logs } = useLogger()

const router = useRouter()
const route = useRoute()

const emit = defineEmits(['restrictSubmitted', 'close'])

const {
  handleUnrestrictLog,
  openUnrestrictModalLog,
  closeUnrestrictModalLog,
  cancelUnrestrictModalLog,
} = logs.getUnrestrictLogs({ doi: props.doc.doi })

const handleUnrestrict = async () => {
  if (!ungroupedFeatures.value['manage_restricted_list']?.enabled) {
    return
  }
  const args = {
    doi: props.doc.doi,
  }
  try {
    isSpinning.value = true
    await coreStore.$api.global_restricts.unrestrict(args)
    await searchStore.doSearch(route.path === '/requests' ? reviewStatus.value : '', false)

    emit('restrictSubmitted', {
      ...args,
    })
    const msg = 'This material has been unrestricted.'
    coreStore.toast(msg, 'success')

    if (route.path.startsWith('/pdf') || route.path.startsWith('/page')) {
      changeRoute(router, emit, '/requests', searchTerms.value, pageNo.value, undefined, undefined)
    }
    coreStore.$api.log({
      eventtype: 'pep_unrestrict_submitted',
      event_description: 'user submitted unrestrict',
      dois: [args.doi],
    })
  } catch {
    const msg = 'There was an error and your unrestrict was not submitted.'
    coreStore.toast(`Oops! ${msg}`, 'error')
  } finally {
    isSpinning.value = false
  }
}
</script>
<template>
  <pep-pharos-button
    :full-width="fullWidth ? true : undefined"
    class="mb-2 lg-mr-3"
    icon-left="delete"
    :data-modal-id="`unrestrict-modal-${doc.iid}`"
    variant="secondary"
    @click.prevent.stop="handleWithLog(openUnrestrictModalLog)"
  >
    <span>Unrestrict</span>
  </pep-pharos-button>
  <Teleport to="body">
    <pep-pharos-modal
      :id="`unrestrict-modal-${doc.iid}`"
      header="Unrestrict material"
      @pharos-modal-close="handleWithLog(closeUnrestrictModalLog)"
    >
      <p slot="description" class="mb-3">
        This will make
        <span v-if="doc.title"
          ><em v-html="doc.title" />&nbsp;available for request at all facilities.</span
        >
      </p>

      <pep-pharos-button
        slot="footer"
        variant="secondary"
        data-modal-close
        @click="handleWithLog(cancelUnrestrictModalLog)"
      >
        Cancel
      </pep-pharos-button>

      <pep-pharos-button
        slot="footer"
        data-modal-close
        @click="handleWithLog(handleUnrestrictLog, handleUnrestrict)"
      >
        Confirm
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
