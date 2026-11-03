<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
  type PropType,
} from 'vue'
import OpenSeadragon from 'openseadragon'
import { useRoute, useRouter } from 'vue-router'
import ControlBar from './Controls/ControlBar.vue'
import RequestButton from '@/components/buttons/RequestButton.vue'
import { useCoreStore } from '@/stores/core'
import { routes } from '@/config/api'
import { useBaseURL } from '@/composables/urls'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import { ViewerControls, type ViewerControlOptions, type ViewerError } from '@/interfaces/Viewer'
import { useLogger } from '@/composables/logging/useLogger'
import {
  browserInFullscreen,
  exitFullscreen,
  lockBodyScroll,
  removeFullscreenChangeListeners,
  requestFullscreen,
  setupFullscreenChangeListeners,
  unlockBodyScroll,
} from '@/utils/viewers'

const props = defineProps({
  iid: {
    type: String,
    required: true,
  },
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
  viewingSessionId: {
    type: String,
    required: true,
  },
})
const emit = defineEmits<{ 'page-change': [page: number]; 'viewing-started': [] }>()
const route = useRoute()
const router = useRouter()
const coreStore = useCoreStore()
const baseURL = useBaseURL()
const wrapper = useTemplateRef<HTMLElement>('wrapper')
const surface = useTemplateRef<HTMLElement>('surface')
const pageCount = ref(0)
const currentPage = ref(1)
const isLoading = ref(true)
const isMenuOpen = ref(false)
const fitHeight = ref(false)
const rotation = ref(0)
const canFitHeight = computed(() => rotation.value % 180 === 0)
const isInFullscreen = ref(false)
const isCSSFullscreen = ref(false)
const error = ref<ViewerError>({ message: '', status: false, code: 0 })
let imageViewer: OpenSeadragon.Viewer | undefined
let unmounted = false
let startedSession = false
let openGeneration = 0
const { handleWithLog, logs } = useLogger()
const {
  viewerControlLog,
  pageSelectionLog,
  startPageViewingSessionLog,
  endPageViewingSessionLog,
  pageViewerErrorLog,
} = logs.getPageViewerLogs({ iid: props.iid, eventUUID: props.viewingSessionId })
const errorHeading = computed(() => {
  if (error.value.code === 404) return 'Item not found'
  if (error.value.code === 403) {
    return props.doc.is_restricted ? 'Item unavailable' : 'The item requires approval'
  }
  return 'Item not available'
})
const errorMessage = computed(() => {
  if (error.value.code === 404) {
    return 'This item may not exist or is no longer available on JSTOR. Try searching for another item.'
  }
  if (error.value.code === 403) {
    return props.doc.is_restricted
      ? 'Try searching for another item.'
      : 'Request this item for review and to keep searching.'
  }
  return 'Something went wrong while loading this item. Try searching for another item.'
})

const fireToast = () => {
  coreStore.toast(
    "This item was added to Your Requests. <pep-pharos-link is-on-background href='/search' variant='inline'>Return to Search</pep-pharos-link> to review it.",
    'success',
    10000,
  )
}

const showError = (failure: unknown) => {
  if (unmounted) return
  const details = failure as { message?: string; response?: { status?: number } }
  error.value = {
    message: details?.message || 'Unable to load this page.',
    code: details?.response?.status || 0,
    status: true,
  }
  isLoading.value = false
  void handleWithLog(pageViewerErrorLog({ error: { ...error.value } }))
}

const routePage = () => {
  const index = Number(route.params.pid)
  return Number.isInteger(index) && index >= 0 ? Math.min(index + 1, pageCount.value) : 1
}

const selectPage = (page: number | string) => {
  const number = Number(page)
  if (!imageViewer || !Number.isInteger(number) || number < 1 || number > pageCount.value) return
  if (number === currentPage.value && !error.value.status) return
  const previous = currentPage.value
  openGeneration++
  error.value.status = false
  isLoading.value = true
  imageViewer.goToPage(number - 1)
  void handleWithLog(pageSelectionLog({ previous_page: previous, new_page: number }))
  void router.replace({ params: { ...route.params, pid: number - 1 }, query: route.query })
}

watch(
  () => route.params.pid,
  () => {
    const page = routePage()
    if (imageViewer && page !== currentPage.value) selectPage(page)
  },
)

const fitView = () => {
  if (!imageViewer?.world.getItemCount()) return
  const bounds = imageViewer.world.getItemAt(0).getBounds()
  if (fitHeight.value) imageViewer.viewport.fitVertically(true)
  else imageViewer.viewport.fitHorizontally(true)
  imageViewer.viewport.panTo(bounds.getCenter(), true)
}

const zoom = (factor: number) => {
  imageViewer?.viewport.zoomBy(factor)
  imageViewer?.viewport.applyConstraints()
}

const rotate = (degrees: number) => {
  rotation.value = (rotation.value + degrees + 360) % 360
  imageViewer?.viewport.setRotation(rotation.value)
}

const fullscreenChanged = () => {
  if (!isCSSFullscreen.value) isInFullscreen.value = browserInFullscreen()
}

const leaveCSSFullscreen = () => {
  isCSSFullscreen.value = false
  isInFullscreen.value = false
  unlockBodyScroll()
}

const toggleFullscreen = async () => {
  if (isCSSFullscreen.value) {
    leaveCSSFullscreen()
  } else if (isInFullscreen.value) {
    if (await exitFullscreen()) isInFullscreen.value = false
  } else if (await requestFullscreen(wrapper.value)) {
    if (unmounted) {
      await exitFullscreen()
      return
    }
    isInFullscreen.value = true
  } else if (!unmounted) {
    isCSSFullscreen.value = true
    isInFullscreen.value = true
    lockBodyScroll()
  }
  await nextTick()
  if (!unmounted) wrapper.value?.focus()
}

const control = (action: ViewerControlOptions, callback: () => void) =>
  handleWithLog(viewerControlLog({ action }), callback)

const handleImageOpenFailed = async () => {
  const failedPage = currentPage.value
  const generation = ++openGeneration
  const fallback = new Error('Unable to load this page.')
  try {
    await coreStore.$api.documents.pages(props.iid, String(failedPage - 1))
    if (generation === openGeneration && failedPage === currentPage.value) showError(fallback)
  } catch (failure) {
    if (generation === openGeneration && failedPage === currentPage.value) showError(failure)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isCSSFullscreen.value) {
    leaveCSSFullscreen()
    return
  }
  if (
    event.target instanceof Element &&
    event.target.closest('input, button, select, textarea, [contenteditable], pep-pharos-input')
  )
    return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const actions: Record<string, () => void> = {
    '+': () => control(ViewerControls.zoom_in, () => zoom(1.1)),
    '=': () => control(ViewerControls.zoom_in, () => zoom(1.1)),
    '-': () => control(ViewerControls.zoom_out, () => zoom(1 / 1.1)),
    r: () => control(ViewerControls.rotate_right, () => rotate(90)),
    '[': () => selectPage(currentPage.value - 1),
    ']': () => selectPage(currentPage.value + 1),
  }
  const action = actions[event.key]
  if (action) {
    event.preventDefault()
    action()
  }
}

onMounted(async () => {
  setupFullscreenChangeListeners(fullscreenChanged)
  try {
    const response = await coreStore.$api.documents.metadata(props.iid)
    if (unmounted) return
    const count = response.data?.pageCount
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
      throw new Error('No page images are available.')
    }
    pageCount.value = count
    currentPage.value = routePage()
    emit('page-change', currentPage.value)
    imageViewer = OpenSeadragon({
      element: surface.value!,
      sequenceMode: true,
      initialPage: currentPage.value - 1,
      crossOriginPolicy: 'use-credentials',
      tileSources: Array.from({ length: count }, (_, index) => ({
        type: 'image',
        url: `${baseURL}${routes.documents.pages(props.iid, String(index))}`,
        buildPyramid: false,
      })) as OpenSeadragon.Options['tileSources'],
      showNavigationControl: false,
      showSequenceControl: false,
      showNavigator: false,
      preserveViewport: true,
      maxZoomPixelRatio: 2,
      gestureSettingsMouse: { clickToZoom: false },
    })
    imageViewer.addHandler('open', () => {
      if (unmounted) return
      openGeneration++
      isLoading.value = false
      error.value.status = false
      imageViewer?.viewport.setRotation(rotation.value)
      if (!startedSession) {
        startedSession = true
        if (props.viewingSessionId) emit('viewing-started')
        else void handleWithLog(startPageViewingSessionLog)
      }
    })
    imageViewer.addHandler('page', (event) => {
      currentPage.value = event.page + 1
      emit('page-change', currentPage.value)
    })
    imageViewer.addHandler('open-failed', handleImageOpenFailed)
  } catch (failure) {
    showError(failure)
  }
})

onBeforeUnmount(() => {
  unmounted = true
  removeFullscreenChangeListeners(fullscreenChanged)
  if (isCSSFullscreen.value) leaveCSSFullscreen()
  else if (isInFullscreen.value) void exitFullscreen()
  imageViewer?.destroy()
  imageViewer = undefined
  if (startedSession && !props.viewingSessionId) void handleWithLog(endPageViewingSessionLog)
})
</script>

<template>
  <div>
    <Teleport to="body" :disabled="!isCSSFullscreen">
      <section
        ref="wrapper"
        class="page-viewer"
        :class="{ 'page-viewer--fullscreen': isInFullscreen }"
        aria-label="Page viewer"
        :aria-busy="isLoading"
        tabindex="0"
        @keydown="handleKeydown"
      >
        <ControlBar
          v-if="pageCount"
          :is-fit-to-width="fitHeight"
          :is-in-fullscreen="isInFullscreen"
          :is-menu-open="isMenuOpen"
          :can-fit-height="canFitHeight"
          :page-count="pageCount"
          :current-page="currentPage"
          :pagination-key="currentPage"
          :show-page-navigation="pageCount > 1"
          @toggle-menu="control(ViewerControls.toggle_menu, () => (isMenuOpen = !isMenuOpen))"
          @zoom-in="control(ViewerControls.zoom_in, () => zoom(1.1))"
          @zoom-out="control(ViewerControls.zoom_out, () => zoom(1 / 1.1))"
          @rotate-right="control(ViewerControls.rotate_right, () => rotate(90))"
          @rotate-left="control(ViewerControls.rotate_left, () => rotate(-90))"
          @fit-view="
            control(ViewerControls.fit_view, () => {
              fitHeight = !fitHeight
              fitView()
            })
          "
          @update-page="selectPage"
          @toggle-fullscreen="control(ViewerControls.toggle_fullscreen, toggleFullscreen)"
        />
        <div
          v-if="error.status"
          :class="['page-viewer__error', { 'page-viewer__error--with-controls': pageCount }]"
          role="alert"
        >
          <div class="error">
            <pep-pharos-heading
              :level="2"
              preset="4--bold"
              data-cy="page-viewer-error"
              no-margin
              class="error__heading"
            >
              {{ errorHeading }}
            </pep-pharos-heading>
            <p class="error__text" data-cy="page-viewer-error-message">{{ errorMessage }}</p>
            <RequestButton
              v-if="error.code === 403 && !doc.is_restricted"
              :doc="doc"
              :hide-requests="false"
              :full-width="false"
              button-label="Request"
              cancel-button-label="Cancel"
              data-cy="request-button"
              @submit-request="fireToast"
            />
            <pep-pharos-button v-else variant="primary" href="/search" data-cy="search-button">
              Search
            </pep-pharos-button>
          </div>
        </div>
        <pep-pharos-loading-spinner v-if="isLoading" class="page-viewer__loading" />
        <div ref="surface" class="page-viewer__surface" data-cy="page-viewer-surface" />
      </section>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.page-viewer {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 80vh;
  height: 80dvh;
  min-height: 300px;
  background: var(--pharos-color-marble-gray-10);

  .control-bar {
    flex-shrink: 0;
  }
  &__surface {
    flex: 1;
    min-height: 0;
  }
  &__error {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--pharos-spacing-one-x);
    border: 1px solid var(--pharos-color-black);
    background: var(--pharos-color-white);
    color: var(--pharos-color-black);
    text-align: center;
  }
  &__error--with-controls {
    top: 44px;
  }
  .error {
    color: var(--pharos-color-black);
    &__heading {
      margin-bottom: var(--pharos-spacing-one-half-x);
    }
    &__text {
      margin-bottom: var(--pharos-spacing-one-and-a-half-x);
      max-width: 360px;
      justify-self: center;
    }
  }
  &__loading {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  &--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 10000;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    min-height: 0;
  }
}
</style>
