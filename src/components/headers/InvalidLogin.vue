<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

const coreStore = useCoreStore()
const { isAdminSubdomain } = storeToRefs(coreStore)

const userStore = useUserStore()
const { invalidUserEmail } = storeToRefs(userStore)
</script>
<template>
  <pep-pharos-layout v-if="isAdminSubdomain && invalidUserEmail" class="mt-2 mb-7" row-gap="0">
    <div class="cols-12">
      <p class="notice">
        <small>
          {{
            `You are logged in as ${invalidUserEmail}. This account does not have administrative privileges. Ask your facility's administrator to update your account permissions.`
          }}
        </small>
      </p>
    </div>
  </pep-pharos-layout>
</template>
