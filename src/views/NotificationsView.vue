<script setup lang="ts">
import { useCoreStore } from '@/stores/core'
import NotificationsList from '@/components/notifications/NotificationsList.vue'

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_landing_about_view',
  event_description: 'User has landed on the about view.',
})
</script>

<template>
  <main>
    <pep-pharos-layout row-gap="0">
      <NotificationsList />
    </pep-pharos-layout>
  </main>
</template>

<style></style>
