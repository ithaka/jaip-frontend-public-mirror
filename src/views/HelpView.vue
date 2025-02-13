<script setup lang="ts">
import StudentHelp from '@/components/help/StudentHelp.vue'
import AdminHelp from '@/components/help/AdminHelp.vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { isAuthenticatedAdmin } = storeToRefs(userStore)
</script>

<template>
  <div class="help page">
    <pep-pharos-layout row-gap="0">
      <component :is="isAuthenticatedAdmin ? AdminHelp : StudentHelp" class="cols-12" />
    </pep-pharos-layout>
  </div>
</template>

<style></style>
