<script setup lang="ts">
import StudentHelp from '@/components/help/StudentHelp.vue'
import AdminHelp from '@/components/help/AdminHelp.vue'
import SearchInput from '@/components/SearchInput.vue'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { isAuthenticatedStudent, isAuthenticatedAdmin } = storeToRefs(userStore)

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_landing_home_view',
  event_description: 'User has landed on the home view.',
})
</script>

<template>
  <main class="mt-10">
    <pep-pharos-layout row-gap="0">
      <pep-pharos-heading
        :level="1"
        preset="7"
        class="cols-12 hidden-sm display-block"
      >
        <span>Explore the world’s knowledge, cultures, and ideas</span>
      </pep-pharos-heading>
      <pep-pharos-heading
        :level="1"
        preset="5"
        class="cols-12 hidden display-block-sm"
      >
        <span>Explore the world’s knowledge, cultures, and ideas</span>
      </pep-pharos-heading>
      <div class="cols-10">
        <SearchInput
          id="home"
          label="Search"
          a11y-label="Search"
          variant="prominent"
        />
      </div>
    </pep-pharos-layout>

    <div class="cols-12 mt--4 mb-7 hero" />

    <pep-pharos-layout row-gap="0">
      <AdminHelp
        v-if="isAuthenticatedAdmin"
        class="cols-12"
      />
      <StudentHelp
        v-else-if="isAuthenticatedStudent"
        class="cols-12"
      />
    </pep-pharos-layout>
  </main>
</template>
