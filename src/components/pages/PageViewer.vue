<template>
  <div :class="['page-viewer-container', { 'full-screen': isInFullscreen }]">
    <div class="viewer-details-container">
      <div
        id="iiif-viewer-wrapper"
        ref="iiifViewerWrapper"
        tabindex="0"
        :data-qa="`iiif-viewer-${contentId}`"
        class="viewer-wrapper"
        role="application"
        aria-label="interactive image viewer."
        aria-description="Use the arrow keys to move the image, press 0 to center the image, and the plus and minus keys to zoom in and out."
      >
        <div class="image-viewport">
          <div class="controls">
            <div class="viewer-show-for-medium-up">
              <div class="viewer-controls--right">
                <div class="viewer-show-for-large-down">
                  <ControlBar>
                    <ViewerControlButton
                      v-if="!openFailed"
                      icon-name="zoom-in"
                      keyboard-shortcut="+"
                      tooltip-text="Zoom in"
                      @clicked="zoomIn()"
                    />
                    <ViewerControlButton
                      v-if="!openFailed"
                      icon-name="zoom-out"
                      keyboard-shortcut="-"
                      tooltip-text="Zoom out"
                      @clicked="zoomOut()"
                    />
                    <ViewerControlButton
                      v-if="!openFailed"
                      :icon-name="fitIcon"
                      :tooltip-text="fitIconTooltip"
                      keyboard-shortcut="0"
                      @clicked="fitView()"
                    />
                    <ViewerControlButton
                      v-if="hasMultipleViewers"
                      icon-name="close"
                      tooltip-text="Close this item"
                      @clicked="closeThisViewer()"
                    />
                  </ControlBar>
                </div>
                <div class="viewer-show-for-large-up">
                  <ControlBar>
                    <ViewerControlButton
                      v-if="!openFailed"
                      icon-name="zoom-in"
                      keyboard-shortcut="+"
                      tooltip-text="Zoom in"
                      @clicked="zoomIn()"
                    />
                    <ViewerControlButton
                      v-if="!openFailed"
                      icon-name="zoom-out"
                      keyboard-shortcut="-"
                      tooltip-text="Zoom out"
                      @clicked="zoomOut()"
                    />
                    <ViewerControlButton
                      v-if="!openFailed"
                      :icon-name="fitIcon"
                      :tooltip-text="fitIconTooltip"
                      keyboard-shortcut="0"
                      @clicked="fitView()"
                    />
                    <ViewerControlButton
                      v-if="hasMultipleViewers"
                      icon-name="close"
                      tooltip-text="Close this item"
                      @clicked="closeThisViewer()"
                    />
                  </ControlBar>
                </div>

                <ControlBar v-if="showFullscreenToggle" class="viewer-control-button">
                  <ViewerControlButton
                    :text="fullscreenToggleButtonText"
                    :tooltip-text="fullscreenToggleTooltipText"
                    :icon-name="fullscreenToggleIconName"
                    keyboard-shortcut="esc"
                    :hide-shortcut-text="!isInFullscreen"
                    @clicked="toggleFullscreen"
                  />
                </ControlBar>
              </div>
            </div>

            <div class="viewer-show-for-medium-down">
              <div class="viewer-controls--left">
                <ControlBar button-direction="vertical">
                  <ViewerControlButton
                    v-if="!openFailed"
                    icon-name="zoom-in"
                    keyboard-shortcut="+"
                    tooltip-text="Zoom in"
                    @clicked="zoomIn()"
                  />
                  <ViewerControlButton
                    v-if="!openFailed"
                    icon-name="zoom-out"
                    keyboard-shortcut="-"
                    tooltip-text="Zoom out"
                    @clicked="zoomOut()"
                  />
                  <ViewerControlButton
                    v-if="!openFailed"
                    :icon-name="fitIcon"
                    :tooltip-text="fitIconTooltip"
                    keyboard-shortcut="0"
                    @clicked="fitView()"
                  />
                </ControlBar>
              </div>
            </div>

            <div v-show="hasMultiplePages">
              <PaginationButton
                v-if="!isPageLeftDisabled"
                ref="pageLeft"
                class="page-left"
                direction="left"
                tooltip-text="Page left"
                keyboard-shortcut="["
                tooltip-position="top-start"
                @page="handlePageLeft"
              />
              <PaginationButton
                v-if="!isPageRightDisabled"
                ref="pageRight"
                class="page-right"
                direction="right"
                tooltip-text="Page right"
                keyboard-shortcut="]"
                tooltip-position="top-end"
                @page="handlePageRight"
              />
            </div>
          </div>

          <pep-pharos-loading-spinner v-if="!metadata" class="loading-spinner-wrapper" />
          <div
            :id="viewerId"
            ref="iiifViewer"
            :class="['iiif-viewer', { 'full-screen': isInFullscreen }]"
            oncontextmenu="return false;"
          />

          <div v-show="metadata && (openFailed || !hasTileSources)" class="viewer-error">
            <div>{{ errorText }}</div>
            <div v-show="!isUnauthorized && hasTileSources" ref="downloadMountPoint" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- @ts-expect-error This is borrowing from the platform code, and isn't typed -->
<script lang="js">
import ControlBar from '@/components/pages/ControlBar.vue'
import PaginationButton from '@/components/pages/PaginationButton.vue'
import ViewerControlButton from '@/components/pages/ViewerControlButton.vue'

import {
  ZOOM_PER_CLICK,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
  PLUS_EQUAL,
  ZOOM_KEYS,
  PAN_KEYS,
  HOME_KEYS,
  CHANGE_PAGE_KEYS,
  LEFT_BRACKET_KEY,
} from '@/consts/PageViewerConsts.ts'

import { v4 as uuidv4 } from 'uuid'
import OpenSeadragon from 'openseadragon'
import { useCoreStore } from '@/stores/core'

const VIEWPORT_MARGIN = 10

export default {
  name: 'OpenSeadragonViewer',
  components: {
    ControlBar,
    PaginationButton,
    ViewerControlButton,
  },
  inject: ['contextData'],
  props: {
    metadata: {
      type: Object,
      required: true,
    },
    initialPageIndex: {
      type: Number,
      default: 0,
    },
    showFullscreenToggle: {
      type: Boolean,
      default: true,
    },
    showNavigatorInFullscreen: {
      type: Boolean,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: true,
    },
    isInFullscreen: {
      type: Boolean,
      default: false,
    },
    hasMultipleViewers: {
      type: Boolean,
      default: false,
    },
    presentationSession: {
      type: String,
      default: null,
    },
    viewerClosedCallback: {
      type: Function,
      default: undefined,
    },
    fullscreenToggledCallback: {
      type: Function,
      default: undefined,
    },
    primaryPageChangedCallback: {
      type: Function,
      default: undefined,
    },
  },
  data() {
    return {
      fitHeight: false,
      viewer: null,
      viewerId: null,
      openFailed: false,
      currentPageIndex: this.initialPageIndex,
      pageNumberUpdateCallback: undefined,
      isFirstLoad: true,
      enableSavedZoomImage: false,
      interval: null,
    }
  },
  computed: {
    isLoggedIn() {
      return this.contextData?.user?.is_logged_in
    },
    contentId() {
      return this.metadata?.id
    },
    fitIcon() {
      return this.fitHeight ? 'fit-to-width' : 'fit-to-view'
    },
    fitIconTooltip() {
      return this.fitHeight ? 'Fit to width' : 'Fit to height'
    },
    isNonIiifContent() {
      return this.metadata.isPDFOnly || this.metadata.isFullText || this.metadata.externalLink
    },
    isContributedItem() {
      return this.metadata.itemType === 'ccda_text'
    },
    isContributedImage() {
      return this.metadata.contentType === 'contributed_images'
    },
    isUnauthorized() {
      return this.metadata?.status === 403
    },
    isPageLeftDisabled() {
      return this.isRightToLeft ? this.isLastPage : this.isFirstPage
    },
    isPageRightDisabled() {
      return this.isRightToLeft ? this.isFirstPage : this.isLastPage
    },
    isFirstPage() {
      return this.currentPageIndex === 0
    },
    isLastPage() {
      return !this.hasTileSources || this.currentPageIndex === this.tileSources.length - 1
    },
    hasMultiplePages() {
      return this.metadata?.pageCount > 1 || false
    },
    isRightToLeft() {
      return this.metadata?.isRightToLeftLanguage
    },
    fullscreenToggleIconName() {
      return this.isInFullscreen ? 'fullscreen-minimize' : 'fullscreen'
    },
    fullscreenToggleTooltipText() {
      return this.isInFullscreen ? 'Exit full screen' : 'Enter full screen'
    },
    fullscreenToggleButtonText() {
      return this.isInFullscreen ? 'Exit' : 'Full screen'
    },
    errorText() {
      if (this.isUnauthorized) {
        return 'You do not have permission to view this content.'
      }
      return "We're having trouble loading this content."
    },
    iiifLinks() {
      return this.metadata?.iiif_links || []
    },
    hasTileSources() {
      return this.tileSources?.length > 0
    },
    tileSources() {
      if (this.metadata) {
        return [...Array(this.metadata.pageCount).keys()].map((value) => ({
          type: 'image',
          url: `/api/v2/page/${this.metadata.id}/${value}`,
        }))
      } else {
        return []
      }
    },
    openSeadragonOptions() {
      const openSeadragonOptions = {
        controlsFadeDelay: 3000,
        id: this.viewerId,
        initialPage: this.initialPageIndex,
        navigatorPosition: 'BOTTOM_LEFT',
        navigatorMaintainSizeRatio: true,
        preserveImageSizeOnResize: true, // Helps keep consistent zoom level when exiting full screen
        preserveViewport: true,
        sequenceMode: true,
        showNavigationControl: false,
        showNavigator: true,
        showSequenceControl: false,
        tileSources: this.tileSources,
        maxZoomLevel: 2,
        viewportMargins: {
          top: VIEWPORT_MARGIN,
          right: VIEWPORT_MARGIN,
          bottom: VIEWPORT_MARGIN,
          left: VIEWPORT_MARGIN,
        },
        visibilityRatio: 1,
        zoomPerClick: ZOOM_PER_CLICK,
      }

      return openSeadragonOptions
    },
    scrollToZoom() {
      return this.isContributedImage
    },
    displayNavigator() {
      return this.showNavigatorInFullscreen && this.isContributedImage
    },
    isHomeFitToHeight() {
      return (
        this.viewer.viewport.getBounds().height.toFixed(5) ===
        this.viewer.world.getItemAt(0).getBounds().height.toFixed(5)
      )
    },
  },
  watch: {
    async metadata() {
      if (this.metadata) {
        this.currentPageIndex = this.initialPageIndex
        await this.setupViewer()
      }
    },
    initialPageIndex() {
      this.goToPage(this.initialPageIndex)
    },
    isInFullscreen() {
      this.updateDisplayNavigator()
    },
  },
  created() {
    this.viewerId = uuidv4()
  },
  async mounted() {
    if (this.metadata) {
      await this.setupViewer()
    }

    this.$refs.iiifViewerWrapper.addEventListener('keyup', (event) => {
      const keyCode = event.code

      if (ZOOM_KEYS.includes(keyCode)) {
        this.handleZoomKeyPress(keyCode)
      } else if (PAN_KEYS.includes(keyCode)) {
        this.handlePanKeyPress(keyCode)
      } else if (HOME_KEYS.includes(keyCode)) {
        this.fitView()
        event.originalEvent.preventDefault()
      } else if (CHANGE_PAGE_KEYS.includes(keyCode)) {
        this.handleChangePageKeyPress(keyCode)
      }
    })

    if (this.isInFullscreen) {
      this.$refs.iiifViewerWrapper.focus()
    }
    const coreStore = useCoreStore()

    this.interval = setInterval(
      () =>
        coreStore.$api.log({
          eventtype: 'pep_page_view',
          event_description: 'user is viewing a page',
          itemid: this.metadata?.id,
          page_index: this.currentPageIndex,
        }),
      1000 * 60,
    )
  },
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  methods: {
    async setupViewer() {
      this.openFailed = false

      if (this.viewer) {
        this.viewer.close()
        this.viewer.open(this.tileSources)
      } else {
        this.viewer = new OpenSeadragon(this.openSeadragonOptions)
        window.openSeadragonViewer = this.viewer
        this.updateDisplayNavigator()
        this.initializeHandlers()
      }
    },
    goToPage(index) {
      this.viewer.goToPage(index)
      if (typeof this.pageNumberUpdateCallback === 'function') {
        this.pageNumberUpdateCallback(index)
      }
    },
    goToPreviousPage() {
      const currentPage = this.viewer.currentPage()
      this.goToPage(currentPage - 1)
    },
    goToNextPage() {
      const currentPage = this.viewer.currentPage()
      this.goToPage(currentPage + 1)
    },
    handlePageLeft() {
      if (this.isRightToLeft) {
        this.goToNextPage()
      } else {
        this.goToPreviousPage()
      }
    },
    handlePageRight() {
      if (this.isRightToLeft) {
        this.goToPreviousPage()
      } else {
        this.goToNextPage()
      }
    },
    closeThisViewer() {
      if (
        typeof this.viewerClosedCallback === 'function' &&
        this.viewerClosedCallback(this.contentId)
      ) {
        return true
      } else {
        return false
      }
    },
    setZoomParam() {
      if (this.enableSavedZoomImage) {
        this.setImageZoomDetails()
      }
    },
    setImageZoomDetails() {
      const bounds = this.viewer.viewport.viewportToImageRectangle(
        this.viewer.viewport.getBounds(true),
      )
      // Make sure the bounds are adjusted for the negative x and y values
      bounds['width'] = bounds['x'] < 0 ? bounds['width'] + bounds['x'] : bounds['width']
      bounds['height'] = bounds['y'] < 0 ? bounds['height'] + bounds['y'] : bounds['height']

      const searchParams = new URLSearchParams(window.location.search)
      if (
        searchParams.get('x') !== bounds['x'].toString() ||
        searchParams.get('y') !== bounds['y'].toString() ||
        searchParams.get('w') !== bounds['width'].toString() ||
        searchParams.get('h') !== bounds['height'].toString()
      ) {
        searchParams.set('x', bounds['x'])
        searchParams.set('y', bounds['y'])
        searchParams.set('w', bounds['width'])
        searchParams.set('h', bounds['height'])
        searchParams.set('index', this.currentPageIndex)
        const tabHash = window.location.hash
        const url = `${window.location.pathname}?${searchParams}${tabHash}`
        window.history.replaceState({}, document.title, url)
      }
    },
    changeZoom(zoomFactor) {
      this.viewer.viewport.zoomBy(zoomFactor)
      this.viewer.viewport.applyConstraints() //So we don't zoom too far in/out with our custom buttons
    },
    zoomIn() {
      this.changeZoom(ZOOM_IN_FACTOR)
    },
    zoomOut() {
      this.changeZoom(ZOOM_OUT_FACTOR)
    },
    fitView() {
      const viewport = this.viewer.viewport
      if (this.fitHeight) {
        viewport.fitHorizontally(true)
      } else {
        viewport.fitVertically(true)
      }
      viewport.panTo(new OpenSeadragon.Point(0.5, 0))
      viewport.applyConstraints(true)
      this.fitHeight = !this.fitHeight
    },
    toggleFullscreen() {
      setTimeout(() => {
        this.$refs.iiifViewerWrapper.focus()
      })
      if (
        typeof this.fullscreenToggledCallback === 'function' &&
        this.fullscreenToggledCallback()
      ) {
        return true
      } else {
        return false
      }
    },
    handleZoomKeyPress(keyCode) {
      // we are handling the zoom here because neither zoomPerScroll nor zoomPerClick seem to affect
      // the +/- keys
      const zoomFactor = keyCode === PLUS_EQUAL ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR
      this.changeZoom(zoomFactor)
    },
    handlePanKeyPress(code) {
      const canvas = this.$refs.iiifViewer.querySelector('.openseadragon-canvas')
      canvas.dispatchEvent(new KeyboardEvent('keydown', { keyCode: code }))
    },
    handleChangePageKeyPress(keyCode) {
      if (keyCode === LEFT_BRACKET_KEY) {
        this.handlePageLeft()
      } else {
        this.handlePageRight()
      }
    },
    initializeHandlers() {
      this.viewer?.addHandler('open', () => {
        this.fitHeight = this.isHomeFitToHeight
      })

      this.viewer?.addHandler('page', (event) => {
        this.currentPageIndex = event.page
        if (this.isPrimary && this.primaryPageChangedCallback === 'function') {
          this.primaryPageChangedCallback(this.currentPageIndex)
        }
        setTimeout(
          () =>
            this.isPageRightDisabled &&
            !this.isPageLeftDisabled &&
            this.$refs.pageLeft.applyFocus(),
        )
        setTimeout(
          () =>
            this.isPageLeftDisabled &&
            !this.isPageRightDisabled &&
            this.$refs.pageRight.applyFocus(),
        )
      })

      this.viewer.addHandler('open-failed', () => {
        this.openFailed = true
        this.viewer.destroy()
        this.viewer = null
      })

      this.viewer.addOnceHandler('tile-loaded', () => {
        this.viewer?.viewport.fitVertically(true)
        if (this.isContributedImage && this.enableSavedZoomImage) {
          this.refreshZoomedView()
        }

        this.viewer.addHandler('canvas-click', (event) => {
          if (event.quick) {
            this.setZoomParam()
          }
        })

        this.viewer.addHandler('canvas-scroll', (event) => {
          if (!this.isInFullscreen && !this.scrollToZoom) {
            event.preventDefaultAction = true
            window.scrollBy(event.originalEvent.deltaX, event.originalEvent.deltaY)
          } else {
            this.setZoomParam()
          }
        })

        this.viewer?.addHandler('pan', () => {
          if (this.isFirstLoad) {
            this.isFirstLoad = false
            return
          }
          this.setZoomParam()
        })

        this.viewer?.addHandler('zoom', () => {
          this.setZoomParam()
        })
      })
    },
    updateDisplayNavigator() {
      if (this.displayNavigator) {
        this.viewer.navigator.element.style.display = 'inline-block'
      } else {
        this.viewer.navigator.element.style.display = 'none'
      }
    },
    async refreshZoomedView() {
      const params = new URLSearchParams(document.location.search)
      const zoomParamX = parseInt(params.get('x'))
      if (!isNaN(zoomParamX)) {
        const zoomParamY = parseInt(params.get('y'))
        const width = parseInt(params.get('w'))
        const height = parseInt(params.get('h'))
        const bounds = this.viewer.viewport.imageToViewportRectangle(
          zoomParamX,
          zoomParamY,
          width,
          height,
        )
        await this.viewer.viewport.fitBounds(bounds, true)
        this.zoomIn()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
$image-details-height: var(--pharos-spacing-5-x);
$image-control-tray-no-detail-height: 72px;
$image-control-tray-with-detail-height: 120px;
$image-control-tray-with-detail-height-mobile: 132px;
$button-offset: var(--pharos-spacing-one-and-a-half-x);

.page-viewer-container {
  height: 100vh;
  min-height: 500px;
  width: 100%;
  margin-bottom: 100px;
  &.full-screen {
    height: 100%;
    min-height: 100%;
    min-width: 100vw;
    width: 100vw;
  }
}

.viewer-details-container {
  height: 100%;
  background: var(--pharos-color-black);
  position: relative;
  display: flex;
  overflow: hidden;
}

.viewer-wrapper {
  display: flex;
  position: relative;
  background: var(--pharos-color-black);
  transition: all 0.3s ease;
  width: 100%;
  height: 100%;
}

.image-details {
  height: $image-details-height;
}

.image-viewport {
  position: relative;
  width: 100%;
}

.iiif-viewer {
  height: 100%;

  &.full-screen {
    height: 100%;
  }

  &.show-image-details {
    height: calc(100% - $image-details-height);
  }
  @media screen and (max-width: 48rem) {
    &.show-image-details {
      height: calc(100% - $image-control-tray-with-detail-height-mobile);
    }
  }
}

.viewer-error {
  position: absolute;
  display: flex;
  top: 45%;
  height: 100%;
  width: 100%;
  flex-direction: column;
  gap: var(--pharos-spacing-1-x);
  text-align: center;
  color: var(--pharos-color-white);
}

.controls {
  z-index: 100;
  position: absolute !important;
  pointer-events: none;
  height: 100%;
  width: 100%;

  button {
    pointer-events: all;
  }

  .viewer-controls--left {
    position: absolute !important;
    left: $button-offset;
    top: $button-offset;
  }

  .viewer-controls--right {
    display: flex;
    position: absolute !important;
    right: $button-offset;
    top: $button-offset;

    .viewer-control-button {
      margin-left: var(--pharos-spacing-one-half-x);
    }
  }
}

@mixin pagination-button {
  position: absolute !important;
  top: 50%;
  pointer-events: all;
  cursor: pointer;

  &:disabled {
    cursor: unset;
    opacity: 0.2;
  }
}

.page-left {
  @include pagination-button;
  left: $button-offset;
}

.page-right {
  @include pagination-button;
  right: $button-offset;
}

.viewer-show-for-medium-down {
  display: inline-block !important;
  @media screen and (min-width: 48rem) {
    display: none !important;
  }
}

.viewer-show-for-medium-up {
  display: none !important;
  @media screen and (min-width: 48rem) {
    display: inline-block !important;
  }
}

.viewer-show-for-large-down {
  display: none !important;
  @media screen and (min-width: 48rem) and (max-width: calc(1056px - 1px)) {
    display: flex !important;
  }
}

.viewer-show-for-large-up {
  display: none !important;
  @media screen and (min-width: 66rem) {
    display: flex !important;
  }
}

.viewer-controls-thumbnail {
  position: absolute !important;
  left: $button-offset;
  top: $button-offset;
  @media screen and (min-width: 22.5rem) and (max-width: calc(1056px - 1px)) {
    display: none;
  }
}
</style>
