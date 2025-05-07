<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import type { Group } from '@/interfaces/Group'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { PropType } from 'vue'
import { arraysAreEqual } from '@/utils/helpers'

const props = defineProps({
  groups: {
    type: Array as PropType<Group[]>,
    required: true,
  },
  featureName: {
    type: String,
    required: true,
  },
  startFull: {
    type: Boolean,
    required: false,
    default: false,
  },
  multiple: {
    type: Boolean,
    required: false,
    default: false,
  },
  isStatusSearch: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const userStore = useUserStore()
const { featureDetails, groupMap, selectedGroups } = storeToRefs(userStore)

const possibleGroups = computed(() => {
  const sortedGroups = [...props.groups].sort((a: Group, b: Group) => a.name.localeCompare(b.name))
  const g = (sortedGroups || []).map((group: Group) => group.id)
  if (props.isStatusSearch) {
    return g.filter((groupId: number) => sortedGroups.some((group: Group) => group.id === groupId))
  }
  return g.filter((groupId: number) =>
    (featureDetails.value[props.featureName] || {}).groups.includes(groupId),
  )
})
const emit = defineEmits(['change'])

if (!selectedGroups.value[props.featureName]) {
  selectedGroups.value[props.featureName] = []
}

const comboboxAllValue = 'All Groups'
const comboboxValue = ref('')
if (props.startFull) {
  if (props.multiple) {
    comboboxValue.value = comboboxAllValue
  }
  if (!arraysAreEqual(selectedGroups.value[props.featureName], possibleGroups.value)) {
    selectedGroups.value[props.featureName] = possibleGroups.value
    emit('change', { groups: selectedGroups.value[props.featureName], target: 0 })
  }
}
const handleGroupSelection = (e: InputFileEvent) => {
  const val = parseInt(e.target.value, 10)
  if (
    e.target.value === comboboxAllValue &&
    selectedGroups.value[props.featureName].length !== possibleGroups.value.length
  ) {
    selectedGroups.value[props.featureName] = possibleGroups.value
  } else if (val < 0 || e.target.value === '') {
    selectedGroups.value[props.featureName] = []
  } else if (selectedGroups.value[props.featureName].includes(val)) {
    selectedGroups.value[props.featureName] = selectedGroups.value[props.featureName].filter(
      (group: number) => {
        if (e.target.getAttribute('data-pharos-component') === 'PharosButton') {
          return group !== val
        } else {
          return group === val
        }
      },
    )
  } else {
    if (props.multiple) {
      selectedGroups.value[props.featureName] = selectedGroups.value[props.featureName].concat(val)
    } else {
      selectedGroups.value[props.featureName] = [val]
    }
  }
  comboboxValue.value =
    selectedGroups.value[props.featureName].length === possibleGroups.value.length
      ? comboboxAllValue
      : ''
  emit('change', { groups: selectedGroups.value[props.featureName], target: val })
}
</script>

<template>
  <div v-if="possibleGroups.length > 1" class="cols-12 mt-3 mb-6">
    <pep-pharos-combobox
      class="group-selector-combobox"
      :value="comboboxValue"
      @change="handleGroupSelection"
    >
      <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
      <div slot="label">
        <div class="display-flex align-items-center">
          <span>Groups</span>
          <pep-pharos-button
            v-if="selectedGroups[featureName].length"
            variant="subtle"
            value=""
            @click.prevent.stop="handleGroupSelection"
          >
            <small class="text-weight-regular pointer-events-none">clear</small>
          </pep-pharos-button>
          <!-- ($event: InputFileEvent)=>{$event.target.value=''; return handleGroupSelection($event)} -->
        </div>
      </div>
      <option v-if="props.multiple" :value="comboboxAllValue">All Groups</option>
      <option v-for="(grp, index) in possibleGroups" :key="`group_option_${index}`" :value="grp">
        {{ (groupMap.get(grp) || {}).name }}
      </option>
    </pep-pharos-combobox>
    <div
      v-if="selectedGroups[featureName].length !== possibleGroups.length"
      class="display-flex text-wrap-wrap"
    >
      <pep-pharos-button
        v-for="(grp, index) in selectedGroups[featureName]"
        :key="`group_label_${index}`"
        variant="subtle"
        icon-right="close"
        :value="grp"
        @click.prevent.stop="handleGroupSelection"
      >
        {{ (groupMap.get(grp) || {}).name }}
      </pep-pharos-button>
    </div>
  </div>
</template>
