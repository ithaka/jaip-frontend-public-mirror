<script lang="ts" setup>
import { useCoreStore } from '@/stores/core'
import type { Subdomain } from '@/interfaces/Subdomains'
import type { PropType } from 'vue'

const coreStore = useCoreStore()

const props = defineProps({
  show: Boolean,
  subdomain: {
    type: Object as PropType<Subdomain>,
    required: true
  }
})
const emit = defineEmits(['close', 'submit'])
const submitForm = async () => {
  await coreStore.$api.auth.subdomains.reactivate({ id: props.subdomain.id })
  emit('submit')
}
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      :id="`reactivate-subdomain-modal-${props.subdomain.id}`"
      header="Reactivate Subdomain"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <p slot="description" class="mb-3">
        Are you sure you want to reactivate {{ props.subdomain.subdomain }}?
      </p>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" @click.prevent.stop="submitForm"> Submit </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
