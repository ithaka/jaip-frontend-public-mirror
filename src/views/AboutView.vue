<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import About from '../assets/markdown/about.md'
import AdminAbout from '../assets/markdown/admin-about.md'
import InvalidLogin from '@/components/headers/InvalidLogin.vue'
import { usePageViewLogger } from '@/composables/logging/usePageViewLogger'

const userStore = useUserStore()
const { isAuthenticatedAdmin } = storeToRefs(userStore)

const { logPageView } = usePageViewLogger()
logPageView()
</script>

<template>
  <main>
    <InvalidLogin />
    <pep-pharos-layout row-gap="0">
      <component :is="isAuthenticatedAdmin ? AdminAbout : About" class="cols-12" />
    </pep-pharos-layout>
  </main>
</template>

<style></style>
