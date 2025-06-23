<script setup lang="ts">
import StudentHelp from '@/components/help/StudentHelp.vue'
import AdminHelp from '@/components/help/AdminHelp.vue'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { isAuthenticatedAdmin } = storeToRefs(userStore)

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_landing_help_view',
  event_description: 'User has landed on the help view.',
})
</script>

<template>
  <div class="help page">
    <pep-pharos-layout row-gap="0">
      <component
        :is="isAuthenticatedAdmin ? AdminHelp : StudentHelp"
        class="cols-12"
      />
    </pep-pharos-layout>
  </div>
</template>

<style></style>
