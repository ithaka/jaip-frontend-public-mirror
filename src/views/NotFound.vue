<script setup lang="ts">
import { useCoreStore } from '@/stores/core'

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_landing_not_found_view',
  event_description: 'User has landed on the not found view.',
})
</script>

<template>
  <div class="help page">
    <pep-pharos-layout row-gap="0">
      <pep-pharos-heading
        class="cols-12"
        preset="7"
        :level="1"
      >
        Page Not Found
      </pep-pharos-heading>
      <p class="cols-12">
        Sorry, but the page you were trying to view does not exist.
      </p>
    </pep-pharos-layout>
  </div>
</template>

<style></style>
