<script lang="ts" setup>
import { ref, computed } from 'vue'
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
  // If clear history hasn't been typed, do not submit
  if (noClear.value) return (touchedInstruction.value = true)
  await coreStore.$api.auth.groups.clearHistory({ id: props.groupId })
  emit('submit')
}
const clearInstruction = ref('')
const touchedInstruction = ref(false)
const noClear = computed(() => clearInstruction.value.trim().toLowerCase() !== 'clear history')
const invalidName = computed(() => {
  return touchedInstruction.value && noClear.value
})
const errorMessage = computed(() => {
  if (!touchedInstruction.value) return ''
  if (noClear.value) return 'Type "clear history" to confirm removal'
  return ''
})
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="clear-history-modal"
      header="Clear History"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <div slot="description" class="mb-3">
        <p>
          Are you sure you want to erase the media review history from {{ props.name }}? This will
          leave no record of any media review or bulk approval.
        </p>
      </div>
      <form @submit.prevent.stop="submitForm">
        <input type="text" hidden />
        <pep-pharos-input-group
          :id="`clear_history_${props.groupId}`"
          :value="clearInstruction"
          :placeholder="`Type 'clear history' to confirm removal`"
          :message="errorMessage"
          :invalidated="invalidName"
          :name="`clear_history_${props.groupId}`"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedInstruction = true), (clearInstruction = $event.target.value))"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Confirm</span>
        </pep-pharos-input-group>
      </form>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" @click.prevent.stop="submitForm"> Submit </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
