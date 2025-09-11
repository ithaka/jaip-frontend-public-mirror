<script setup lang="ts">
import AssessingSearchResults from './AssessingSearchResults.vue'
import AssessingSources from './AssessingSources.vue'
import ForumlatingAStrategy from './ForumlatingAStrategy.vue'
import CitingScholarlyWork from './CitingScholarlyWork.vue'
import CreatingBibliography from './CreatingBibliography.vue'
</script>
<template>
  <div class="help-tab__inner">
    <pep-pharos-heading :level="2" preset="5--bold"> Research Basics</pep-pharos-heading>
    <pep-pharos-heading :level="3" preset="4"
      >An offline course for learning about academic research</pep-pharos-heading
    >
    <p class="help-tab__paragraph">
      How do you think about research? Where do you start? What do you do? How do you use it? Don’t
      worry, the Research Basics content below can help you get a handle on your research process.
    </p>
    <p class="help-tab__paragraph">
      This introductory program was created by JSTOR to help you get familiar with basic research
      concepts needed for success in school and beyond. The topics covered are subjects that will
      help you prepare for academic research.
    </p>
    <ForumlatingAStrategy />
    <AssessingSearchResults />
    <AssessingSources />
    <CitingScholarlyWork />
    <CreatingBibliography />
  </div>
</template>
<style scoped lang="scss">
.help-tab__inner {
  max-width: 100%;
  p {
    margin-bottom: var(--pharos-spacing-2-x);
  }
  ul {
    margin-bottom: var(--pharos-spacing-2-x);
    list-style: circle inside;
    li {
      margin-bottom: var(--pharos-spacing-one-half-x);
    }
  }
  table {
    border: 1px solid var(--pharos-color-black);
    border-collapse: collapse;
    margin-bottom: var(--pharos-spacing-2-x);
    th,
    td {
      border: 1px solid var(--pharos-color-black);
      padding: var(--pharos-spacing-one-half-x) var(--pharos-spacing-1-x);
      text-align: left;
    }
    th {
      background-color: var(--pharos-color-gray-200);
    }
  }
  .help-tab__image {
    display: block;
    max-width: 100%;
    height: auto;
    margin: var(--pharos-spacing-2-x) auto auto auto;
    max-width: 600px;
    width: 100%;
  }
}
</style>
