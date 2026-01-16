<script setup lang="ts">
import { computed, ref } from 'vue'
import FallbackImage from '@/assets/images/fallbackimage.png'
import { useLogger } from '@/composables/logging/useLogger'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  jurisdiction: {
    type: String,
    default: '',
  },
  isNational: {
    type: Boolean,
    default: false,
  },
  date: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'English',
  },
  filename: {
    type: String,
    default: '',
  },
})

const isProjectImageBroken = ref(false)

const handleBrokenImage = () => {
  isProjectImageBroken.value = true
}

const pillPreset = computed(() => {
  switch (props.language.toLowerCase()) {
    case 'english':
      return '7'
    default:
      return '9'
  }
})

const locationDisplay = computed(() => {
  if (props.isNational) {
    return props.language === 'English' ? 'National' : 'Nacional'
  }
  return props.location || props.jurisdiction
})

const computedThumbnail = computed(() => {
  if (isProjectImageBroken.value || !props.thumbnail) {
    return FallbackImage
  }
  return `${import.meta.env.BASE_URL}thumbnails/${props.thumbnail}`
})

const linkTo = `/collections/reentry/${props.filename}`
const { handleWithLog, logs } = useLogger()
const { cardClickLog, brokenCardImageLog } = logs.getCardLogs()
</script>

<template>
  <pep-pharos-image-card
    :link="linkTo"
    :error="isProjectImageBroken"
    class="reentry-card"
    data-cy="reentry-card"
    @click="handleWithLog(cardClickLog(linkTo))"
  >
    <img
      slot="image"
      :src="computedThumbnail"
      :alt="title"
      class="reentry-card__image"
      data-cy="reentry-card-image"
      @error="handleWithLog(brokenCardImageLog(computedThumbnail), handleBrokenImage)"
    />
    <div
      slot="metadata"
      class="reentry-card__metadata reentry-card__metadata--location"
      data-cy="reentry-card-location"
    >
      {{ locationDisplay }}
    </div>
    <div id="container${id}" slot="metadata">
      <pep-pharos-heading
        preset="1--bold"
        :level="3"
        class="reentry-card__metadata--heading"
        data-cy="reentry-card-title"
      >
        <pep-pharos-link
          :a11y-label="`link to reentry item ${title}`"
          :href="`/collections/reentry/${filename}`"
          subtle=""
          class="reentry-card__metadata reentry-card__metadata--title"
          data-cy="reentry-card-title-link"
          >{{ title }}</pep-pharos-link
        >
      </pep-pharos-heading>
    </div>

    <div slot="metadata" class="reentry-card__metadata" data-cy="reentry-card-description">
      {{ description }}
    </div>
    <div
      slot="metadata"
      class="reentry-card__metadata reentry-card__metadata--date"
      data-cy="reentry-card-date"
    >
      {{ date }}
    </div>
    <div slot="metadata" class="reentry-card__metadata reentry-card__metadata--language">
      <pep-pharos-pill
        size="small"
        :preset="pillPreset"
        class="reentry-card__pill"
        data-cy="reentry-card-language-pill"
        >{{ language }}</pep-pharos-pill
      >
    </div>
  </pep-pharos-image-card>
</template>

<style lang="scss" scoped>
.reentry-card {
  margin-top: var(--pharos-spacing-one-and-a-half-x);

  &__metadata {
    margin-top: var(--pharos-spacing-one-half-x);
    display: block;

    &--location {
      font-weight: bold;
      margin-top: var(--pharos-spacing-one-quarter-x);
    }

    &--title {
      margin-top: var(--pharos-spacing-one-quarter-x);
      text-decoration: none;
    }

    &--heading {
      white-space: normal;
      margin-top: var(--pharos-spacing-one-quarter-x);
    }

    &--date {
      color: var(--pharos-color-text-40);
      font-size: var(--pharos-font-size-small);
    }

    &--language {
      display: flex;
      align-items: center;
    }
  }

  &__pill {
    margin: 0;
  }

  &__image {
    border: 1px solid transparent;
    &:hover {
      background-color: var(--pharos-color-marble-gray-94);
    }
  }
}
</style>
