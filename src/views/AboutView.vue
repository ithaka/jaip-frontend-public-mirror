<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import About from '../assets/markdown/about.md'
import AdminAbout from '../assets/markdown/admin-about.md'
import InvalidLogin from '@/components/headers/InvalidLogin.vue'

const userStore = useUserStore()
const { isAuthenticatedAdmin } = storeToRefs(userStore)
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
