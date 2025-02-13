<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { isAuthenticatedStudent, isAuthenticatedAdmin } = storeToRefs(userStore)
</script>

<template>
  <main class="mt-10">
    <pep-pharos-layout row-gap="0">
      Blank page
    </pep-pharos-layout>

  </main>
</template>
