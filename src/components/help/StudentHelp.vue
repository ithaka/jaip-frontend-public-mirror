<script setup lang="ts">
import HowToUse from '@/components/help/helpContent/HowToUse.vue'
import WhatIsJstor from '@/components/help/helpContent/WhatIsJstor.vue'
import ResearchBasics from '@/components/help/helpContent/researchBasics/ResearchBasics.vue'
</script>

<template>
  <section class="help-tabs">
    <pep-pharos-heading :level="1" preset="5--bold"> Help Guides </pep-pharos-heading>
    <pep-pharos-tabs class="help-tabs__content" variant="secondary">
      <pep-pharos-tab id="help-tab-1" data-panel-id="help-panel-1"> What is JSTOR? </pep-pharos-tab>
      <pep-pharos-tab id="help-tab-2" data-panel-id="help-panel-2">
        How to Use JSTOR?
      </pep-pharos-tab>
      <pep-pharos-tab id="help-tab-3" data-panel-id="help-panel-3">
        How to Research?
      </pep-pharos-tab>
      <pep-pharos-tab-panel id="help-panel-1" slot="panel" class="help-tabs__panel">
        <WhatIsJstor />
      </pep-pharos-tab-panel>
      <pep-pharos-tab-panel id="help-panel-2" slot="panel" class="help-tabs__panel">
        <HowToUse />
      </pep-pharos-tab-panel>
      <pep-pharos-tab-panel id="help-panel-3" slot="panel" class="help-tabs__panel">
        <ResearchBasics />
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
