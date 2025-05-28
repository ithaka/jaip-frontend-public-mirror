<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import About from '../assets/markdown/about.md'
import AdminAbout from '../assets/markdown/admin-about.md'
import InvalidLogin from '@/components/headers/InvalidLogin.vue'

const userStore = useUserStore()
const { isAuthenticatedAdmin } = storeToRefs(userStore)

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_landing_about_view',
  event_description: 'User has landed on the about view.',
})
</script>

<template>
  <main class="about page">
    <InvalidLogin />
    <pep-pharos-layout row-gap="0">
      <component :is="isAuthenticatedAdmin ? AdminAbout : About" class="cols-12" />
    </pep-pharos-layout>
  </main>
</template>

<style></style>
