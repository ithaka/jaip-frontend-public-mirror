<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { useAnalyticsStore } from '@/stores/analytics'
import { TimePeriodLabels, type TimePeriod, type AnalyticsData } from '@/interfaces/Analytics'
import StudentItemViews from '@/components/analytics/StudentItemViews.vue'
import DataBox from '@/components/analytics/DataBox.vue'

/**
 * Store references. selectedGroupId is stored in user store to avoid duplicating group data.
 */
const userStore = useUserStore()
const { groups, selectedGroupId } = storeToRefs(userStore)

const analyticsStore = useAnalyticsStore()
const { selectedTimePeriod } = storeToRefs(analyticsStore)

const coreStore = useCoreStore()
const isLoading = ref(false)

/**
 * Updates selected time period when user changes dropdown selection.
 */
const handleTimePeriodChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  analyticsStore.setSelectedTimePeriod(target.value as TimePeriod)
}

/**
 * Updates selected group and fetches analytics data if not cached.
 * Note: Group IDs stored as numbers in user store, strings in analytics store.
 */
const handleGroupChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const groupId = target.value
  userStore.setSelectedGroupId(Number(groupId))

  // Fetch only if not already cached
  const cachedData = analyticsStore.getAnalyticsDataByGroupId(groupId)
  if (!cachedData) {
    isLoading.value = true
    fetchAnalyticsData().then(() => {
      isLoading.value = false
    })
  }
}

/**
 * Fetches analytics data from API for selected group.
 */
const fetchAnalyticsData = async () => {
  try {
    const response = await coreStore.$api.analytics.get(selectedGroupId.value.toString())
    coreStore.$api.log({
      eventtype: 'pep_analytics_data_fetched',
      event_description:
        'Reentry metadata has been successfully fetched for group ' +
        selectedGroupId.value.toString(),
    })
    console.log('Fetched analytics data:', response.data)
    analyticsStore.setAnalyticsData(response.data as unknown as AnalyticsData)
  } catch (err) {
    coreStore.toast('Error fetching analytics data. Please try again later.', 'error')
    coreStore.$api.log({
      eventtype: 'pep_reentry_analytics_data_error',
      event_description:
        'Error occurred while fetching analytics data for group ' +
        selectedGroupId.value.toString() +
        err,
    })
  }
}

/** Sets default group if none selected. */
onBeforeMount(() => {
  if (selectedGroupId.value === 0 && groups.value[0]) {
    userStore.setSelectedGroupId(groups.value[0].id)
  }
})

onMounted(async () => {
  coreStore.$api.log({
    eventtype: 'pep_admin_analytics_landing_view',
    event_description: 'User has landed on the admin analytics page',
  })
  isLoading.value = true
  await fetchAnalyticsData()
  isLoading.value = false
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
      <pep-pharos-heading :level="3" preset="3--bold"> Item usage </pep-pharos-heading>
      <div class="analytics__section analytics__top-grid">
        <DataBox
          name="Total item views"
          :value="
            analyticsStore.getMetricTotalForSelectedTimePeriod(
              'student_item_views',
              selectedGroupId.toString(),
            )
          "
        />
        <DataBox
          name="Total searches"
          :value="
            analyticsStore.getMetricTotalForSelectedTimePeriod(
              'student_searches',
              selectedGroupId.toString(),
            )
          "
        />
        <StudentItemViews metricType="student_item_views" :group-id="selectedGroupId.toString()" />
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

  &__top-grid {
    display: grid;
    grid-template-columns: minmax(auto, 200px) 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
      'metrics-top chart'
      'metrics-bottom chart';
    gap: var(--pharos-spacing-1-x);

    > :nth-child(1) {
      grid-area: metrics-top;
    }

    > :nth-child(2) {
      grid-area: metrics-bottom;
    }

    > :nth-child(3) {
      grid-area: chart;
    }

    /* Mobile: up to 767px */
    @media (max-width: 767px) {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      grid-template-areas:
        'metrics-top metrics-bottom'
        'chart chart';
    }

    /* Tablet: 768px to 1055px */
    @media (min-width: 768px) and (max-width: 1055px) {
      grid-template-columns: minmax(auto, 125px) 1fr;
    }
  }

  // Styles for child component chart containers (scoped here for specificity)
  &__chart-container {
    border: 2px solid var(--pharos-color-marble-gray-80);
    border-radius: var(--pharos-radius-base-standard);
    padding: var(--pharos-spacing-2-x);
    min-height: 300px;

    :deep(.cc--chart-holder) {
      width: 100% !important;
    }
  }
}
</style>
