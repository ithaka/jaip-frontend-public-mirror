<script lang="ts" setup>
import { useCoreStore } from '@/stores/core'

const coreStore = useCoreStore()

const props = defineProps({
  show: Boolean,
  name: {
    type: String,
    required: true,
  },
  groupId: {
    type: Number,
    required: true,
  },
})
const emit = defineEmits(['close', 'submit'])
const submitForm = async () => {
  await coreStore.$api.auth.groups.reactivate({ id: props.groupId })
  emit('submit')
}
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="reactivate-group-modal"
      header="Reactivate Group"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <p slot="description" class="mb-3">Are you sure you want to reactivate {{ props.name }}?</p>

      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <pep-pharos-button slot="footer" @click.prevent.stop="submitForm"> Submit </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
