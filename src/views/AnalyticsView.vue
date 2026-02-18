<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCoreStore } from '@/stores/core'
import { useUserStore } from '@/stores/user'
import { useAnalyticsStore } from '@/stores/analytics'
import { TimePeriodLabels, type TimePeriod, type AnalyticsData } from '@/interfaces/Analytics'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'
import StudentItemViews from '@/components/analytics/StudentItemViews.vue'
import DataBox from '@/components/analytics/DataBox.vue'
import ViewsByDiscipline from '@/components/analytics/ViewsByDiscipline.vue'
import DayTimeHeatmap from '@/components/analytics/DayTimeHeatmap.vue'
import DataBar from '@/components/analytics/DataBar.vue'
import { formatDisplayDateTime, setAsyncTimeout } from '@/utils/helpers'
import DashboardUnavailable from '@/components/analytics/DashboardUnavailable.vue'

/**
 * Store references. selectedGroupId is stored in user store to avoid duplicating group data.
 */
const userStore = useUserStore()
const { groups, selectedGroupId } = storeToRefs(userStore)

const groupsWithAnalytics = computed(() => {
  return userStore.groupsWithFeature(groups.value, 'view_analytics')
})

const analyticsStore = useAnalyticsStore()
const { selectedTimePeriod, lastExported, isError } = storeToRefs(analyticsStore)

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

  // Fetch only if not already retreieved
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
    // TODO: remove before production
    console.log('🍏 Fetched analytics data:', response.data)
    analyticsStore.setAnalyticsData(response.data as unknown as AnalyticsData)
  } catch {
    analyticsStore.setError(true)
  }
}

const lastUpdatedMsg = computed(() => {
  if (!lastExported.value) return ''
  return `Last updated: ${formatDisplayDateTime(lastExported.value)}`
})

/**
 * Handles reload button click from DashboardUnavailable component.
 */
const handleReload = async () => {
  isLoading.value = true
  await fetchAnalyticsData()
  isLoading.value = false
}

/** Sets default group if none selected. */
onBeforeMount(() => {
  if (selectedGroupId.value === 0 && groupsWithAnalytics.value.length) {
    userStore.setSelectedGroupId(groupsWithAnalytics.value[0]!.id)
  }
})

/** Reset error state when group changes */
watch(selectedGroupId, () => {
  analyticsStore.resetError()
})

onMounted(async () => {
  isLoading.value = true
  setAsyncTimeout(3000) // Loading delay to show shimmer effect and prevent flicker on fast loads
  await fetchAnalyticsData()
  isLoading.value = false
})

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main class="analytics">
    <div class="analytics__content">
      <div class="analytics__header">
        <pep-pharos-heading :level="2" preset="5--bold" class="reentry__title">
          Welcome to your Analytics Dashboard
        </pep-pharos-heading>
        <pep-pharos-heading :level="3" preset="3"> </pep-pharos-heading>
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
          <span v-if="lastUpdatedMsg" slot="message" class="analytics__last-updated-message">
            {{ lastUpdatedMsg }}
          </span>
          <option v-for="group in groupsWithAnalytics" :key="group.id" :value="group.id">
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
      <div
        v-if="isError"
        class="analytics__section"
        :class="{ 'analytics__section--loading': isLoading }"
      >
        <DashboardUnavailable @reload="handleReload" />
      </div>
      <div v-else>
        <pep-pharos-heading :level="3" preset="3--bold"> Item usage </pep-pharos-heading>
        <div
          class="analytics__section analytics__top-grid"
          :class="{ 'analytics__section--loading': isLoading }"
        >
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
          <StudentItemViews
            metricType="student_item_views"
            :group-id="selectedGroupId.toString()"
          />
        </div>
        <div
          class="analytics__section analytics__bottom-grid"
          :class="{ 'analytics__section--loading': isLoading }"
        >
          <ViewsByDiscipline metricType="discipline_views" :group-id="selectedGroupId.toString()" />
          <DayTimeHeatmap
            metricType="time_of_day_item_views"
            :group-id="selectedGroupId.toString()"
          />
        </div>
        <pep-pharos-heading :level="3" preset="3--bold"> Media review </pep-pharos-heading>
        <div class="analytics__section" :class="{ 'analytics__section--loading': isLoading }">
          <DataBar metricType="media_review_events" :group-id="selectedGroupId.toString()" />
        </div>
      </div>
    </div>
  </main>
</template>
<style lang="scss" scoped>
.analytics {
  display: grid;
  grid-template-areas: '. main .';
  grid-template-columns: 1fr 8fr 1fr;
  padding: 0 var(--pharos-spacing-1-x);

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
  }

  &__header {
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__selectors {
    display: grid;
    grid-template-columns: repeat(2, fit-content(50%));
    gap: var(--pharos-spacing-1-x);
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__section {
    margin-bottom: var(--pharos-spacing-1-x);
  }

  &__section--loading {
    > * {
      position: relative;
      border-radius: 0.25rem;
      overflow: hidden;
      border: none;
    }

    > *::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        110deg,
        rgba(209, 207, 199, 1) 0%,
        rgba(209, 207, 199, 0.39) 57%,
        rgba(209, 207, 199, 0.84) 100%
      );
      background-size: 200% 100%;
      animation: analytics-shimmer 1.6s ease-in-out infinite;
      pointer-events: none;
    }

    > * > * {
      visibility: hidden;
    }

    @media (prefers-reduced-motion: reduce) {
      > *::after {
        animation: none;
        background: #e5e5e3;
      }
    }
  }

  @keyframes analytics-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
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

    @media (max-width: 767px) {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      grid-template-areas:
        'metrics-top metrics-bottom'
        'chart chart';
    }

    @media (min-width: 768px) and (max-width: 1055px) {
      grid-template-columns: minmax(auto, 125px) 1fr;
    }
  }

  &__bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--pharos-spacing-1-x);
    min-height: 400px;
    margin-bottom: var(--pharos-spacing-3-x);

    @media (max-width: 767px) {
      grid-template-columns: 1fr;
    }
  }

  &__chart-container {
    padding: var(--pharos-spacing-2-x) var(--pharos-spacing-2-x) var(--pharos-spacing-3-x);
    border: 2px solid var(--pharos-color-marble-gray-80);
    border-radius: 0.25rem;
    min-height: 300px;

    :deep(.cc--chart-holder) {
      width: 100% !important;
    }
  }
}

.analytics__last-updated-message {
  color: var(--pharos-color-marble-gray-40);
}
</style>
