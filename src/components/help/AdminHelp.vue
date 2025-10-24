<script lang="ts" setup>
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

const coreStore = useCoreStore()
const { supportEmail } = storeToRefs(coreStore)
</script>
<template>
  <section class="admin-help">
    <pep-pharos-heading :level="1" preset="5--bold">
      JSTOR Access in Prison Help
    </pep-pharos-heading>
    <div class="admin-help__content">
      <p>
        <strong>Search and Bulk Approval</strong> will let you filter the available materials by
        date, content type, discipline or journal title to preview the material and then approve any
        collection of content.
      </p>
      <p>
        <strong>Manage Requests</strong> allows administration of the individual document requests
        from incarcerated learners in your group, and provides a workflow system for review and
        approval of these requests, including reporting of all reviews.
      </p>
      <p>
        Have a question? Please contact us at
        <pep-pharos-link :href="`mailto:${supportEmail}`">{{
          supportEmail.replace('@', '[at]')
        }}</pep-pharos-link>
      </p>
    </div>
  </section>
</template>
<style scoped lang="scss">
.admin-help {
  .admin-help__content {
    max-width: 100%;
    margin-top: var(--pharos-spacing-2-x);
  }
  p {
    margin-bottom: var(--pharos-spacing-2-x);
  }
}
</style>
