<script setup lang="ts">
import StudentHelp from '@/components/help/StudentHelp.vue'
import { useCoreStore } from '@/stores/core'

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_landing_help_view',
  event_description: 'User has landed on the help view.',
})
</script>

<template>
  <div>
    <pep-pharos-layout row-gap="0">
      <StudentHelp class="cols-12" />
    </pep-pharos-layout>
  </div>
</template>

<style></style>
