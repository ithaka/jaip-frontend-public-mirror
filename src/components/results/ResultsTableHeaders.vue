<script setup lang="ts">
defineProps({
  isGlobal: Boolean,
})
</script>
<template>
  <tr
    class="display-grid text-align-left"
    :class="isGlobal ? 'global' : 'local'"
  >
    <th>
      {{ isGlobal ? 'Status' : 'Action' }}
    </th>
    <th v-if="!isGlobal">
      Source
    </th>
    <th>Location</th>
    <th>Date</th>
    <th>Notes</th>
  </tr>
</template>
