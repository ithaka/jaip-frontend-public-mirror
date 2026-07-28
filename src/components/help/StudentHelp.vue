<script setup lang="ts">
import HowToUse from '@/components/help/helpContent/HowToUse.vue'
import WhatIsJstor from '@/components/help/helpContent/WhatIsJstor.vue'
import ResearchBasics from '@/components/help/helpContent/researchBasics/ResearchBasics.vue'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

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
    param: 'research-basics',
    id: 'help-tab-3',
    panelId: 'help-panel-3',
    label: 'How to Research?',
    component: ResearchBasics,
  },
]

// This computed property determines the selected tab based on the route parameter.
// If the parameter does not match any tab, it defaults to the first tab (index 0).
const selectedTab = computed(() => {
  const tabParam = Array.isArray(route.params.tab) ? route.params.tab[0] : route.params.tab
  const index = tabs.findIndex((tab) => tab.param === tabParam)
  return index === -1 ? 0 : index
})

onMounted(() => {
  // This is a bit awkward, but we need to wait for the DOM to be updated with the selected
  // tab before we can scroll to the element with the hash.
  requestAnimationFrame(() => {
    document.getElementById(route.hash.replace(/^#/, ''))?.scrollIntoView()
  })
})
</script>

<template>
  <section class="help-tabs">
    <pep-pharos-heading :level="1" preset="5--bold"> Help Guides </pep-pharos-heading>
    <pep-pharos-tabs class="help-tabs__content" variant="secondary" :selected-tab="selectedTab">
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
