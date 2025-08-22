<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import type { PropType } from 'vue'
import { storeToRefs } from 'pinia'
import type { Group } from '@/interfaces/Group'
import { ref, computed } from 'vue'
import type { Entity } from '@/interfaces/Entities'
import type { EntityActions } from '@/interfaces/AccountManagement'
import { useFeaturesStore } from '@/stores/features'
import EntityManager from '@/components/account/EntityManager.vue'
import EntityRemover from '@/components/account/EntityRemover.vue'
import type InputFileEvent from '@/interfaces/Events/InputEvent'

const props = defineProps({
  entity: {
    type: Object as PropType<Entity>,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
})

const userStore = useUserStore()
const { featureDetails, groupThreshold } = storeToRefs(userStore)

const featuresStore = useFeaturesStore()

const emit = defineEmits(['update'])
const groupObject = ref(
  (props.entity.groups || []).reduce(
    (obj, group) => {
      obj[group.id] = group
      return obj
    },
    {} as { [key: number]: Group },
  ),
)

const initGroups = props.entity.groups || []
const sortedGroups = initGroups.sort((a: Group, b: Group) => a.name.localeCompare(b.name))

const selectedGroupId = ref(sortedGroups.length ? (sortedGroups[0] || {}).id || -1 : -1)
const selectedGroup = computed(() => {
  return groupObject.value[selectedGroupId.value]
})

const categorizedFeatures = computed(() =>
  featuresStore.categorizedFeatures(selectedGroup.value, props.entity.type, false),
)

const hasEdit = computed(() => {
  return props.entity.type === 'users'
    ? featureDetails.value['add_or_edit_users']?.enabled
    : featureDetails.value['edit_facilities']?.enabled ||
        featureDetails.value['manage_facilities']?.enabled ||
        false
})
const hasRemove = computed(() => {
  return props.entity.type === 'users'
    ? featureDetails.value['remove_users']?.enabled
    : featureDetails.value['manage_facilities']?.enabled || false
})
const showEntityModal = ref(false)
const entityModalUpdateKey = ref(0)
const openEntityModal = () => {
  entityModalUpdateKey.value++
  showEntityModal.value = true
}
const showRemoveModal = ref(false)
const removeModalUpdateKey = ref(0)
const openRemoveModal = () => {
  removeModalUpdateKey.value++
  showRemoveModal.value = true
}
const editAction = 'edit' as EntityActions

const handleGroupSelection = (e: InputFileEvent) => {
  selectedGroupId.value = parseInt(e.target.value, 10)
}
</script>

<template>
  <div>
    <pep-pharos-heading class="mb-2 pb-0" preset="5" :level="3">
      <span class="button-row">
        <span>{{ entity.name }}</span>
        <span class="button-row-buttons">
          <pep-pharos-button
            v-if="hasRemove"
            icon-left="close-inverse"
            variant="secondary"
            full-width
            @click.prevent.stop="openRemoveModal"
          >
            Remove
          </pep-pharos-button>
          <pep-pharos-button
            v-if="hasEdit"
            icon-left="edit"
            class="ml-3"
            full-width
            @click.prevent.stop="openEntityModal"
          >
            Edit
          </pep-pharos-button>
        </span>
      </span>
    </pep-pharos-heading>
    <pep-pharos-heading class="mb-2 pb-0" preset="legend" :level="3">
      {{ entity.contact }}
    </pep-pharos-heading>

    <div class="mt-4">
      <div v-if="(entity.groups || []).length === 1">
        <pep-pharos-heading class="mb-2 pb-0" preset="3" :level="3">
          {{ entity.groups![0]!.name || 'Unknown Group' }}
        </pep-pharos-heading>
      </div>
      <div
        v-else-if="
          (entity.groups || []).length > 1 && (entity.groups || []).length < groupThreshold
        "
      >
        <pep-pharos-button
          variant="overlay"
          :data-dropdown-menu-id="`group_selector_${entity.id}`"
          full-width
          class="mb-3"
          icon-left="chevron-down"
        >
          {{ selectedGroup?.name || 'Unknown Group' }}
        </pep-pharos-button>
        <pep-pharos-dropdown-menu :id="`group_selector_${entity.id}`" full-width>
          <pep-pharos-dropdown-menu-item
            v-for="(group, id) in sortedGroups"
            :key="`${entity.id}_${id}`"
            @click="selectedGroupId = group.id"
          >
            {{ group.name }}
          </pep-pharos-dropdown-menu-item>
        </pep-pharos-dropdown-menu>
      </div>
      <div v-else-if="(entity.groups || []).length >= groupThreshold" class="mb-5">
        <pep-pharos-select
          class="group-selector-dropdown"
          :value="selectedGroupId"
          @change="handleGroupSelection"
        >
          <div slot="label">
            <div class="display-flex align-items-center">
              <span>Features for</span>
            </div>
          </div>
          <option v-for="(group, id) in sortedGroups" :key="`${entity.id}_${id}`" :value="group.id">
            {{ group.name }}
          </option>
        </pep-pharos-select>
      </div>
    </div>
    <ul>
      <div class="entity-features">
        <li v-for="(category, label, index) in categorizedFeatures" :key="`category_${index}`">
          <pep-pharos-heading class="" preset="legend" :level="3">
            {{ label }}
          </pep-pharos-heading>
          <ul v-if="category.length">
            <li v-for="feature in category" :key="`feature_${feature.name}`">
              <span class="entity-card__icon-wrapper">
                <span>{{ feature.display_name }}</span>
                <pep-pharos-icon
                  class="entity-card__tooltip-icon"
                  name="question-inverse"
                  a11y-title="Hover over to see feature description"
                  a11y-hidden="false"
                  :aria-describedby="`feature-tooltip-${feature.name}`"
                  :data-tooltip-id="`feature-tooltip-${feature.name}`"
                >
                </pep-pharos-icon>
                <pep-pharos-tooltip :id="`feature-tooltip-${feature.name}`" placement="top">
                  {{ feature.description }}
                </pep-pharos-tooltip>
              </span>
            </li>
          </ul>
          <div v-else>
            <span>No features enabled</span>
          </div>
        </li>
      </div>
    </ul>
    <EntityManager
      :key="entityModalUpdateKey"
      :entity="entity"
      :entity-type="entityType"
      :show-modal="showEntityModal"
      :action="editAction"
      @close="showEntityModal = false"
      @update="emit('update')"
    />
    <EntityRemover
      :key="removeModalUpdateKey"
      :entity="entity"
      :entity-type="entityType"
      :show-modal="showRemoveModal"
      @close="showRemoveModal = false"
      @update="emit('update')"
    />
  </div>
</template>

<style scoped lang="scss">
.entity-card {
  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  &__tooltip-icon {
    padding-left: var(--pharos-spacing-one-quarter-x);
    width: var(--pharos-line-height-xsmall);
    cursor: pointer;
    fill: var(--pharos-color-marble-gray-40);
  }
}
</style>
