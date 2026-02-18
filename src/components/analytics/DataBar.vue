<script setup lang="ts">
import { computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import type { AnalyticsMetricType, MediaReviewDataPoint } from '@/interfaces/Analytics'
import { formatDisplayNumbers } from '@/utils/helpers'

const props = defineProps<{
  metricType: AnalyticsMetricType
  groupId: string
}>()

const analyticsStore = useAnalyticsStore()

/**
 * Fetches metric data for the selected time period and metric type.
 * @returns {Object|null} Analytics metric data with series or null if unavailable
 */
const data = computed(() => {
  const metricData = analyticsStore.getMetricDataForSelectedTimePeriod(
    props.metricType,
    props.groupId,
  )
  if (metricData) {
    return metricData
  } else {
    console.warn('No metric data found for', props.metricType, 'groupId:', props.groupId)
    return null
  }
})

/**
 * Extracts the count of approved media reviews from series data.
 * @returns {number} Number of approved reviews or 0 if unavailable
 */
const approvedValue = computed(() => {
  const series = data.value?.series as MediaReviewDataPoint[] | undefined
  return series?.find((item) => item.bucket === 'approved')?.n ?? 0
})

/**
 * Extracts the count of denied media reviews from series data.
 * @returns {number} Number of denied reviews or 0 if unavailable
 */
const deniedValue = computed(() => {
  // TODO: ditto as above
  const series = data.value?.series as MediaReviewDataPoint[] | undefined
  return series?.find((item) => item.bucket === 'denied')?.n ?? 0
})
</script>
<template>
  <div class="data-card data-bar" role="region" :aria-label="`Media review data bar`">
    <div class="data-bar__section">
      <p class="data-card__label">Total requests</p>
      <pep-pharos-heading :preset="5">{{
        formatDisplayNumbers(data?.total || 0)
      }}</pep-pharos-heading>
    </div>
    <div class="data-bar__section">
      <p class="data-card__label">Approved</p>
      <pep-pharos-heading :preset="5">{{ formatDisplayNumbers(approvedValue) }}</pep-pharos-heading>
    </div>
    <div class="data-bar__section">
      <p class="data-card__label">Denied</p>
      <pep-pharos-heading :preset="5">{{ formatDisplayNumbers(deniedValue) }}</pep-pharos-heading>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.data-card {
  padding: var(--pharos-spacing-2-x);
  border: 2px solid var(--pharos-color-marble-gray-80);
  border-radius: 0.25rem;
  background-color: var(--pharos-color-marble-gray-97);

  @media (min-width: 768px) and (max-width: 1055px) {
    padding: var(--pharos-spacing-1-x);
  }

  &__label {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }
}

.data-bar {
  display: grid;
  grid-template-columns: 1fr 100px 100px;
  gap: var(--pharos-spacing-1-x);

  &__section:last-child {
    border-left: 1px solid var(--pharos-color-marble-gray-50);
    padding-left: var(--pharos-spacing-2-x);
  }
}
</style>
