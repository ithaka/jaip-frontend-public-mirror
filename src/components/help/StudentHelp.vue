<script setup lang="ts">
import Use from '@/assets/markdown/how-to-use-jstor.md'
import JSTOR from '@/assets/markdown/what-is-jstor.md'
import Research from '@/assets/markdown/research-basics.md'
</script>

<template>
  <section>
    <pep-pharos-heading class="cols-12" :level="1" preset="5--bold">
      JSTOR Access in Prison Help
    </pep-pharos-heading>
    <pep-pharos-tabs>
      <pep-pharos-tab data-panel-id="what-is-jstor"> What is JSTOR? </pep-pharos-tab>
      <pep-pharos-tab data-panel-id="how-to-use-jstor"> How to Use JSTOR? </pep-pharos-tab>
      <pep-pharos-tab data-panel-id="how-to-research"> How to Research? </pep-pharos-tab>
      <!-- eslint-disable vue/no-deprecated-slot-attribute -->
      <pep-pharos-tab-panel id="what-is-jstor" slot="panel" class="panel">
        <JSTOR />
      </pep-pharos-tab-panel>
      <pep-pharos-tab-panel id="how-to-use-jstor" slot="panel" class="panel">
        <Use />
      </pep-pharos-tab-panel>
      <pep-pharos-tab-panel id="how-to-research" slot="panel" class="panel">
        <Research />
      </pep-pharos-tab-panel>
      <!-- eslint-enable vue/no-deprecated-slot-attribute -->
    </pep-pharos-tabs>
  </section>
</template>
