<script lang="ts" setup>
import { DatePickerRangeDirection, type DatePickerPresetRange } from '@/interfaces/DatePicker'
import { computed, ref, watch, type PropType } from 'vue'

const props = defineProps({
  initialDates: {
    type: Array as PropType<Date[]>,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  rangeDirection: {
    type: String as PropType<DatePickerRangeDirection>,
    default: DatePickerRangeDirection.Future,
  },
  triggerId: {
    type: String,
    default: 'datepicker__activation-button',
  },
  timeZone: {
    type: String,
    default: 'America/New_York',
  },
  required: {
    type: Boolean,
    default: false,
  },
  minDate: {
    type: Date as PropType<Date>,
    default: undefined,
  },
  maxDate: {
    type: Date as PropType<Date>,
    default: undefined,
  },
})

const emit = defineEmits(['selected-dates'])

const presetDateSlot = 'preset-date'

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

const presetRanges = computed<DatePickerPresetRange[]>(() => {
  const today = new Date()
  const rangeLabel = props.rangeDirection === DatePickerRangeDirection.Future ? 'Next' : 'Last'
  const getRangeValue = (days: number) =>
    props.rangeDirection === DatePickerRangeDirection.Future
      ? [today, addDays(today, days)]
      : [addDays(today, -days), today]
  const allRange =
    props.rangeDirection === DatePickerRangeDirection.Future
      ? [new Date(), new Date(Date.parse('01 Jan 2100 00:00:00 GMT'))]
      : [new Date(Date.parse('01 Jan 2022 00:00:00 GMT')), new Date()]

  return [
    { label: 'Today', value: [new Date(), new Date()], slot: presetDateSlot },
    { label: `${rangeLabel} 30 Days`, value: getRangeValue(30), slot: presetDateSlot },
    { label: `${rangeLabel} 60 Days`, value: getRangeValue(60), slot: presetDateSlot },
    { label: `${rangeLabel} 90 Days`, value: getRangeValue(90), slot: presetDateSlot },
    { label: 'All', value: allRange, slot: presetDateSlot },
  ]
})

const dateOptions = computed<Intl.DateTimeFormatOptions>(() => ({
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  ...(props.timeZone ? { timeZone: props.timeZone } : {}),
}))

const selectedDates = ref<Date[]>(props.initialDates.length ? props.initialDates : [])

watch(
  () => props.initialDates,
  (initialDates) => {
    selectedDates.value = initialDates.length ? initialDates : []
  },
)

const normalizeDates = (dates: Array<Date>) => {
  const firstDate = new Date(dates[0]!)
  const secondDate = new Date(dates[1] || dates[0]!)
  const [startDate, endDate] =
    firstDate <= secondDate ? [firstDate, secondDate] : [secondDate, firstDate]
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)
  return [startDate, endDate]
}

const handleDateSelection = (dates: Array<Date>) => {
  selectedDates.value = normalizeDates(dates)
  emit('selected-dates', selectedDates.value)
}

const displayDates = computed(() => {
  if (selectedDates.value.length === 0) {
    return 'Select dates'
  }
  const formattedDates = [
    selectedDates.value[0]?.toLocaleString('en', dateOptions.value),
    selectedDates.value[1]?.toLocaleString('en', dateOptions.value),
  ]
  if (formattedDates[0] === formattedDates[1]) {
    return String(formattedDates[0])
  }
  return `${formattedDates[0]} - ${formattedDates[1]}`
})
</script>

<template>
  <VueDatePicker
    class="datepicker"
    :model-value="selectedDates"
    :enable-time-picker="false"
    :time-config="{ enableTimePicker: false }"
    range
    :required="required"
    :min-date="minDate"
    :max-date="maxDate"
    :text-input="true"
    :preset-dates="presetRanges"
    @update:model-value="handleDateSelection"
  >
    <template #trigger>
      <pep-pharos-heading preset="legend" :level="2">
        {{ label }}<template v-if="required">&nbsp;</template>
        <span v-if="required" class="datepicker__required-indicator"
          >*<span class="datepicker__required-indicator-text">required</span></span
        >
      </pep-pharos-heading>
      <pep-pharos-button :id="triggerId" variant="secondary" full-width icon-left="calendar">
        {{ displayDates }}
      </pep-pharos-button>
    </template>
    <template #preset-date="{ label: presetLabel, value, presetDate }">
      <pep-pharos-button
        class="datepicker__preset-range"
        variant="subtle"
        full-width
        alignment="start"
        @click.prevent="presetDate(value)"
      >
        {{ presetLabel }}
      </pep-pharos-button>
    </template>
    <template #action-row="{ selectDate, disabled, closePicker }">
      <div class="datepicker__action-row">
        <pep-pharos-button variant="secondary" class="mr-2" @click="closePicker">
          Cancel
        </pep-pharos-button>
        <pep-pharos-button :disabled="disabled" @click="selectDate"> Select </pep-pharos-button>
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
  &__preset-range {
    --pharos-font-family-sans-serif: var(--pharos-font-family-serif);
    --pharos-font-weight-bold: 500;
    --pharos-font-weight-regular: 500;

    display: block;
    min-width: max-content;
    white-space: nowrap;
  }
}
</style>
