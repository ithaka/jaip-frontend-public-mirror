<script lang="ts" setup>
import { useSearchStore } from '@/stores/search'
import { changeRoute } from '@/utils/helpers'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const searchStore = useSearchStore()
const { searchTerms, pageNo } = storeToRefs(searchStore)

const router = useRouter()
const emit = defineEmits(['close'])

const followLink = (path: string) => {
  changeRoute(router, emit, path, searchTerms.value, pageNo.value, undefined, undefined)
  scrollTo(0, 0)
}
</script>
<template>
  <section>
    <pep-pharos-heading :level="2" preset="5--bold" class="title">
      Get started reviewing
    </pep-pharos-heading>
    <pep-pharos-heading :level="3" preset="4--bold"> Search for materials </pep-pharos-heading>
    <p>
      JSTOR has more than 15 million articles, book chapters, and research reports. Use search to
      find items you want to review and approve for your users.
      <pep-pharos-link @click="followLink('/search')">Start a search</pep-pharos-link>
    </p>
    <pep-pharos-heading :level="3" preset="4--bold"> Manage content requests </pep-pharos-heading>
    <p>
      Review individual document requests from your users. Choose how you want to review each item.
      <pep-pharos-link @click="followLink('/requests')">View pending requests</pep-pharos-link>
    </p>
    <pep-pharos-heading :level="3" preset="4--bold"> Pre-approve materials </pep-pharos-heading>
    <p>
      You can pre-approve whole subjects or journals to make reviewing easier. Go to
      <strong><pep-pharos-link @click="followLink('/search')">Search</pep-pharos-link></strong> ->
      choose a subject or journal -> select <strong>Approve all</strong>. You can change your
      decision at any time. Common pre-approved subjects:
    </p>

    <ul>
      <li>Astronomy</li>
      <li>Aquatic Science</li>
      <li>Bibliography</li>
      <li>Economics</li>
      <li>Law</li>
      <li>Mathematics</li>
      <li>Music</li>
      <li>Religion</li>
      <li>Research Reports</li>
      <li>Social Work</li>
      <li>Sociology</li>
      <li>Statistics</li>
      <li>Zoology</li>
    </ul>

    <p>
      Have a question? Please contact us at
      <pep-pharos-link href="mailto:aip@jstor.org">aip[at]jstor.org</pep-pharos-link>
    </p>
  </section>
</template>
<style lang="scss" scoped>
section {
  .title {
    margin-bottom: var(--pharos-spacing-1-x);
  }
  p {
    margin-bottom: var(--pharos-spacing-2-x);
  }
  ul {
    list-style-type: disc;
    margin-left: var(--pharos-spacing-1-x);
    margin-bottom: var(--pharos-spacing-2-x);
  }
}
</style>
