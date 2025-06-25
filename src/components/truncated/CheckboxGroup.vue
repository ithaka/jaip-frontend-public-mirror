<script setup lang="ts">
import { ref, computed } from 'vue'
import { getBulkApprovalStatus } from '@/utils/helpers'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import BulkApprovalIcon from '@/components/adminButtons/BulkApprovalIcon.vue'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import type { Journal } from '@/interfaces/Journal'
import type { Discipline } from '@/interfaces/Discipline'

const props = defineProps({
  sourceList: {
    // This is a little awkward in ts, but it's handy to be able to pass in any type and
    // use functions as props to get the correct values from the parent component.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: Array<any>,
    default: () => [],
  },
  filterFunction: {
    type: Function,
    default: () => {},
  },
  getValue: {
    type: Function,
    default: () => {},
  },
  getLabel: {
    type: Function,
    default: () => {},
  },
  initialListLength: {
    type: Number,
    default: 5,
  },
  initialSelections: {
    type: Array<string>,
    default: () => [],
  },
})

const userStore = useUserStore()
const { groupIDs } = storeToRefs(userStore)

const truncateArray = ref(true)
const filterTerm = ref('')
const activeFilterTerm = ref('')
const filteredList = computed(() => {
  return props.sourceList.filter((item: Discipline | Journal) => {
    return props.filterFunction(item, activeFilterTerm.value.toLowerCase())
  })
})
const displayList = computed(() => {
  let length = truncateArray.value ? props.initialListLength : filteredList.value.length
  if (filteredList.value.length < props.initialListLength) {
    length = filteredList.value.length
  }
  return filteredList.value.slice(0, length)
})
const handleArraySearch = () => {
  activeFilterTerm.value = filterTerm.value
}

const emit = defineEmits(['input'])
const checkboxes = ref(props.initialSelections)
const handleSelection = async (e: InputFileEvent) => {
  let newValue = ''
  if (!e.target.checked) {
    checkboxes.value.push(e.target.value)
    newValue = e.target.value
  } else {
    checkboxes.value = checkboxes.value.filter((item: string) => item !== e.target.value)
  }
  emit('input', {
    checkboxes: checkboxes.value,
    newValue,
  })
}
const iconKey = ref(displayList.value.map(() => 0))
</script>
<template>
  <div>
    <!-- Array Filter Form -->
    <div class="pt-0 px-6 pb-3">
      <form @submit.prevent.stop="handleArraySearch">
        <pep-pharos-input-group
          :value="filterTerm"
          hide-label
          name="search-within"
          @input="filterTerm = $event.target.value"
        >
          <pep-pharos-button
            v-if="filterTerm"
            name="filter-close-button"
            icon="close"
            variant="subtle"
            label="search"
            a11y-label="search"
            @click="((filterTerm = ''), (activeFilterTerm = ''))"
          />
          <pep-pharos-button
            name="filter-search-button"
            icon="search"
            variant="subtle"
            label="search"
            a11y-label="search"
            type="submit"
          />
        </pep-pharos-input-group>
      </form>
    </div>

    <div class="pt-0 px-6 pb-3">
      <div v-if="displayList.length">
        <pep-pharos-checkbox-group
          :value="checkboxes"
          @input="handleSelection"
        >
          <ul>
            <li
              v-for="(item, i) in displayList"
              :key="`item_${i}`"
            >
              <pep-pharos-checkbox
                :checked="initialSelections.includes(getValue(item))"
                :value="getValue(item)"
              >
                <!-- eslint-disable-next-line vue/no-deprecated-slot-attribute -->
                <div
                  slot="label"
                  class="display-flex"
                >
                  <BulkApprovalIcon
                    v-if="item.bulk_approval && getBulkApprovalStatus(item.bulk_approval, groupIDs)"
                    :key="iconKey[i]"
                    :tooltip-id="`approval_${item.code || item.headid}`"
                    :text="`Articles in ${getLabel(item)} are generally approved automatically.`"
                    :disc="item"
                    @render="iconKey[i]++"
                  />
                  <span>{{ getLabel(item) }}</span>
                </div>
              </pep-pharos-checkbox>
            </li>
          </ul>
        </pep-pharos-checkbox-group>
        <!-- List Truncation Toggle -->
        <pep-pharos-button
          v-if="filteredList.length > props.initialListLength"
          variant="subtle"
          @click="truncateArray = !truncateArray"
        >
          {{
            truncateArray
              ? `Show ${filteredList.length - props.initialListLength} more`
              : `Hide last ${filteredList.length - props.initialListLength}`
          }}
        </pep-pharos-button>
      </div>
      <div v-else>
        {{ `No results found for ${activeFilterTerm}` }}
      </div>
    </div>
  </div>
</template>
