<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useCoreStore } from '@/stores/core'
import type { Feature } from '@/interfaces/Features'
const coreStore = useCoreStore()

const props = defineProps({
  show: Boolean,
  ungrouped: Boolean,
})
const emit = defineEmits(['close', 'submit'])
const emptyFeature = {
  name: '',
  display_name: '',
  category: '',
  description: '',
  is_active: true,
} as Feature
const resetTouched = (val: boolean) => {
  touchedName.value = val
  touchedDisplayName.value = val
  touchedCategory.value = val
  touchedDescription.value = val
}
const submitForm = async () => {
  resetTouched(true)
  // If there is no name or the name is a duplicate, do not submit
  if (
    invalidName.value ||
    invalidDisplayName.value ||
    invalidCategory.value ||
    invalidDescription.value
  )
    return
  const type = props.ungrouped ? 'ungrouped' : 'basic'
  const { data } = await coreStore.$api.auth.features[type].add(newFeature.value)

  if (data.duplicate) {
    duplicateName.value = true
    duplicateDisplayName.value = true
  } else {
    newFeature.value = { ...emptyFeature }
    resetTouched(false)
    emit('submit')
  }
}
const newFeature = ref({ ...emptyFeature })
if (!props.ungrouped) {
  newFeature.value.is_protected = false
  newFeature.value.is_admin_only = false
}
const touchedName = ref(false)
const duplicateName = ref(false)
const noName = computed(() => newFeature.value.name.trim() === '')
const invalidName = computed(() => {
  return touchedName.value && (duplicateName.value || noName.value)
})
const nameErrorMessage = computed(() => {
  if (!touchedName.value) return ''
  if (noName.value) return 'A feature name is required'
  if (duplicateName.value) return 'A feature with that name already exists'
  return ''
})

const touchedDisplayName = ref(false)
const duplicateDisplayName = ref(false)
const noDisplayName = computed(() => newFeature.value.display_name.trim() === '')
const invalidDisplayName = computed(() => {
  return touchedDisplayName.value && (duplicateDisplayName.value || noDisplayName.value)
})
const displayNameErrorMessage = computed(() => {
  if (!touchedDisplayName.value) return ''
  if (noDisplayName.value) return 'A feature display name is required'
  if (duplicateDisplayName.value) return 'A feature with that display name already exists'
  return ''
})

const touchedCategory = ref(false)
const noCategory = computed(
  () => !newFeature.value.category || newFeature.value.category?.trim() === '',
)
const invalidCategory = computed(() => {
  return touchedCategory.value && noCategory.value
})
const categoryErrorMessage = computed(() => {
  if (!touchedCategory.value) return ''
  if (noCategory.value) return 'A feature category is required'
  return ''
})

const touchedDescription = ref(false)
const noDescription = computed(() => newFeature.value.description.trim() === '')
const invalidDescription = computed(() => {
  return touchedDescription.value && noDescription.value
})
const descriptionErrorMessage = computed(() => {
  if (!touchedDescription.value) return ''
  if (noDescription.value) return 'A feature description is required'
  return ''
})
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="add-feature-modal"
      header="Add Feature"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <p
        slot="description"
        class="mb-3"
      >
        Fill out the form to add a new feature.
      </p>
      <form @submit.prevent.stop="submitForm">
        <input
          type="text"
          hidden
        >
        <pep-pharos-input-group
          :id="`feature_name`"
          :value="newFeature.name"
          :placeholder="'Enter feature name'"
          :message="nameErrorMessage"
          :invalidated="invalidName"
          :name="`feature_name`"
          maxlength="255"
          :class="{ 'mb-4': !invalidName }"
          @keydown.enter.prevent.stop="submitForm"
          @input="
            ((duplicateName = false), (touchedName = true), (newFeature.name = $event.target.value))
          "
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Name</span>
        </pep-pharos-input-group>
        <pep-pharos-input-group
          :id="`feature_display_name`"
          :value="newFeature.display_name"
          :placeholder="'Enter feature display name'"
          :message="displayNameErrorMessage"
          :invalidated="invalidDisplayName"
          :name="`feature_display_name`"
          maxlength="255"
          :class="{ 'mb-4': !invalidDisplayName }"
          @keydown.enter.prevent.stop="submitForm"
          @input="
            ((duplicateDisplayName = false),
             (touchedDisplayName = true),
             (newFeature.display_name = $event.target.value))
          "
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Display Name</span>
        </pep-pharos-input-group>
        <pep-pharos-input-group
          :id="`feature_category`"
          :value="newFeature.category"
          :placeholder="'Enter feature category'"
          :message="categoryErrorMessage"
          :invalidated="invalidCategory"
          :name="`feature_category`"
          maxlength="255"
          :class="{ 'mb-4': !invalidCategory }"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedCategory = true), (newFeature.category = $event.target.value))"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Category</span>
        </pep-pharos-input-group>
        <pep-pharos-input-group
          :id="`feature_description`"
          :value="newFeature.description"
          :placeholder="'Enter feature description'"
          :message="descriptionErrorMessage"
          :invalidated="invalidDescription"
          :name="`feature_description`"
          maxlength="255"
          :class="{ 'mb-4': !invalidDescription }"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedDescription = true), (newFeature.description = $event.target.value))"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Description</span>
        </pep-pharos-input-group>
        <div
          v-if="!props.ungrouped"
          class="mt-3"
        >
          <pep-pharos-checkbox
            :id="`admin_checkbox`"
            class="mr-5"
            :checked="newFeature.is_admin_only"
            @change="newFeature.is_admin_only = !newFeature.is_admin_only"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <span slot="label">Admin Only</span>
          </pep-pharos-checkbox>
          <pep-pharos-checkbox
            :id="`protected_checkbox`"
            :checked="newFeature.is_protected"
            @change="newFeature.is_protected = !newFeature.is_protected"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <span slot="label">Protected</span>
          </pep-pharos-checkbox>
        </div>
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
