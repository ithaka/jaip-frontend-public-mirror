<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'

import type { Entity } from '@/interfaces/Entities'
import type { UngroupedFeatureDetails } from '@/interfaces/Features'

const coreStore = useCoreStore()
const userStore = useUserStore()
const { ungroupedFeatures, sortedUngroupedFeatures, sortedEnabledUngroupedFeatures } =
  storeToRefs(userStore)

const props = defineProps({
  show: Boolean,
  user: {
    type: Object as PropType<Entity>,
    required: true
  }
})

const disenable = (ufd: UngroupedFeatureDetails) => {
  return Object.keys(ufd).reduce((obj, key) => {
    obj[key] = { ...ufd[key] }
    obj[key].enabled = false
    return obj
  }, {} as UngroupedFeatureDetails)
}

const newUser = ref({ ...props.user })
if (!newUser.value.name) newUser.value.name = ''
if (!newUser.value.contact) newUser.value.contact = ''
if (!newUser.value.groups) newUser.value.groups = []
if (
  !newUser.value.ungrouped_features ||
  Object.keys(newUser.value.ungrouped_features).length < Object.keys(ungroupedFeatures.value).length
) {
  newUser.value.ungrouped_features = disenable(ungroupedFeatures.value)
} else {
  newUser.value.ungrouped_features = { ...newUser.value.ungrouped_features }
}

const newUserSortedUngroupedFeatures = computed(() =>
  userStore.sortUngroupedFeatures(newUser.value.ungrouped_features!)
)

const hasAllFeatures = computed(() => {
  for (const key in newUser.value.ungrouped_features) {
    if (!newUser.value.ungrouped_features[key].enabled) return false
  }
  return true
})

const checkAllFeaturesInCategory = (category: string | number) => {
  const sortedFeatures = userStore.sortUngroupedFeatures(newUser.value.ungrouped_features!)
  for (const key in sortedFeatures[category]) {
    if (!sortedFeatures[category][key].enabled) return false
  }
  return true
}
const checkSomeFeaturesInCategory = (category: string | number) => {
  const sortedFeatures = userStore.sortUngroupedFeatures(newUser.value.ungrouped_features!)
  if (checkAllFeaturesInCategory(category)) return false

  for (const key in sortedFeatures[category]) {
    if (sortedFeatures[category][key].enabled) return true
  }
  return false
}

const hasSomeFeatures = computed(() => {
  if (hasAllFeatures.value) return false
  for (const key in newUser.value.ungrouped_features) {
    if (newUser.value.ungrouped_features[key].enabled) return true
  }
  return false
})

const emit = defineEmits(['close', 'submit'])
const submitForm = async () => {
  touchedName.value = true
  touchedContact.value = true
  // If there is no name or the name is a duplicate, do not submit
  if (noName.value || noContact.value) return
  if (!newUser.value.id) {
    await coreStore.$api.auth.entities.add(newUser.value, 'users')
  } else {
    await coreStore.$api.auth.entities.edit(newUser.value, 'users')
  }
  emit('submit')
}

const touchedName = ref(false)
const touchedContact = ref(false)
const noName = computed(() => newUser.value.name!.trim() === '')
const noContact = computed(() => newUser.value.contact!.trim() === '')
const invalidName = computed(() => {
  return touchedName.value && noName.value
})
const invalidContact = computed(() => {
  return touchedContact.value && noContact.value
})

const nameErrorMessage = computed(() => {
  if (!touchedName.value) return ''
  if (noName.value) return 'User name is required'
  return ''
})
const contactErrorMessage = computed(() => {
  if (!touchedContact.value) return ''
  if (noContact.value) return 'Email is required'
  return ''
})

const selectAll = () => {
  if (hasAllFeatures.value) {
    newUser.value.ungrouped_features = disenable(ungroupedFeatures.value)
  } else {
    newUser.value.ungrouped_features = ungroupedFeatures.value
  }
}

const selectAllInCategory = (category: string | number) => {
  let newValue = {} as UngroupedFeatureDetails
  if (checkAllFeaturesInCategory(category)) {
    newValue = disenable(newUserSortedUngroupedFeatures.value[category])
  } else {
    newValue = sortedUngroupedFeatures.value[category]
  }
  for (const key in newUser.value.ungrouped_features) {
    if (newUser.value.ungrouped_features[key].category === category) {
      newUser.value.ungrouped_features[key].enabled = newValue[key].enabled
    }
  }
}
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      :id="`edit-user-modal-${newUser.id || 0}`"
      :header="`${!newUser.id ? 'Add' : 'Edit'} User`"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <form @submit.prevent.stop="submitForm">
        <pep-pharos-input-group
          :id="`user_name`"
          :value="newUser.name"
          :placeholder="'Enter name'"
          :message="nameErrorMessage"
          :invalidated="invalidName"
          :name="`user_name`"
          maxlength="255"
          class="mb-5"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedName = true), (newUser.name = $event.target.value))"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Name</span>
        </pep-pharos-input-group>
        <pep-pharos-input-group
          :id="`user_contact`"
          :value="newUser.contact"
          :placeholder="'Enter email'"
          :message="contactErrorMessage"
          :invalidated="invalidContact"
          :name="`user_contact`"
          type="email"
          maxlength="255"
          class="mb-5"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedContact = true), (newUser.contact = $event.target.value))"
        >
          <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
          <span slot="label">Email</span>
        </pep-pharos-input-group>

        <div>
          <pep-pharos-checkbox
            class="mb-4"
            :checked="hasAllFeatures"
            :indeterminate="hasSomeFeatures"
            @click="selectAll()"
          >
            <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
            <span slot="label" class="text-weight-bold"> Select All </span>
          </pep-pharos-checkbox>
        </div>
        <div>
          <ul class="entity-features">
            <li
              v-for="(category, label, index) in sortedEnabledUngroupedFeatures"
              :key="`ungrouped_category_${index}`"
            >
              <pep-pharos-heading class="" preset="legend" :level="3">
                <pep-pharos-checkbox
                  :checked="checkAllFeaturesInCategory(label)"
                  :indeterminate="checkSomeFeaturesInCategory(label)"
                  class="mb-2"
                  @click="selectAllInCategory(label)"
                >
                  <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                  <span slot="label" class="text-weight-bold">
                    {{ label }}
                  </span>
                </pep-pharos-checkbox>
              </pep-pharos-heading>
              <pep-pharos-checkbox-group v-if="Object.keys(category).length">
                <ul class="checkbox-group">
                  <li v-for="(feature, name) of category" :key="`feature_${name}`">
                    <pep-pharos-checkbox
                      :checked="newUser.ungrouped_features![name!]?.enabled"
                      :value="name"
                      @change="
                        newUser.ungrouped_features![name].enabled =
                          !newUser.ungrouped_features![name!]?.enabled || false
                      "
                    >
                      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                      <span slot="label">
                        <span class="display-flex align-items-center">
                          <span>{{ feature.display_name }}</span>
                          <pep-pharos-icon
                            :data-tooltip-id="`feature-manager-tooltip-${name}`"
                            name="question-inverse"
                            class="mt-0 pl-2 fill-gray-40 small-icon"
                            :aria-describedby="`feature-manager-tooltip-${name}`"
                          />
                          <pep-pharos-tooltip
                            :id="`feature-manager-tooltip-${name}`"
                            placement="top"
                          >
                            <span class="text-none">{{ feature.description }}</span>
                          </pep-pharos-tooltip>
                        </span>
                      </span>
                    </pep-pharos-checkbox>
                  </li>
                </ul>
              </pep-pharos-checkbox-group>
            </li>
          </ul>
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
