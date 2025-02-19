<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import type { PropType } from 'vue'
import type { Entity } from '@/interfaces/Entities'
import { ref } from 'vue'
import { makeGrammaticalList } from '@/utils/helpers'
import GroupSelector from '@/components/account/GroupSelector.vue'
import type { Group } from '@/interfaces/Group'

const props = defineProps({
  entity: {
    type: Object as PropType<Entity>,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  showModal: Boolean,
})

const userStore = useUserStore()
const { groupMap, selectedGroups } = storeToRefs(userStore)
const coreStore = useCoreStore()

const featureName = ref(props.entity.type === 'users' ? 'remove_users' : 'manage_facilities')
const emit = defineEmits(['close', 'update'])

if (props.entity.groups && props.entity.groups.length === 1) {
  selectedGroups.value[featureName.value] = [props.entity.groups[0].id]
}
const removeEntity = async () => {
  if (!selectedGroups.value[featureName.value].length) {
    return
  }
  const args = {
    ...props.entity,
    groups: (props.entity.groups || []).filter((group: Group) =>
      selectedGroups.value[featureName.value].includes(group.id),
    ),
  }

  try {
    await coreStore.$api.auth.entities.remove(args, props.entity.type)
    const msg = `${props.entity.name} successfully removed.`
    coreStore.toast(msg, 'success')
  } catch {
    const msg = `Oops! There was an error and ${props.entity.name} was not removed removed.`
    coreStore.toast(msg, 'error')
  }
  emit('update')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <pep-pharos-modal
      :id="`remove-entity-modal-${entity.id || 0}`"
      :key="`remove-entity-modal-${entity.id || 0}`"
      :header="`Remove ${entityType}`"
      size="large"
      :open="showModal"
      @pharos-modal-closed="emit('close')"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <p slot="description">
        <span v-if="(selectedGroups[featureName] || []).length">
          This will remove {{ entity.name }} from
          {{
            makeGrammaticalList(
              selectedGroups[featureName].map(
                (group: number) => (groupMap.get(group) || {}).name || '',
              ),
            )
          }}. Are you sure you wish to proceed?
        </span>
        <span v-else class="error">
          <span>Please select at least one group to remove {{ entity.name }} from.</span>
        </span>
      </p>
      <GroupSelector
        :groups="entity.groups || []"
        :feature-name="featureName"
        :start-full="true"
        multiple
      />
      <!-- eslint-disable-next-line -->
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <!-- eslint-disable vue/no-deprecated-slot-attribute -->
      <pep-pharos-button
        slot="footer"
        :disabled="!(selectedGroups[featureName] || []).length"
        @click.prevent.stop="removeEntity"
      >
        Remove
      </pep-pharos-button>
      <!-- eslint-enable vue/no-deprecated-slot-attribute -->
    </pep-pharos-modal>
  </Teleport>
</template>
