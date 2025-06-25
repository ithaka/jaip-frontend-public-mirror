<script setup lang="ts">
import { useCoreStore } from '@/stores/core'
import BlockList from '@/components/results/BlockList.vue'

const coreStore = useCoreStore()
coreStore.$api.log({
  eventtype: 'pep_block_list_view',
  event_description: 'User has landed on the block list view.',
})
</script>

<template>
  <main class="block-list page">
    <pep-pharos-layout row-gap="0">
      <BlockList />
    </pep-pharos-layout>
  </main>
</template>
<style></style>
