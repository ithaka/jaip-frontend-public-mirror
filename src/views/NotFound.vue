<script setup lang="ts">
import StudentHelp from "@/components/help/StudentHelp.vue"
import AdminHelp from "@/components/help/AdminHelp.vue"
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const {
  isAuthenticatedAdmin,
} = storeToRefs(userStore)
</script>


<template>
  <div class="help page">
    <pep-pharos-layout row-gap="0">
      <pep-pharos-heading class="cols-12" preset="7" :level="1">
        Page Not Found
      </pep-pharos-heading>
      <p class="cols-12">Sorry, but the page you were trying to view does not exist.</p>
    </pep-pharos-layout>
  </div>
</template>

<style></style>
