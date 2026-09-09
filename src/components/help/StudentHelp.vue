<script setup lang="ts">
import HowToUse from '@/components/help/helpContent/HowToUse.vue'
import WhatIsJstor from '@/components/help/helpContent/WhatIsJstor.vue'
import ResearchBasics from '@/components/help/helpContent/researchBasics/ResearchBasics.vue'
import UnavailableItems from '@/components/help/helpContent/UnavailableItems.vue'
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLogger } from '@/composables/logging/useLogger'

const route = useRoute()
const { handleWithLog, logs } = useLogger()
const { helpTabViewLog } = logs.getMediaReviewHelpLogs()

const tabs = [
  {
    param: 'what-is-jstor',
    id: 'help-tab-1',
    panelId: 'help-panel-1',
    label: 'What is JSTOR?',
    component: WhatIsJstor,
  },
  {
    param: 'how-to-use-jstor',
    id: 'help-tab-2',
    panelId: 'help-panel-2',
    label: 'How to Use JSTOR?',
    component: HowToUse,
  },
  {
    param: 'rersearch-basics',
    id: 'help-tab-3',
    panelId: 'help-panel-3',
    label: 'Research Basics',
    component: ResearchBasics,
  },
  {
    param: 'unavailable-items',
    id: 'help-tab-4',
    panelId: 'help-panel-4',
    label: 'Unavailable Items',
    component: UnavailableItems,
  },
]

// This computed property determines the selected tab based on the route parameter
// (used by the dedicated /help/:tab route) or, failing that, a `tab` query param
// (used when this component is embedded on the home page, which has no :tab param).
// If neither matches, it defaults to the first tab (index 0).
const selectedTab = computed(() => {
  const tabParam = Array.isArray(route.params.tab) ? route.params.tab[0] : route.params.tab
  const tabQuery = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
  const index = tabs.findIndex((tab) => tab.param === (tabParam ?? tabQuery))
  return index === -1 ? 0 : index
})

onMounted(() => {
  // This is a bit awkward, but we need to wait for the DOM to be updated with the selected
  // tab before we can scroll to the element with the hash.
  requestAnimationFrame(() => {
    document.getElementById(route.hash.replace(/^#/, ''))?.scrollIntoView({ behavior: 'smooth' })
  })
})

// Tracks the index of the last tab we logged a view for, so the route watcher below and the
// pep-pharos-tabs selection event (which both fire for a route-driven change, see below) don't
// double-log the same view.
let lastLoggedTabIndex = -1

const logTabView = (index: number) => {
  if (index !== lastLoggedTabIndex) {
    lastLoggedTabIndex = index
    handleWithLog(helpTabViewLog(tabs[index].param))
  }
}

// Log a view for the initially selected tab (whether that's the default or set via the
// route/query on load), and for any subsequent route-driven tab changes.
watch(selectedTab, (index) => logTabView(index), { immediate: true })

// pep-pharos-tabs manages tab selection internally once the user clicks a tab, so it no longer
// flows through the `selectedTab` computed above (which only reacts to route changes). Listen
// for its selection event directly to log manual tab switches.
const handleTabSelected = (event: CustomEvent<HTMLElement>) => {
  const index = tabs.findIndex((tab) => tab.id === event.detail.id)
  if (index !== -1) {
    logTabView(index)
  }
}
</script>

<template>
  <section id="help-tabs" class="help-tabs">
    <pep-pharos-heading :level="1" preset="5--bold"> Help Guides </pep-pharos-heading>
    <pep-pharos-tabs
      class="help-tabs__content"
      variant="secondary"
      :selected-tab="selectedTab"
      @pharos-tabs-tab-selected="handleTabSelected"
    >
      <pep-pharos-tab v-for="tab in tabs" :id="tab.id" :key="tab.id" :data-panel-id="tab.panelId">
        {{ tab.label }}
      </pep-pharos-tab>
      <pep-pharos-tab-panel
        v-for="tab in tabs"
        :id="tab.panelId"
        :key="tab.panelId"
        slot="panel"
        class="help-tabs__panel"
      >
        <component :is="tab.component" />
      </pep-pharos-tab-panel>
    </pep-pharos-tabs>
  </section>
</template>

<style scoped lang="scss">
.help-tabs {
  .help-tabs__content {
    max-width: 100%;

    // Pharos tab borders can show a 1px seam at some breakpoints; overlap adjacent tab hosts.
    pep-pharos-tab + pep-pharos-tab {
      margin-left: -1px;
    }
  }
  .help-tabs__panel {
    max-width: 100%;
  }
}
.help-tab__inner {
  max-width: 100%;

  p {
    padding-bottom: var(--pharos-spacing-2-x);
  }
}
</style>
