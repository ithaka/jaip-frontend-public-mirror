<script lang="ts" setup>
import type { Alert } from '@/interfaces/Alert'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { onMounted, ref, useTemplateRef } from 'vue'
import NotificationsModal from './NotificationsModal.vue'
import DeleteModal from './DeleteModal.vue'
import { useNotificationsStore } from '@/stores/notifications'

// STORES
const userStore = useUserStore()
const { canManageFacilities, changeableFacilities, facilityMap } = storeToRefs(userStore)

const notificationsStore = useNotificationsStore()
const { paginatedCount, paginatedNotifications, notifications, limit } =
  storeToRefs(notificationsStore)

// INITIAL VALUES
const selectedGroups = ref(
  (changeableFacilities.value
    .map((f) => {
      return facilityMap.value.get(f)?.groups?.[0]?.id
    })
    .filter((id) => id) || []) as number[],
)

const isActive = ref(true)
const currentPage = ref(1)
const showNotificationModal = ref(false)
const showDeleteModal = ref(false)
const deleteId = ref(0)
const selectedNotification = ref<Alert>({} as Alert)

// MODALS
const openNewNotificationModal = () => {
  selectedNotification.value = {} as Alert
  showNotificationModal.value = true
}
const openEditNotificationModal = (notification: Alert) => {
  selectedNotification.value = notification
  showNotificationModal.value = true
}
const openDeleteNotificationModal = (id: number) => {
  deleteId.value = id
  showDeleteModal.value = true
}
const closeNotificationModal = () => {
  selectedNotification.value = {} as Alert
  showNotificationModal.value = false
}
const handleDeleteSubmission = () => {
  showDeleteModal.value = false
  getPaginatedNotifications(1)
}
const handleSubmission = () => {
  showNotificationModal.value = false
  getPaginatedNotifications(1)
  // After a new submission, we need to refresh the notifications, because
  // new notifications may need to be shown or existing ones removed.
  notificationsStore.getDisplayNotifications()
}

const toggleActiveNotifications = () => {
  isActive.value = !isActive.value
  getPaginatedNotifications(1)
}

const getPaginatedNotifications = async (page: number) => {
  const args = {
    page,
    limit: limit.value,
    groups: selectedGroups.value,
    is_active: isActive.value,
  }
  notificationsStore.getPaginatedNotifications(args)
}
const editButton = useTemplateRef('edit-button')
const setFocusToEditButton = () => {
  if (Array.isArray(editButton.value) && editButton.value.length) {
    ;(editButton.value[0] as HTMLElement)?.focus()
  }
}
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    getPaginatedNotifications(currentPage.value)
    setFocusToEditButton()
  }
}
const nextPage = () => {
  if (currentPage.value * limit.value < paginatedCount.value) {
    currentPage.value++
    getPaginatedNotifications(currentPage.value)
    setFocusToEditButton()
  }
}

onMounted(() => {
  getPaginatedNotifications(currentPage.value)
})

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}
</script>
<template>
  <div class="notifications">
    <pep-pharos-heading class="notifications__heading" :level="1" preset="5">
      Notifications
    </pep-pharos-heading>
    <p class="notifications__description">
      <span v-if="canManageFacilities" class="notifications__description-text">
        Create and schedule custom notifications for users at specific facilities, groups, or
        subdomains.
      </span>
      <span v-else class="notifications__description-text">
        Create and schedule custom notifications for users at specific facilities.
      </span>
    </p>
    <pep-pharos-button
      class="notifications__add-button"
      variant="primary"
      icon-left="add"
      data-cy="notifications-new-button"
      @click="openNewNotificationModal"
    >
      New notification
    </pep-pharos-button>

    <div v-if="paginatedCount > 1">
      <pep-pharos-heading class="notifications__count" :level="4" preset="2">
        {{ paginatedCount }} notifications
      </pep-pharos-heading>
    </div>
    <div v-if="paginatedCount == 1">
      <pep-pharos-heading class="notifications__count" :level="4" preset="2">
        {{ paginatedCount }} notification
      </pep-pharos-heading>
    </div>
    <div class="notifications__active-checkbox">
      <pep-pharos-checkbox
        :checked="isActive"
        :value="isActive"
        data-cy="notifications-active-filter"
        @click="toggleActiveNotifications"
      >
        <span slot="label"> Show active notifications only </span>
      </pep-pharos-checkbox>
    </div>

    <div v-if="notifications?.length" class="notifications-table-container">
      <table class="notifications-table" data-cy="notifications-table">
        <thead>
          <tr>
            <th class="notifications-table__header notifications-table__header--message">
              <pep-pharos-heading preset="legend" :level="4"> Message </pep-pharos-heading>
            </th>
            <th class="notifications-table__header notifications-table__header--status">
              <pep-pharos-heading preset="legend" :level="4"> Status </pep-pharos-heading>
            </th>
            <th class="notifications-table__header notifications-table__header--expiration">
              <pep-pharos-heading preset="legend" :level="4"> Expiration </pep-pharos-heading>
            </th>
            <th
              v-if="changeableFacilities.length > 1"
              class="notifications-table__header notifications-table__header--recipients"
            >
              <pep-pharos-heading preset="legend" :level="4"> Recipients </pep-pharos-heading>
            </th>
            <th class="notifications-table__header notifications-table__header--created">
              <pep-pharos-heading preset="legend" :level="4"> Created On </pep-pharos-heading>
            </th>
            <th class="notifications-table__header notifications-table__header--actions">
              <pep-pharos-heading preset="legend" :level="4"> Actions </pep-pharos-heading>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(notification, index) in paginatedNotifications"
            :key="index"
            class="notifications-table__row"
          >
            <td class="notifications-table__cell notifications-table__cell--message">
              <div class="notifications-table__message">
                <span class="notifications-table__message-text">
                  <span class="notifications-table__message-text-content">
                    {{ notification.text }}
                  </span>
                  <pep-pharos-icon
                    class="notifications-table__message-text-icon"
                    name="info-inverse"
                    a11y-title="Full message text"
                    a11y-hidden="false"
                    :aria-describedby="`notification-text-tooltip-${notification.id}`"
                    :data-tooltip-id="`notification-text-tooltip-${notification.id}`"
                    role="button"
                    tabindex="0"
                  />
                </span>
                <pep-pharos-tooltip :id="`notification-text-tooltip-${notification.id}`">
                  <span class="notifications-table__message-text-tooltip">
                    {{ notification.text }}
                  </span>
                </pep-pharos-tooltip>
              </div>
            </td>
            <td class="notifications-table__cell notifications-table__cell--status">
              <div class="notifications-table__status">
                <span>
                  <span
                    v-if="
                      notification.is_active &&
                      new Date(notification.start_date) <= new Date() &&
                      new Date(notification.end_date) >= new Date()
                    "
                  >
                    <pep-pharos-icon
                      class="notifications-table__status-icon notifications-table__status-icon--active"
                      name="checkmark-inverse"
                      a11y-title="Active"
                      a11y-hidden="false"
                    />
                    Active
                  </span>
                  <span
                    v-else-if="
                      notification.is_active && new Date(notification.start_date) >= new Date()
                    "
                  >
                    <pep-pharos-icon
                      class="notifications-table__status-icon notifications-table__status-icon--scheduled"
                      name="calendar"
                      a11y-title="Scheduled"
                      a11y-hidden="false"
                    />
                    Scheduled ({{
                      new Date(notification.start_date).toLocaleString('en', dateOptions)
                    }})
                  </span>
                  <span
                    v-else-if="
                      notification.is_active && new Date(notification.end_date) < new Date()
                    "
                  >
                    <pep-pharos-icon
                      class="notifications-table__status-icon notifications-table__status-icon--expired"
                      name="close-inverse"
                      a11y-title="Expired"
                      a11y-hidden="false"
                    />
                    Expired
                  </span>
                </span>
              </div>
            </td>
            <td class="notifications-table__cell notifications-table__cell--expiration">
              <div class="notifications-table__expiration">
                {{
                  notification.created_at
                    ? new Date(notification.end_date).toLocaleString('en', dateOptions)
                    : 'N/A'
                }}
              </div>
            </td>
            <td
              v-if="changeableFacilities.length > 1"
              class="notifications-table__cell notifications-table__cell--recipients"
            >
              <div class="notifications-table__recipients">
                <div v-if="notification.alerts_facilities?.length">
                  <ul class="notifications-table__list">
                    <li
                      v-for="(af, fIndex) in notification.alerts_facilities"
                      :key="`facility-${fIndex}`"
                    >
                      {{ af.facilities.entities.name || 'Unknown Facility' }}
                    </li>
                  </ul>
                </div>
                <div v-if="notification.alerts_groups?.length">
                  <ul class="notifications-table__list">
                    <li v-for="(ag, gIndex) in notification.alerts_groups" :key="`group-${gIndex}`">
                      {{ ag.groups.name || 'Unknown Group' }}
                    </li>
                  </ul>
                </div>
                <div v-if="notification.alerts_subdomains?.length">
                  <ul class="notifications-table__list">
                    <li
                      v-for="(as, sIndex) in notification.alerts_subdomains"
                      :key="`subdomain-${sIndex}`"
                    >
                      {{ as.subdomain }}
                    </li>
                  </ul>
                </div>
              </div>
              <div
                v-if="
                  !notification.alerts_facilities?.length &&
                  !notification.alerts_groups?.length &&
                  !notification.alerts_subdomains?.length
                "
              >
                Not specified
              </div>
            </td>
            <td class="notifications-table__cell notifications-table__cell--created">
              <div class="notifications-table__created-on">
                {{
                  notification.created_at
                    ? new Date(notification.created_at).toLocaleString('en', dateOptions)
                    : 'N/A'
                }}
              </div>
            </td>
            <td class="notifications-table__cell notifications-table__cell--actions">
              <div class="notifications-table__actions">
                <pep-pharos-button
                  v-if="notification.id"
                  ref="edit-button"
                  class="notifications-table__actions-button notifications-table__actions-button--edit"
                  variant="secondary"
                  icon-left="edit"
                  @click="openEditNotificationModal(notification)"
                >
                  Edit
                </pep-pharos-button>
                <pep-pharos-button
                  v-if="notification.id"
                  class="notifications-table__actions-button notifications-table__actions-button--delete"
                  variant="secondary"
                  icon-left="delete"
                  @click="openDeleteNotificationModal(notification.id)"
                >
                  Delete
                </pep-pharos-button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="paginatedCount > limit && notifications?.length"
      class="notifications__pagination-container"
    >
      <pep-pharos-pagination
        class="notifications__pagination"
        :total-results="paginatedCount"
        :page-size="limit"
        :current-page="currentPage"
        @prev-page="previousPage"
        @next-page="nextPage"
      />
    </div>
    <div v-else-if="!notifications?.length" class="notifications__empty">
      <p class="notifications__empty-text" data-cy="notifications-empty-state">
        You don't have any active notifications.
      </p>
    </div>
  </div>
  <NotificationsModal
    :show="showNotificationModal"
    :notification="selectedNotification"
    data-cy="notifications-modal"
    @close="closeNotificationModal"
    @submit="handleSubmission"
  />
  <DeleteModal
    :id="deleteId"
    :show="showDeleteModal"
    data-cy="notifications-delete-modal"
    @close="showDeleteModal = false"
    @submit="handleDeleteSubmission"
  />
</template>

<style lang="scss" scoped>
.notifications {
  grid-column: span 12;
  &__description {
    margin-bottom: var(--pharos-spacing-1-x);
  }
  &__add-button {
    margin-bottom: var(--pharos-spacing-2-x);
  }
  &__active-checkbox {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }
  &__empty {
    padding: var(--pharos-spacing-5-x) 0;
    text-align: left;
    border: 3px dashed var(--pharos-color-marble-gray-80);
  }
  &__pagination-container {
    display: flex;
    justify-content: end;
  }
  &__pagination {
    margin-top: var(--pharos-spacing-2-x);
  }
}

.notifications-table {
  width: 100%;
  border-collapse: collapse;

  &__header,
  &__cell {
    padding: var(--pharos-spacing-1-x);
    text-align: left;
    vertical-align: middle;
    border: 1px solid var(--pharos-color-ui-40);
    &--message {
      width: 30%;
    }
  }

  &__header {
    font-weight: var(--pharos-font-weight-bold);
  }

  &__cell {
    white-space: normal;
  }

  &__message-text-content {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &__message-text {
    display: flex;
    align-items: center;
  }
  &__message-text-icon {
    margin-left: var(--pharos-spacing-one-half-x);
  }
  &__status-icon {
    margin-right: var(--pharos-spacing-one-quarter-x);
    &--active {
      fill: var(--pharos-color-green-base);
    }
  }
  &__status {
    span {
      display: flex;
      align-items: center;
    }
  }
  &__actions-button {
    &--edit {
      margin-right: var(--pharos-spacing-one-half-x);
    }
  }
}

@media (max-width: 768px) {
  .notifications-table-container {
    overflow-x: auto;
    padding-right: var(--pharos-spacing-2-x);
  }

  .notifications-table {
    table-layout: auto;
    width: max-content;
    min-width: 200%;
    &__header,
    &__cell {
      max-width: 50px;
    }
  }
}
</style>
