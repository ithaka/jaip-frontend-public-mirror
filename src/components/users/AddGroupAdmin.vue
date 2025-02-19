<script lang="ts" setup>
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '@/stores/core'
import { useFeaturesStore } from '@/stores/features'
import { useUserStore } from '@/stores/user'
import type { Entity } from '@/interfaces/Entities'
import { makeGrammaticalList } from '@/utils/helpers'

const props = defineProps({
  show: Boolean,
  user: {
    type: Object as PropType<Entity>,
    required: true,
  },
})

const coreStore = useCoreStore()

const userStore = useUserStore()
const { groupMap } = storeToRefs(userStore)

const featuresStore = useFeaturesStore()
const { featuresObject } = storeToRefs(featuresStore)

const groupsWithAllFeatures = computed(() => {
  const groups: number[] = []
  props.user.groups?.forEach((group) => {
    let hasAllFeatures = true
    for (const name in featuresObject.value) {
      if (!group.features || !group.features[name]) {
        hasAllFeatures = false
      }
    }
    if (hasAllFeatures) {
      groups.push(group.id)
    }
  })
  return groups
})
const groupNamesWithAllFeatures = computed(() => {
  const groups: string[] = []
  groupsWithAllFeatures.value.forEach((id) => {
    const group = groupMap.value.get(id)
    if (group) {
      groups.push(group.name)
    }
  })
  return groups
})
const submitForm = async () => {
  if (noEmpty.value) return (touchedInstruction.value = true)
  await coreStore.$api.auth.groups.addAdministrator({ id: props.user.id })
  emit('submit')
}

const addInstruction = ref('')
const touchedInstruction = ref(false)
const requiredText = 'add administrator'
const noEmpty = computed(() => addInstruction.value.trim().toLowerCase() !== requiredText)
const invalidInstruction = computed(() => {
  return touchedInstruction.value && noEmpty.value
})
const errorMessage = computed(() => {
  if (!touchedInstruction.value) return ''
  if (noEmpty.value) return `Type "${requiredText}" to confirm deletion`
  return ''
})
const emit = defineEmits(['close', 'submit'])
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      :id="`add-admin-modal-${props.user.id}`"
      :header="`Add Administrator`"
      :open="props.show"
      @pharos-modal-closed="emit('close')"
    >
      <!-- eslint-disable next-line vue/no-deprecated-slot-attribute -->
      <p slot="description" class="mb-3">
        <span
          >Add {{ props.user.name }} as an administrator in any where they do not already have
          administrative privileges.</span
        >
        <span v-if="groupNamesWithAllFeatures.length">
          Note that {{ props.user.name }} is already an administrator in
          {{
            groupNamesWithAllFeatures.length > 5
              ? `${groupNamesWithAllFeatures.length} groups`
              : makeGrammaticalList(groupNamesWithAllFeatures)
          }}.
        </span>
      </p>
      <form @submit.prevent.stop="submitForm">
        <input type="text" hidden />
        <pep-pharos-input-group
          :id="`add_admin_${props.user.id}`"
          :value="addInstruction"
          :placeholder="`Type 'add administrator' to confirm change`"
          :message="errorMessage"
          :invalidated="invalidInstruction"
          :name="`add_admin_${props.user.id}`"
          @keydown.enter.prevent.stop="submitForm"
          @input="((touchedInstruction = true), (addInstruction = $event.target.value))"
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
