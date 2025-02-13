<script setup lang="ts">
import { ref } from 'vue'
import type { History } from '@/interfaces/MediaRecord'
import type { PropType } from 'vue'

const props = defineProps({
  isGlobal: Boolean,
  history: {
    type: Object as PropType<History>,
    required: true
  }
})

const scope = ref(props.isGlobal ? 'global' : 'local')

const dateOptions: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short'
}
</script>
<template>
  <tr :class="[scope, 'display-grid']">
    <td>
      <span
        ><small>{{ history.statusLabel || history.status }}</small></span
      >
    </td>
    <td v-if="!isGlobal">
      <span
        ><small>{{ history.entityName }}</small></span
      >
    </td>
    <td>
      <span
        ><small>{{ history.groupName }}</small></span
      >
    </td>
    <td>
      <span
        ><small>{{
          new Date(history.statusCreatedAt).toLocaleString('en', dateOptions)
        }}</small></span
      >
    </td>
    <td>
      <span v-if="history.statusDetails?.reason || history.statusDetails?.comments">
        <span v-if="history.statusDetails?.reason">
          <small> {{ history.statusDetails.reason }} -&nbsp; </small>
        </span>
        <span>
          <small>
            {{ history.statusDetails.comments }}
          </small>
        </span>
      </span>
      <span v-else><small>No Notes</small></span>
    </td>
  </tr>
</template>
