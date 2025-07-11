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
  touchedName.value = true
  // If there is no name or the name is a duplicate, do not submit
  if (noName.value || duplicateName.value) return
  const { data } = await coreStore.$api.auth.groups.edit({ name: newName.value, id: props.groupId })
  if (data.duplicate) {
    duplicateName.value = true
  } else {
    emit('submit')
  }
}
const newName = ref(props.name)
const touchedName = ref(false)
const duplicateName = ref(false)
const noName = computed(() => newName.value.trim() === '')
const invalidName = computed(() => {
  return touchedName.value && (duplicateName.value || noName.value)
})
const errorMessage = computed(() => {
  if (!touchedName.value) return ''
  if (noName.value) return 'Group name is required'
  if (duplicateName.value) return 'Group already exists'
  return ''
})
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="edit-group-modal"
      header="Edit Group"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <p slot="description" class="mb-3">Edit {{ props.name }} by adding a unique new name.</p>
      <form @submit.prevent.stop="submitForm">
        <input type="text" hidden />
        <pep-pharos-input-group
          :id="`group_name`"
          :value="newName"
          :placeholder="'Enter group name'"
          :message="errorMessage"
          :invalidated="invalidName"
          :name="`group_name`"
          maxlength="255"
          @keydown.enter.prevent.stop="submitForm"
          @input="((duplicateName = false), (touchedName = true), (newName = $event.target.value))"
        >
          <span slot="label">Group Name</span>
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
