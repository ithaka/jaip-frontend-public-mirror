<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useCoreStore } from '@/stores/core'

const coreStore = useCoreStore()

const props = defineProps({
  show: Boolean,
})
const emit = defineEmits(['close', 'submit'])
const submitForm = async () => {
  touchedName.value = true
  // If there is no name or the name is a duplicate, do not submit
  if (noName.value || duplicateName.value) return
  const { data } = await coreStore.$api.auth.subdomains.add({ name: newName.value })
  if (data.duplicate) {
    duplicateName.value = true
  } else {
    emit('submit')
  }
}
const newName = ref('')
const touchedName = ref(false)
const duplicateName = ref(false)
const noName = computed(() => newName.value.trim() === '')
const invalidName = computed(() => {
  return touchedName.value && (duplicateName.value || noName.value)
})
const errorMessage = computed(() => {
  if (!touchedName.value) return ''
  if (noName.value) return 'Subdomain name is required'
  if (duplicateName.value) return 'Subdomain already exists'
  return ''
})
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="add-subdomain-modal"
      header="Add Subdomain"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <p slot="description" class="mb-3">Enter a unique name to add a new subdomain.</p>
      <form @submit.prevent.stop="submitForm">
        <input type="text" hidden />
        <pep-pharos-input-group
          :id="`subdomain_name`"
          :value="newName"
          :placeholder="'Enter subdomain'"
          :message="errorMessage"
          :invalidated="invalidName"
          :name="`subdomain_name`"
          maxlength="255"
          @keydown.enter.prevent.stop="submitForm"
          @input="((duplicateName = false), (touchedName = true), (newName = $event.target.value))"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Subdomain</span>
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
