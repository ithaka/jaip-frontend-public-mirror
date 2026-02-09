<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCoreStore } from '@/stores/core'
import { Collections } from '@/interfaces/Collections'
import type { CollectionMetadata } from '@/interfaces/Collections'
import ReentryCard from '@/components/cards/ReentryCard.vue'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const coreStore = useCoreStore()
const stateMetadata = ref<CollectionMetadata[]>([])
const nationalMetadata = ref<CollectionMetadata[]>([])

const splitNationalAndState = (data: CollectionMetadata[]) => {
  return data.reduce(
    (acc, item) => {
      if (item.is_national) {
        acc.national.push(item)
      } else {
        acc.state.push(item)
      }
      return acc
    },
    { national: [] as CollectionMetadata[], state: [] as CollectionMetadata[] },
  )
}

const getMetadata = async () => {
  try {
    const response = await coreStore.$api.collections.metadata(Collections.reentry)
    const { national, state } = splitNationalAndState(
      response.data as unknown as CollectionMetadata[],
    )
    nationalMetadata.value = national
    stateMetadata.value = state
  } catch {
    coreStore.toast('Error fetching reentry content. Please try again later.', 'error')
  }
}

onMounted(async () => {
  coreStore.isSpinning = true
  await getMetadata()
  coreStore.isSpinning = false
})

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main class="reentry">
    <div class="reentry__content">
      <div class="reentry__header">
        <pep-pharos-heading :level="2" preset="5--bold" class="reentry__title">
          Browse Reentry Guides
        </pep-pharos-heading>
        <p>
          Explore select national and state resources to help with release and transition back into
          the community.
        </p>
      </div>
      <hr class="reentry__divider" />
      <div class="reentry__section reentry__section--national" data-cy="reentry-national-section">
        <pep-pharos-heading :level="3" preset="2" data-cy="reentry-national-heading"
          >National ({{ nationalMetadata.length }})</pep-pharos-heading
        >
        <div class="reentry__grid" data-cy="reentry-national-grid">
          <ReentryCard
            v-for="(item, index) in nationalMetadata"
            :id="`national-card-${index}`"
            :key="index"
            :title="item.title"
            :description="item.description"
            :thumbnail="item.thumbnail"
            :location="item.location"
            :jurisdiction="item.jurisdiction"
            :date="item.date"
            :language="item.language"
            :filename="item.filename"
            :isNational="item.is_national"
          />
        </div>
      </div>
      <hr class="reentry__divider" />
      <div class="reentry__section reentry__section--state" data-cy="reentry-state-section">
        <pep-pharos-heading :level="3" preset="2" data-cy="reentry-state-heading"
          >State ({{ stateMetadata.length }})</pep-pharos-heading
        >
        <pep-pharos-alert
          key="reentry-notification"
          status="info"
          class="reentry__notification"
          data-cy="reentry-notification"
        >
          <span
            >State guides can still be helpful to people who aren’t currently housed in that
            state.</span
          >
        </pep-pharos-alert>
        <div class="reentry__grid" data-cy="reentry-state-grid">
          <ReentryCard
            v-for="(item, index) in stateMetadata"
            :id="`state-card-${index}`"
            :key="index"
            :title="item.title"
            :description="item.description"
            :thumbnail="item.thumbnail"
            :location="item.location"
            :jurisdiction="item.jurisdiction"
            :date="item.date"
            :language="item.language"
            :filename="item.filename"
            :isNational="item.is_national"
          />
        </div>
      </div>
    </div>
  </main>
</template>
<style scoped lang="scss">
.reentry {
  display: grid;
  grid-template-areas: '. main .';
  padding: 0 var(--pharos-spacing-1-x);
  grid-template-columns: 1fr 8fr 1fr;

  @media (max-width: 767px) {
    grid-template-columns:
      minmax(var(--pharos-spacing-1-x), var(--pharos-spacing-one-and-a-half-x))
      1fr
      minmax(var(--pharos-spacing-1-x), var(--pharos-spacing-one-and-a-half-x));
  }

  @media (min-width: 768px) and (max-width: 1055px) {
    grid-template-columns:
      minmax(var(--pharos-spacing-one-and-a-half-x), var(--pharos-spacing-4-x))
      1fr
      minmax(var(--pharos-spacing-one-and-a-half-x), var(--pharos-spacing-4-x));
  }

  @media (min-width: 1360px) and (max-width: 1583px) {
    grid-template-columns: minmax(8rem, 9rem) 1fr minmax(8rem, 9rem);
  }

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
    margin-bottom: var(--pharos-spacing-1-x);
  }

  &__title {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }

  &__section {
    margin-bottom: var(--pharos-spacing-2-x);
  }

  &__notification {
    margin-top: var(--pharos-spacing-1-x);
    margin-bottom: var(--pharos-spacing-1-x);
  }

  &__divider {
    background-color: var(--pharos-color-ui-40);
    border: none;
    height: 1px;
    width: 100%;
    margin: var(--pharos-spacing-2-x) 0;
  }

  &__grid {
    display: grid;
    margin-top: var(--pharos-spacing-1-x);
    gap: var(--pharos-spacing-1-x);
    grid-template-columns: 1fr;

    @media (min-width: 376px) {
      grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
      gap: var(--pharos-spacing-1-x) var(--pharos-spacing-2-x);
    }

    @media (min-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: var(--pharos-spacing-one-and-a-half-x) var(--pharos-spacing-3-x);
    }

    @media (min-width: 1584px) {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--pharos-spacing-2-x) var(--pharos-spacing-3-x);
    }
  }
}
</style>
