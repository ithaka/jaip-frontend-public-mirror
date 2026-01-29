a
<script setup lang="ts">
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { getStatus } from '@/utils/helpers'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'
import { ref, computed } from 'vue'

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
  hideRequests: Boolean,
  buttonLabel: {
    type: String,
    default: 'Request this',
  },
  cancelButtonLabel: {
    type: String,
    default: 'Cancel request',
  },
  fullWidth: {
    type: Boolean,
    default: true,
  },
})

const coreStore = useCoreStore()
const { reqs } = storeToRefs(coreStore)

const userStore = useUserStore()
const { groupIDs } = storeToRefs(userStore)

const showExcessiveRequestsWarningModal = ref(false)
const cartFull = computed(() => reqs.value.length >= 10)

const emit = defineEmits(['submitRequest', 'cancelRequest'])

const addRequest = (doc: string) => {
  if (!cartFull.value) {
    coreStore.addRequest(doc)
    emit('submitRequest')
  } else {
    showExcessiveRequestsWarningModal.value = true
  }
}
const status = computed(() => getStatus(props.doc.mediaReviewStatuses, groupIDs.value))
const canRequest = computed(() => {
  return (
    !reqs.value.includes(JSON.stringify(props.doc)) &&
    status.value !== 'approved' &&
    status.value !== 'pending' &&
    status.value !== 'restricted' &&
    userStore.features['submit_requests'] &&
    !props.hideRequests
  )
})
</script>
<template>
  <div
    class="request-button-container"
    :class="{ 'request-button-container--full-width': fullWidth }"
  >
    <div>
      <pep-pharos-button
        v-if="canRequest"
        full-width
        icon-left="checkmark-inverse"
        @click.prevent.stop="addRequest(JSON.stringify(doc))"
      >
        <span class="text-align-center">{{ buttonLabel }}</span>
      </pep-pharos-button>
      <pep-pharos-button
        v-if="!canRequest && reqs.includes(JSON.stringify(doc)) && !hideRequests"
        full-width
        icon-left="close-inverse"
        variant="secondary"
        @click.prevent.stop="
          () => {
            coreStore.removeRequest(JSON.stringify(doc))
            emit('cancelRequest')
          }
        "
      >
        <span>{{ cancelButtonLabel }}</span>
      </pep-pharos-button>
    </div>
    <Teleport to="div#app">
      <pep-pharos-modal
        v-if="showExcessiveRequestsWarningModal"
        :id="`excessive-requests-warning-modal`"
        :key="`excessive-requests-warning-modal`"
        :header="`Too Many Requests`"
        size="large"
        class="warning-modal"
        :open="showExcessiveRequestsWarningModal"
        @pharos-modal-closed="showExcessiveRequestsWarningModal = false"
      >
        <div slot="description">
          <p class="warning-text">
            Your cart is full. Please remove an item or submit your current requests before adding
            more.
          </p>
          <p class="warning-text">
            Media review can be time consuming. Reviewers may deny requests or limit access at times
            when they are dealing with requests they deem excessive.
          </p>
        </div>

        <template slot="footer">
          <pep-pharos-button
            variant="primary"
            @click.prevent.stop="showExcessiveRequestsWarningModal = false"
          >
            Cancel
          </pep-pharos-button>
        </template>
      </pep-pharos-modal>
    </Teleport>
  </div>
</template>
<style lang="scss" scoped>
.warning-modal {
  .warning-text {
    margin-bottom: var(--pharos-spacing-three-quarters-x);
  }
}
.request-button-container {
  max-width: fit-content;
  justify-self: center;
  &--full-width {
    width: 100%;
    max-width: 100%;
  }
}
</style>
