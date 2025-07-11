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
  // If delete hasn't been typed, do not submit
  if (noDelete.value) return (touchedInstruction.value = true)
  await coreStore.$api.auth.groups.remove({ id: props.groupId })
  emit('submit')
}
const deleteInstruction = ref('')
const touchedInstruction = ref(false)
const noDelete = computed(() => deleteInstruction.value.trim().toLowerCase() !== 'delete')
const invalidName = computed(() => {
  return touchedInstruction.value && noDelete.value
})
const errorMessage = computed(() => {
  if (!touchedInstruction.value) return ''
  if (noDelete.value) return 'Type "delete" to confirm deletion'
  return ''
})
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="delete-group-modal"
      header="Delete Group"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <p slot="description" class="mb-3">Are you sure you want to delete {{ props.name }}?</p>
      <form @submit.prevent.stop="submitForm">
        <input type="text" hidden />
        <pep-pharos-input-group
          :id="`delete_${props.groupId}`"
          :value="deleteInstruction"
          :placeholder="`Type 'delete' to confirm deletion`"
          :message="errorMessage"
          :invalidated="invalidName"
          :name="`delete_${props.groupId}`"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedInstruction = true), (deleteInstruction = $event.target.value))"
        >
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
