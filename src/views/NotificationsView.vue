<script setup lang="ts">
import NotificationsList from '@/components/notifications/NotificationsList.vue'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main>
    <pep-pharos-layout row-gap="0">
      <NotificationsList />
    </pep-pharos-layout>
  </main>
</template>

<style></style>
