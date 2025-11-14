<script setup lang="ts">
import jstorLogo from '@/assets/images/help/J_horizontal.svg'
</script>
<template>
  <div class="help-tab__inner">
    <pep-pharos-heading :level="2" preset="4--bold"> What is JSTOR? </pep-pharos-heading>
    <p class="help-tab__paragraph">
      JSTOR is a digital library of academic journals and books. More than 11,000 institutions
      around the world—including colleges and universities, secondary schools, public libraries, and
      other organizations—currently participate in JSTOR. JSTOR helps people discover, use, and
      build upon a wide range of content, and preserves this content for future generations. The
      content in JSTOR is interdisciplinary, scholarly, and peer-reviewed (for most journal and
      ebook content). You can learn more about what peer-reviewed means in the Research Basics
      course included in this tool.
    </p>
    <img alt="Jstor Logo horizontal" :src="jstorLogo" class="help-tab__image" />
    <pep-pharos-heading :level="2" preset="4--bold"> What is in JSTOR? </pep-pharos-heading>
    <p class="help-tab__paragraph">
      JSTOR contains more than 2,600 journals from 1,200 publishers, with publication dates ranging
      from 1665 to 2015 (for certain titles). Journals are available in more than 70 disciplines in
      the humanities, social sciences, and sciences and mathematics. There are also more than 80,000
      ebooks (shown in your search results as book chapters) from academic publishers.
    </p>
  </div>
</template>
<style scoped lang="scss">
.help-tab__inner {
  max-width: 100%;
  p {
    padding-bottom: var(--pharos-spacing-2-x);
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
