<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useCoreStore } from '@/stores/core'
import type { Feature } from '@/interfaces/Features'
import type { PropType } from 'vue'

const coreStore = useCoreStore()

const props = defineProps({
  show: Boolean,
  feature: {
    type: Object as PropType<Feature>,
    required: true,
  },
  ungrouped: Boolean,
})
const emit = defineEmits(['close', 'submit'])
const submitForm = async () => {
  // If delete hasn't been typed, do not submit
  if (noDelete.value) return (touchedInstruction.value = true)
  const type = props.ungrouped ? 'ungrouped' : 'basic'
  await coreStore.$api.auth.features[type].remove({ id: props.feature.id })
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
      :id="`delete-feature-modal-${props.feature.id}`"
      header="Delete Feature"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <p slot="description" class="mb-3">
        Are you sure you want to delete {{ props.feature.display_name }}? Note that deactivating
        this feature will also remove it from any entities to which it might be connected.
      </p>
      <form @submit.prevent.stop="submitForm">
        <input type="text" hidden />
        <pep-pharos-input-group
          :id="`delete_feature_${props.feature.id}`"
          :value="deleteInstruction"
          :placeholder="`Type 'delete' to confirm deletion`"
          :message="errorMessage"
          :invalidated="invalidName"
          :name="`delete_feature_${props.feature.id}`"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedInstruction = true), (deleteInstruction = $event.target.value))"
        >
          <span slot="label">Confirm</span>
        </pep-pharos-input-group>
      </form>

      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <pep-pharos-button slot="footer" @click.prevent.stop="submitForm"> Submit </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
