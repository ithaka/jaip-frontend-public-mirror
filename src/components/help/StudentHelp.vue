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
      <pep-pharos-tab id="help-tab-1" data-panel-id="help-panel-1"> What is JSTOR? </pep-pharos-tab>
      <pep-pharos-tab id="help-tab-2" data-panel-id="help-panel-2">
        How to Use JSTOR?
      </pep-pharos-tab>
      <pep-pharos-tab id="help-tab-3" data-panel-id="help-panel-3">
        How to Research?
      </pep-pharos-tab>
      <pep-pharos-tab-panel id="help-panel-1" slot="panel">
        <JSTOR />
      </pep-pharos-tab-panel>
      <pep-pharos-tab-panel id="help-panel-2" slot="panel">
        <Use />
      </pep-pharos-tab-panel>
      <pep-pharos-tab-panel id="help-panel-3" slot="panel">
        <Research />
      </pep-pharos-tab-panel>
    </pep-pharos-tabs>
  </section>
</template>
