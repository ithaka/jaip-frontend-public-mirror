<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { useAnalyticsStore } from '@/stores/analytics'
import { TimePeriodLabels, type TimePeriod, type AnalyticsData } from '@/interfaces/Analytics'
import DummyBarChart from '@/components/analytics/DummyBarChart.vue'

// Note: selectedGroup is stored on the user store to avoid duplicating groups data across stores
const userStore = useUserStore()
const { groups, selectedGroupId } = storeToRefs(userStore)

const analyticsStore = useAnalyticsStore()
const { selectedTimePeriod } = storeToRefs(analyticsStore)

const analyticsData = ref<AnalyticsData>({} as AnalyticsData)

const coreStore = useCoreStore()

const handleTimePeriodChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  analyticsStore.setSelectedTimePeriod(target.value as TimePeriod)
}

const handleGroupChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  userStore.setSelectedGroupId(Number(target.value))
}

// TODO: Add error message when user doesn't have access to selected groups
// and disable chart display for other error cases
const showChart = computed(() => {
  return selectedGroupId.value !== null && selectedGroupId.value !== 0
})

const fetchAnalyticsData = async () => {
  try {
    const response = await coreStore.$api.analytics.get(selectedGroupId.value.toString())
    coreStore.$api.log({
      eventtype: 'pep_analytics_data_fetched',
      event_description:
        'Reentry metadata has been successfully fetched for group ' +
        selectedGroupId.value.toString(),
    })

    console.log('Analytics API Response:', response)
    analyticsData.value = response.data as unknown as AnalyticsData
  } catch (err) {
    coreStore.toast('Error fetching analytics data. Please try again later.', 'error')
    // TODO: Improve error handling/logging
    console.error('Error fetching analytics data:', err)
    coreStore.$api.log({
      eventtype: 'pep_reentry_analytics_data_error',
      event_description:
        'Error occurred while fetching analytics data for group ' +
        selectedGroupId.value.toString(),
    })
  }
}

onBeforeMount(() => {
  // Set default selected group if none is selected
  if (selectedGroupId.value === 0 && groups.value[0]) {
    userStore.setSelectedGroupId(groups.value[0].id)
  }
})

onMounted(async () => {
  coreStore.$api.log({
    eventtype: 'pep_admin_analytics_landing_view',
    event_description: 'User has landed on the admin analytics page',
  })
  // TODO: Uncomment once loading state is confirmed with design
  // coreStore.isSpinning = true
  await fetchAnalyticsData()
  // coreStore.isSpinning = false
  console.log('Selected Group ID:', selectedGroupId.value)
  console.log('Selected Time Period:', selectedTimePeriod.value)
  console.log('Analytics Data:', analyticsData.value)
})
</script>

<template>
  <main class="analytics">
    <div class="analytics__content">
      <div class="analytics__header">
        <pep-pharos-heading :level="2" preset="5--bold" class="reentry__title">
          Welcome to your Analytics Dashboard
        </pep-pharos-heading>
        <p>
          View a concise overview of content usage in your group(s). For more details, visit our
          <pep-pharos-link>support page</pep-pharos-link>.
        </p>
      </div>
      <div class="analytics__selectors">
        <pep-pharos-select
          a11y-label="Select your group(s)"
          :value="selectedGroupId || undefined"
          @change="handleGroupChange"
        >
          <span slot="label">Your Group(s)</span>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </pep-pharos-select>
        <pep-pharos-select
          a11y-label="Select date range"
          :value="selectedTimePeriod"
          @change="handleTimePeriodChange"
        >
          <span slot="label">Date Range</span>
          <option v-for="(label, key) in TimePeriodLabels" :key="key" :value="key">
            {{ label }}
          </option>
        </pep-pharos-select>
      </div>
      <hr class="analytics__divider" />
      <pep-pharos-heading level="1" preset="2">
        Selected Group: {{ selectedGroupId || 'No Group Selected' }}
      </pep-pharos-heading>
      <pep-pharos-heading level="1" preset="2">
        Selected Time Period: {{ selectedTimePeriod || 'Nothing yet' }}
      </pep-pharos-heading>
      <div class="analytics__chart-container">
        <DummyBarChart v-if="showChart" />
      </div>
    </div>
  </main>
</template>
<style lang="scss" scoped>
.analytics {
  display: grid;
  grid-template-areas: '. main .';
  padding: 0 var(--pharos-spacing-1-x);
  grid-template-columns: 1fr 8fr 1fr;

  /* Mobile: up to 767px */
  @media (max-width: 767px) {
    grid-template-columns:
      minmax(var(--pharos-spacing-1-x), var(--pharos-spacing-one-and-a-half-x))
      1fr
      minmax(var(--pharos-spacing-1-x), var(--pharos-spacing-one-and-a-half-x));
  }

  /* Tablet: 768px to 1055px */
  @media (min-width: 768px) and (max-width: 1055px) {
    grid-template-columns:
      minmax(var(--pharos-spacing-2-x), var(--pharos-spacing-3-x))
      1fr
      minmax(var(--pharos-spacing-2-x), var(--pharos-spacing-3-x));
  }

  /* Desktop: 1056px to 1583px */
  @media (min-width: 1056px) and (max-width: 1583px) {
    grid-template-columns: minmax(7rem, 9rem) 1fr minmax(7rem, 9rem);
  }

  /* Desktop Large: 1584px and above */
  @media (min-width: 1584px) {
    grid-template-columns:
      minmax(9rem, 1fr)
      minmax(auto, 1200px)
      minmax(9rem, 1fr);
  }

  &__content {
    grid-area: main;
    max-width: 100%;
  }

  &__header {
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__selectors {
    display: grid;
    grid-template-columns: fit-content(50%) fit-content(50%);
    gap: var(--pharos-spacing-1-x);
    flex-wrap: wrap;
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__divider {
    background-color: var(--pharos-color-ui-40);
    border: none;
    height: 1px;
    width: 100%;
    margin: var(--pharos-spacing-2-x) 0;
  }
}
</style>
