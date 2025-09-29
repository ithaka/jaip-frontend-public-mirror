<script lang="ts" setup>
import { computed, ref } from 'vue'

const props = defineProps<{
  initialDates: Date[]
}>()

const presetRanges = ref([
  { label: 'Today', value: [new Date(), new Date()] },
  {
    label: 'Next 30 Days',
    value: [new Date(), new Date().setDate(new Date().getDate() + 30)],
  },
  {
    label: 'Next 60 Days',
    value: [new Date(), new Date().setDate(new Date().getDate() + 60)],
  },
  {
    label: 'Next 90 Days',
    value: [new Date(), new Date().setDate(new Date().getDate() + 90)],
  },
  {
    label: 'All',
    value: [new Date(), Date.parse('01 Jan 2100 00:00:00 GMT')],
  },
])

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

const selectedDates = ref(
  (props.initialDates && props.initialDates.length ? props.initialDates : []) as Date[],
)
const handleDateSelection = (dates: Array<Date>) => {
  selectedDates.value[0] = new Date(dates[0]!.setHours(0, 0, 0, 0))
  // In case we have a single date selected, set the end date to be the same as the start date.
  selectedDates.value[1] = new Date((dates[1] || dates[0])!.setHours(23, 59, 59, 999))
  emit('selected:dates', selectedDates.value)
}

// We want to display the selected dates in a friendly format.
const displayDates = computed(() => {
  if (selectedDates.value.length === 0) {
    return 'Select dates'
  }
  const displayDates = [
    selectedDates.value[0]?.toLocaleString('en', dateOptions),
    selectedDates.value[1]?.toLocaleString('en', dateOptions),
  ]
  if (displayDates[0] === displayDates[1]) {
    return String(displayDates[0])
  }
  return `${displayDates[0]} - ${displayDates[1]}`
})

const emit = defineEmits<{
  (e: 'selected:dates', dates: Array<Date>): void
}>()
</script>
<template>
  <VueDatePicker
    class="datepicker"
    :v-model="props.initialDates"
    :enable-time-picker="false"
    range
    required
    :min-date="new Date()"
    :text-input="true"
    :preset-dates="presetRanges"
    @update:model-value="handleDateSelection"
  >
    <template #trigger>
      <pep-pharos-heading preset="legend" :level="2">
        Schedule&nbsp;
        <span class="datepicker__required-indicator"
          >*<span class="datepicker__required-indicator-text">required</span></span
        >
      </pep-pharos-heading>
      <pep-pharos-button
        id="datepicker__activation-button"
        variant="secondary"
        full-width
        icon-left="calendar"
      >
        {{ displayDates }}
      </pep-pharos-button>
    </template>
    <template #action-row="{ internalModelValue, selectDate, disabled, closePicker }">
      <div class="datepicker__action-row">
        <div class="">
          <pep-pharos-button variant="secondary" class="mr-2" @click="closePicker">
            Cancel
          </pep-pharos-button>
          <pep-pharos-button
            :disabled="disabled || (internalModelValue || []).length < 1"
            @click="selectDate"
          >
            Select
          </pep-pharos-button>
        </div>
      </div>
    </template>
  </VueDatePicker>
</template>

<style lang="scss" scoped>
.datepicker {
  &__required-indicator {
    color: var(--pharos-color-living-coral-53);
    &-text {
      border: 0;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      margin: -1px;
      overflow: hidden;
      padding: 0;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }
  }
  &__action-row {
    margin-left: auto;
  }
}
</style>
