<script lang="ts" setup>
import type { Alert } from '@/interfaces/Alert'
import { ref } from 'vue'
defineProps<{
  notifications: Alert[]
}>()
const isShowing = ref(true)
</script>
<template>
  <div v-if="notifications.length < 3" data-cy="notifications-container">
    <pep-pharos-alert
      v-for="notification in notifications"
      :key="`notification_${notification.id}`"
      :status="notification.status"
      :closable="true"
      class="notification"
      data-cy="notification"
    >
      <span>{{ notification.text }}</span>
    </pep-pharos-alert>
  </div>
  <div v-else>
    <div data-cy="notifications-container">
      <button
        class="notifications-button"
        :icon-right="isShowing ? 'chevron-up' : 'chevron-down'"
        :a11y-label="isShowing ? 'Hide all notifications' : 'Show all notifications'"
        full-width
        data-cy="notifications-hide-toggle"
        @click="isShowing = !isShowing"
      >
        <span class="notifications-button__text">{{
          isShowing ? 'Hide all notifications' : 'Show all notifications'
        }}</span>
        <pep-pharos-icon
          class="notifications-button__icon"
          :name="isShowing ? 'chevron-up' : 'chevron-down'"
          :a11y-title="isShowing ? 'Hide all notifications' : 'Show all notifications'"
        />
      </button>

      <div v-if="isShowing">
        <pep-pharos-alert
          v-for="notification in notifications"
          :key="`notification_${notification.id}`"
          :status="notification.status"
          :closable="false"
          class="notification"
          data-cy="notification"
        >
          <span>{{ notification.text }}</span>
        </pep-pharos-alert>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.notifications-button {
  background-color: white;
  width: 100%;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--pharos-color-marble-gray-94);
  padding: var(--pharos-spacing-one-half-x);
  border-bottom-style: solid;
  border-bottom-width: 1px;
  border-color: var(--pharos-color-ui-40);
  box-shadow: var(--pharos-elevation-level-1);
  &__text {
    font-weight: bold;
    margin-right: var(--pharos-spacing-1-x);
    font-size: var(--pharos-font-size-base);
    line-height: var(--pharos-line-height-base);
    color: var(--pharos-color-text-base);
  }
}
</style>
