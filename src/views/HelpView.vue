<script setup lang="ts">
import StudentHelp from '@/components/help/StudentHelp.vue'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <div>
    <pep-pharos-layout row-gap="0">
      <StudentHelp class="cols-12" />
    </pep-pharos-layout>
  </div>
</template>

<style></style>
