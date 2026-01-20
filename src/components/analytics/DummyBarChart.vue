<script setup lang="ts">
import { ref, computed } from 'vue'
import { CcvSimpleBarChart } from '@carbon/charts-vue'

const data = ref([
  { group: 'Anthropology', value: 12 },
  { group: 'Art History', value: 8 },
  { group: 'Biology', value: 45 },
  { group: 'Chemistry', value: 23 },
  { group: 'Computer Science', value: 156 },
  { group: 'Economics', value: 34 },
  { group: 'English Literature', value: 15 },
  { group: 'Philosophy', value: 7 },
  { group: 'Physics', value: 67 },
  { group: 'Psychology', value: 89 },
  { group: 'Sociology', value: 19 },
  { group: 'History', value: 28 },
  { group: 'Mathematics', value: 52 },
  { group: 'Political Science', value: 31 },
  { group: 'Geography', value: 14 },
  { group: 'Linguistics', value: 6 },
  { group: 'Music', value: 11 },
  { group: 'Theater Arts', value: 4 },
  { group: 'Film Studies', value: 9 },
  { group: 'Architecture', value: 22 },
  { group: 'Astronomy', value: 13 },
  { group: 'Biochemistry', value: 18 },
  { group: 'Botany', value: 5 },
  { group: 'Zoology', value: 17 },
  { group: 'Geology', value: 16 },
  { group: 'Environmental Science', value: 43 },
  { group: 'International Relations', value: 26 },
  { group: 'Law', value: 78 },
  { group: 'Medicine', value: 234 },
  { group: 'Nursing', value: 87 },
  { group: 'Education', value: 65 },
  { group: 'Social Work', value: 29 },
  { group: 'Business Administration', value: 123 },
  { group: 'Marketing', value: 41 },
  { group: 'Finance', value: 76 },
  { group: 'Engineering', value: 198 },
  { group: 'Mechanical Engineering', value: 54 },
  { group: 'Civil Engineering', value: 48 },
  { group: 'Electrical Engineering', value: 71 },
  { group: 'Chemical Engineering', value: 33 },
  { group: 'Journalism', value: 19 },
  { group: 'Communications', value: 37 },
  { group: 'Public Relations', value: 24 },
  { group: 'Advertising', value: 18 },
  { group: 'Graphic Design', value: 32 },
  { group: 'Fine Arts', value: 14 },
  { group: 'Sculpture', value: 3 },
  { group: 'Painting', value: 8 },
  { group: 'Photography', value: 16 },
  { group: 'Dance', value: 7 },
  { group: 'Creative Writing', value: 11 },
  { group: 'Comparative Literature', value: 5 },
  { group: 'French Literature', value: 2 },
  { group: 'Spanish Literature', value: 4 },
  { group: 'German Studies', value: 3 },
  { group: 'Asian Studies', value: 9 },
  { group: 'African Studies', value: 6 },
  { group: 'Middle Eastern Studies', value: 4 },
  { group: 'Religious Studies', value: 13 },
  { group: 'Ethics', value: 8 },
  { group: 'Logic', value: 5 },
  { group: 'Metaphysics', value: 2 },
  { group: 'Epistemology', value: 1 },
  { group: 'Statistics', value: 39 },
  { group: 'Data Science', value: 127 },
  { group: 'Information Technology', value: 94 },
  { group: 'Cybersecurity', value: 82 },
  { group: 'Artificial Intelligence', value: 156 },
  { group: 'Machine Learning', value: 143 },
  { group: 'Neuroscience', value: 67 },
  { group: 'Cognitive Science', value: 21 },
  { group: 'Public Health', value: 45 },
  { group: 'Epidemiology', value: 28 },
  { group: 'Pharmacology', value: 35 },
])

const shortData = ref(data.value.slice(0, 10))
const useShortData = ref(true)
const chartData = computed(() => (useShortData.value ? shortData.value : data.value))
const buttonLabel = computed(() => (useShortData.value ? 'Show More' : 'Show Less'))

const options = ref({
  title: 'Disciplines Summary',
  axes: {
    left: {
      mapsTo: 'group',
      scaleType: 'labels',
    },
    bottom: {
      mapsTo: 'value',
      title: 'Number of Articles',
    },
  },
  height: '400px',
  toolbar: {
    enabled: false,
  },
  legend: {
    enabled: false,
  },
  color: {
    scale: {
      Anthropology: '#1192e8',
      'Art History': '#005d5d',
      Biology: '#009d9a',
      Chemistry: '#007d79',
      'Computer Science': '#0f62fe',
    },
  },
})
</script>

<template>
  <div class="analytics__chart-container">
    <div v-if="!data || data.length === 0" class="chart-error">No data available for chart</div>
    <div v-else>
      <CcvSimpleBarChart :data="chartData" :options="options" />
      <pep-pharos-button variant="secondary" @click="useShortData = !useShortData">{{
        buttonLabel
      }}</pep-pharos-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.analytics__chart-container {
  margin: var(--pharos-spacing-2-x) 0;
  min-height: 400px;

  // Ensure chart is responsive
  :deep(.cc--chart-holder) {
    width: 100% !important;
  }

  .chart-error {
    padding: var(--pharos-spacing-2-x);
    background: #f0f0f0;
    border: 1px dashed #ccc;
    text-align: center;
    color: #666;
  }
}
</style>
