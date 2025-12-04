<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCoreStore } from '@/stores/core'
import { computed, ref } from 'vue'
import type { Collections, CollectionMetadata } from '@/interfaces/Collections'
import PDFViewer from '@/components/Viewer/PDFViewer.vue'
import PrintButton from '@/components/PrintButton.vue'
import DownloadButton from '@/components/DownloadButton.vue'
import { useUserStore } from '@/stores/user'
import { useMetadataStore } from '@/stores/metadata'
import { storeToRefs } from 'pinia'

const route = useRoute()
const coreStore = useCoreStore()
const metadataStore = useMetadataStore()
const { metadata, metadataByFilename } = storeToRefs(metadataStore)
const userStore = useUserStore()
const { featureDetails } = storeToRefs(userStore)

const filename = (route.params || {}).filename as string
const collection = (route.params || {}).collection as Collections

const gettingDocument = ref(false)
const collectionMetadata = ref(undefined as CollectionMetadata | undefined)
const error = ref({
  message: '',
  status: false,
  code: 0,
})

const updateKey = ref(0)
const getDocument = async () => {
  try {
    gettingDocument.value = true
    if (!metadataByFilename.value[collection]) {
      await metadataStore.getMetadata(collection)
    }
    collectionMetadata.value = metadataByFilename.value[collection][filename]
    if (!collectionMetadata.value) {
      error.value.status = true
      error.value.message = 'Not Found'
      error.value.code = 404
    }
  } catch (err: unknown) {
    const errorResponse = err as { response: { status: number } }
    error.value.status = true
    error.value.code = errorResponse.response.status || 500
    error.value.message = 'Server Error'
    if (error.value.code === 403) {
      error.value.message = 'Unauthorized'
    } else if (error.value.code === 404) {
      error.value.message = 'Not Found'
    }
  } finally {
    updateKey.value++
    gettingDocument.value = false
  }
}
getDocument()

const hasStructuredClone = ref(typeof window.structuredClone === 'function')

coreStore.$api.log({
  eventtype: 'pep_landing_collections_item_view',
  event_description: `User has landed on the collections item view: ${collection}/${filename}`,
  collection: collection,
  filename: filename,
})

const hasPrint = computed(() => {
  return featureDetails.value['print_pdf']?.enabled
})
const hasDownload = computed(() => {
  return featureDetails.value['download_pdf']?.enabled
})
const hasPrintAndDownload = computed(() => {
  return hasPrint.value && hasDownload.value
})
</script>

<template>
  <pep-pharos-layout row-gap="0">
    <Teleport to="body">
      <pep-pharos-loading-spinner v-if="gettingDocument" class="position-fixed" />
    </Teleport>
    <div v-if="collectionMetadata" class="document-metadata">
      <div class="document-metadata__back">
        <pep-pharos-icon
          class="document-metadata__back-icon"
          name="arrow-left"
          a11y-title="Browse all guides"
          a11y-hidden="false"
          role="button"
          tabindex="0"
          :aria-describedby="`Browse all guides`"
          :data-tooltip-id="`Browse all guides`"
        >
        </pep-pharos-icon>
        <pep-pharos-link
          subtle
          :href="`/collections/${collection}`"
          class="document-metadata__back-link"
          data-cy="custom-content-back-link"
        >
          Browse all guides
        </pep-pharos-link>
      </div>
      <div class="document-metadata document-metadata__content">
        <pep-pharos-heading
          :level="2"
          preset="legend"
          class="document-metadata__jurisdiction"
          data-cy="custom-content-jurisdiction"
        >
          <span v-if="collectionMetadata.is_national">NATIONAL</span>
          <span v-else>{{ collectionMetadata.location }}</span>
          <span
            v-if="
              (collectionMetadata.location || collectionMetadata.is_national) &&
              collectionMetadata.date
            "
            class="document-metadata__bullet"
          >
            &bull;
          </span>
          <span v-if="collectionMetadata.date">{{ collectionMetadata.date }}</span>
        </pep-pharos-heading>
        <pep-pharos-heading
          v-if="collectionMetadata.title"
          :level="1"
          preset="3"
          class="document-metadata__title"
          data-cy="custom-content-title"
        >
          {{ collectionMetadata.title }}
        </pep-pharos-heading>
        <p
          v-if="collectionMetadata.description"
          class="document-metadata__description"
          data-cy="custom-content-description"
        >
          {{ collectionMetadata.description }}
        </p>
        <p class="document-metadata__creation" data-cy="custom-content-creation">
          <span v-if="collectionMetadata.creator">
            Created by {{ collectionMetadata.creator }}
          </span>
          <span
            v-if="collectionMetadata.creator && collectionMetadata.publisher"
            class="document-metadata__bullet"
          >
            &bull;
          </span>
          <span v-if="collectionMetadata.publisher"
            >Published by {{ collectionMetadata.publisher }}</span
          >
        </p>
      </div>
      <div
        :class="[
          'document-metadata__actions',
          { 'document-metadata__actions--inline': !hasPrintAndDownload },
        ]"
      >
        <div
          v-for="(version, index) in collectionMetadata.alternate_versions"
          :key="`alternate_content_version_${index}`"
          class="document-metadata__alternate-version"
          :data-cy="`alternate_content_version_${index}`"
        >
          <pep-pharos-link
            :href="`/collections/${collection}/${version.filename}`"
            data-cy="custom-content-alternate-link"
          >
            {{ version.label || 'View PDF' }}
          </pep-pharos-link>
        </div>
        <div class="document-metadata__action-buttons">
          <PrintButton
            v-if="hasPrint"
            class="document-metadata__action-button document-metadata__action-button--print"
            :filename="collectionMetadata.filename"
            :collection="collection"
            :variant="hasDownload ? 'secondary' : 'primary'"
          />
          <DownloadButton
            v-if="hasDownload"
            class="document-metadata__action-button document-metadata__action-button--download"
            :filename="collectionMetadata.filename"
            :collection="collection"
            variant="primary"
          />
        </div>
      </div>
    </div>
    <div
      v-if="error.status && error.message"
      class="pdf-viewer-error"
      :class="[{ 'is-forbidden': error.code !== 403 }]"
      data-cy="custom-content-error"
    >
      <pep-pharos-heading class="mb-2 mb-4 pb-0" preset="5--bold" :level="1">
        {{ error.message }}
      </pep-pharos-heading>
      <p v-if="!metadata">You do not have access to this document.</p>
    </div>

    <PDFViewer
      v-if="collectionMetadata?.filename && !error.status && hasStructuredClone"
      class="pdf-viewer"
      :collection="collection"
      :filename="collectionMetadata.filename"
      :enable-viewer="true"
    />
  </pep-pharos-layout>
</template>

<style lang="scss">
.pdf-viewer,
.pdf-viewer-error {
  grid-column: span 12;
  @media screen and (max-width: 768px) {
    grid-column: span 8;
  }
  @media screen and (max-width: 360px) {
    grid-column: span 4;
  }
  & .is-forbidden {
    margin-top: var(--pharos-spacing-5-x);
  }
}

.document-metadata {
  &__back {
    &-link {
      font-size: var(--pharos-font-size-small);
      margin-left: var(--pharos-spacing-one-half-x);
    }
    display: flex;
    grid-column: span 2;
    align-items: center;
    margin-bottom: var(--pharos-spacing-one-and-a-half-x);
  }
  display: grid;
  grid-column: span 12;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 0;
  margin-bottom: var(--pharos-spacing-1-x);
  @media screen and (max-width: 1056px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media screen and (max-width: 768px) {
    grid-column: span 8;
  }
  @media screen and (max-width: 360px) {
    grid-column: span 4;
  }
  &__bullet {
    margin-left: var(--pharos-spacing-one-half-x);
    margin-right: var(--pharos-spacing-one-half-x);
  }
  &__jurisdiction {
    color: var(--pharos-color-marble-gray-20);
    grid-column: span 12;
    @media screen and (max-width: 1056px) {
      grid-column: span 4;
    }
  }
  &__title {
    grid-column: span 12;

    @media screen and (max-width: 1056px) {
      grid-column: span 4;
    }
  }
  &__description {
    grid-column: span 8;
    margin-bottom: var(--pharos-spacing-1-x);
    @media screen and (max-width: 1056px) {
      grid-column: span 4;
    }
  }
  &__creation {
    grid-column: span 12;
    font-size: var(--pharos-font-size-small);

    @media screen and (max-width: 1056px) {
      grid-column: span 4;
    }
  }
  &__actions {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    column-gap: var(--pharos-spacing-one-half-x);
    row-gap: var(--pharos-spacing-one-half-x);
    align-items: center;
    grid-column: 9 / span 4;
    justify-self: end;
    @media screen and (max-width: 1056px) {
      grid-column: span 4;
      justify-self: end;
    }
    @media screen and (max-width: 768px) {
      grid-auto-flow: row;
      grid-template-columns: repeat(auto-fit, minmax(0, max-content));
      grid-auto-columns: auto;
      grid-column: span 4;
      justify-self: start;
      &--inline {
        grid-auto-flow: column;
        grid-auto-columns: max-content;
        grid-template-columns: repeat(auto-fit, minmax(0, max-content));
        justify-content: flex-start;
      }
    }
  }
  &__action-buttons {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    column-gap: var(--pharos-spacing-one-half-x);
    row-gap: var(--pharos-spacing-one-half-x);
    align-items: center;
    grid-column: auto;
    @media screen and (max-width: 768px) {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: row-reverse;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: var(--pharos-spacing-one-half-x);
      .document-metadata__actions--inline & {
        grid-column: auto;
      }
      .document-metadata__action-button {
        flex: 0 0 auto;
        width: fit-content;
      }
    }
  }
  &__action-button {
    width: fit-content;
    min-width: max-content;
  }
  &__alternate-version {
    @media screen and (max-width: 768px) {
      margin-bottom: var(--pharos-spacing-one-half-x);
      grid-column: 1 / -1;
      .document-metadata__actions--inline & {
        margin-bottom: 0;
        grid-column: auto;
      }
    }
  }
  &__content {
    margin-top: var(--pharos-spacing-1-x);
    &:last-child {
      margin-bottom: var(--pharos-spacing-1-x);
    }
  }
}
</style>
