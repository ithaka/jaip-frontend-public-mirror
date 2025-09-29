<script lang="ts" setup>
import { useNotificationsStore } from '@/stores/notifications'
import { useCoreStore } from '@/stores/core'
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
})

const handleSubmit = async () => {
  const notificationsStore = useNotificationsStore()
  const coreStore = useCoreStore()
  try {
    await notificationsStore.deleteNotification(props.id)
    coreStore.toast('Notification deleted', 'success')
  } catch {
    coreStore.toast('Error deleting notification', 'error')
  } finally {
    emit('submit')
  }
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
}>()
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="delete-notification-modal"
      class="notifications-modal"
      header="Delete notification"
      :open="show"
      data-cy="notifications-delete-modal"
      @pharos-modal-closed="emit('close')"
    >
      <p slot="description" class="notifications-modal__description">
        Are you sure you want to delete this notification?
      </p>
      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <pep-pharos-button slot="footer" data-cy="notifications-delete-confirm" @click="handleSubmit">
        Submit
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
