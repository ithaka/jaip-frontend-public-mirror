<script lang="ts" setup>
import DatePicker from './DatePicker.vue'
import { AlertStatus, type Alert, type StatusOption } from '@/interfaces/Alert'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import { useCoreStore } from '@/stores/core'
import { useSubdomainStore } from '@/stores/subdomains'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { computed, ref, watch, type PropType } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  notification: {
    type: Object as PropType<Alert>,
    required: false,
    default: () => ({}) as Alert,
  },
})

// Watch for changes to the notification prop to reset the form when editing a different notification.
watch(
  () => props.notification,
  () => {
    resetForm()
  },
)

const MAX_NOTIFICATION_LENGTH = 750

// STORES
const coreStore = useCoreStore()

const subdomainsStore = useSubdomainStore()
const { subdomains } = storeToRefs(subdomainsStore)

const userStore = useUserStore()
const { canManageFacilities, changeableFacilities, facilityMap, groupMap, manageableGroups } =
  storeToRefs(userStore)

// MESSAGE SELECTION
const defaultMessage = computed(() => props.notification?.text || '')
const notificationText = ref(defaultMessage.value)
const handleMessageInput = (e: InputFileEvent) => {
  notificationText.value = e.target.value
  invalidNotificationText.value = invalidNotificationTextMessage.value !== ''
}

// MESSAGE VALIDATION
const invalidNotificationText = ref(false)
const invalidNotificationTextMessage = computed(() => {
  if (notificationText.value.trim() === '') {
    return 'Please include a message'
  } else if (notificationText.value.length > MAX_NOTIFICATION_LENGTH) {
    return `Message cannot be more than ${MAX_NOTIFICATION_LENGTH} characters`
  }
  return ''
})
const validateNotificationText = () => {
  invalidNotificationText.value = invalidNotificationTextMessage.value !== ''
}

// FACILITIES SELECTION
const defaultFacilities = computed(
  () =>
    props.notification?.alerts_facilities
      ?.map((af) => af.facilities?.entities?.id)
      .filter((id) => id) || [],
)
const selectedFacilities = ref(defaultFacilities.value)
// If the user can only edit one facility, preselect it and
// there will be no need for a facility selector.
if (changeableFacilities.value.length === 1) {
  selectedFacilities.value = [...changeableFacilities.value]
}
const handleFacilityChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  selectedFacilities.value = Array.from(target.selectedOptions).map((option) =>
    Number(option.value),
  )
}

// GROUPS SELECTION
const defaultGroups = computed(
  () => props.notification?.alerts_groups?.map((ag) => ag.groups?.id).filter((id) => id) || [],
)
const selectedGroups = ref(defaultGroups.value)
const handleGroupChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  selectedGroups.value = Array.from(target.selectedOptions).map((option) => Number(option.value))
}

// SUBDOMAINS SELECTION
// We only allow subdomain selection if the user can manage groups
// but we do need to make sure they get retrieved.
if (manageableGroups.value.length) {
  subdomainsStore.getAllSubdomains()
}
const defaultSubdomains = computed(
  () => props.notification?.alerts_subdomains?.map((as) => as.subdomain).filter((sd) => sd) || [],
)
const selectedSubdomains = ref(defaultSubdomains.value)
const handleSubdomainChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  selectedSubdomains.value = Array.from(target.selectedOptions).map((option) => option.value)
}

// RECIPIENT VALIDATION
const invalidRecipients = ref(false)
const invalidRecipientsMessage = computed(() => {
  const noSelection =
    selectedFacilities.value.length === 0 &&
    selectedGroups.value.length === 0 &&
    selectedSubdomains.value.length === 0
  if (noSelection) {
    if (canManageFacilities.value) {
      return 'Please select at least one facility, group, or subdomain'
    } else if (invalidRecipients.value) {
      return 'Please select recipients'
    }
  }
  return ''
})
const validateRecipients = () => {
  invalidRecipients.value = invalidRecipientsMessage.value !== ''
}

// STATUS SELECTION
const statusOptions: Partial<Record<AlertStatus, StatusOption>> = {
  [AlertStatus.INFO]: {
    value: AlertStatus.INFO,
    label: 'Informational',
    tooltip: 'For instructions or policies',
  },
  [AlertStatus.WARNING]: {
    value: AlertStatus.WARNING,
    label: 'Warning',
    tooltip: 'For critical information',
  },
}

if (canManageFacilities.value) {
  statusOptions[AlertStatus.ERROR] = {
    value: AlertStatus.ERROR,
    label: 'Critical',
    tooltip: 'For emergencies or urgent messages',
  }
  statusOptions[AlertStatus.SUCCESS] = {
    value: AlertStatus.SUCCESS,
    label: 'Success',
    tooltip: 'For positive notifications',
  }
}
const defaultStatus = computed(() => props.notification?.status || AlertStatus.INFO)
const selectedStatus = ref(defaultStatus.value)

// STATUS VALIDATION
const invalidStatus = ref(false)
const invalidStatusMessage = computed(() => {
  if (!selectedStatus.value) {
    return 'Please make a selection'
  }
  return ''
})
const validateStatus = () => {
  invalidStatus.value = invalidStatusMessage.value !== ''
}

// DATE SELECTION
const defaultDates = computed(() =>
  props.notification?.start_date && props.notification?.end_date
    ? [new Date(props.notification.start_date), new Date(props.notification.end_date)]
    : [],
)
const dates = ref(defaultDates.value)

// DATE VALIDATION
const invalidDates = ref(false)
const invalidDatesMessage = computed(() => {
  if (!dates.value[0] || !dates.value[1]) {
    return 'Please select a date range'
  }
  return ''
})
const validateDates = () => {
  invalidDates.value = invalidDatesMessage.value !== ''
}

// FORM VALIDATION
const validateForm = () => {
  validateNotificationText()
  validateRecipients()
  validateDates()
  validateStatus()
}
// NOTE: This computed value will only be guaranteed accurate after validateForm is called.
const isValidSubmission = computed(() => {
  return (
    !invalidNotificationText.value &&
    !invalidRecipients.value &&
    !invalidDates.value &&
    !invalidStatus.value
  )
})

// RESET FORM
const resetForm = () => {
  console.log('resetting form')
  notificationText.value = defaultMessage.value
  selectedFacilities.value = defaultFacilities.value.length
    ? defaultFacilities.value
    : changeableFacilities.value.length === 1
      ? [...changeableFacilities.value]
      : []
  selectedGroups.value = defaultGroups.value
  selectedSubdomains.value = defaultSubdomains.value
  dates.value = defaultDates.value
  selectedStatus.value = defaultStatus.value
  invalidNotificationText.value = false
  invalidRecipients.value = false
  invalidDates.value = false
  invalidStatus.value = false
}

// SUBMIT FORM
const handleSubmit = async () => {
  // First validate the form. If the form is invalid, do not submit.
  validateForm()
  if (!isValidSubmission.value) {
    return
  }

  try {
    const alert = {
      text: notificationText.value.trim(),
      facilities: selectedFacilities.value,
      groups: selectedGroups.value,
      subdomains: selectedSubdomains.value,
      start_date: dates.value[0]!,
      end_date: dates.value[1]!,
      status: selectedStatus.value,
      is_active: true,
    } as Alert
    // If we have a notification prop with an id, we're editing an existing notification.
    if (props.notification?.id) {
      alert.id = props.notification.id
      await coreStore.$api.alerts.edit(alert)
      coreStore.toast('Notification updated', 'success')
      // Otherwise, we're creating a new notification.
    } else {
      await coreStore.$api.alerts.add(alert)
      coreStore.toast('Notification created', 'success')
    }
    resetForm()
  } catch {
    coreStore.toast('Error creating notification', 'error')
  }

  emit('submit')
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
}>()
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      id="add-notification-modal"
      class="notifications-modal"
      :header="`${props.notification?.id ? 'Edit' : 'Create'} notification`"
      :open="show"
      data-cy="notifications-modal"
      @pharos-modal-closed="emit('close')"
    >
      <p slot="description" class="notifications-modal__description">
        {{
          `${props.notification?.id ? 'Edit' : 'Create'} a notification for your users. It will appear at the top of every page.`
        }}
      </p>
      <form>
        <pep-pharos-textarea
          :value="notificationText"
          :invalidated="invalidNotificationText"
          :message="invalidNotificationText ? invalidNotificationTextMessage : ''"
          placeholder="Add a custom message"
          class="notifications-modal__form-field notifications-modal__message"
          required
          data-cy="notifications-message-input"
          @input="handleMessageInput"
        >
          <span slot="label"> Notification Message </span>
        </pep-pharos-textarea>

        <pep-pharos-multiselect-dropdown
          v-if="changeableFacilities.length > 1"
          :key="`facility-selector_${props.notification?.id || 'new'}`"
          class="notifications-modal__form-field notifications-modal__facility-selector"
          required
          loose-match
          :invalidated="invalidRecipients"
          :message="invalidRecipients ? invalidRecipientsMessage : ''"
          :value="selectedFacilities"
          data-cy="notifications-facility-selector"
          @change="handleFacilityChange"
        >
          <span slot="label">{{ canManageFacilities ? 'Facilities' : 'Recipients' }}</span>
          <option
            v-for="facility in changeableFacilities"
            :key="`facility_${facilityMap.get(facility)?.id}`"
            :value="facilityMap.get(facility)?.id"
            :selected="selectedFacilities.includes(facilityMap.get(facility)?.id || -1)"
          >
            {{ facilityMap.get(facility)?.name }}
          </option>
        </pep-pharos-multiselect-dropdown>

        <pep-pharos-multiselect-dropdown
          v-if="manageableGroups.length"
          :key="`group-selector_${props.notification?.id || 'new'}`"
          class="notifications-modal__form-field notifications-modal__group-selector"
          required
          loose-match
          :invalidated="invalidRecipients"
          :message="invalidRecipients ? invalidRecipientsMessage : ''"
          :value="selectedGroups"
          :selected-options="selectedGroups.map((id) => ({ value: id }))"
          data-cy="notifications-group-selector"
          @change="handleGroupChange"
        >
          <span slot="label"> Groups </span>
          <option
            v-for="group in manageableGroups"
            :key="`group_${groupMap.get(group)?.id}`"
            :value="groupMap.get(group)?.id"
            :selected="selectedGroups.includes(groupMap.get(group)?.id || -1)"
          >
            {{ groupMap.get(group)?.name }}
          </option>
        </pep-pharos-multiselect-dropdown>

        <pep-pharos-multiselect-dropdown
          v-if="manageableGroups.length"
          :key="`subdomain-selector_${props.notification?.id || 'new'}`"
          class="notifications-modal__form-field notifications-modal__subdomain-selector"
          required
          loose-match
          :invalidated="invalidRecipients"
          :message="invalidRecipients ? invalidRecipientsMessage : ''"
          :value="selectedSubdomains"
          data-cy="notifications-subdomain-selector"
          @change="handleSubdomainChange"
        >
          <span slot="label"> Subdomains </span>
          <option
            v-for="subdomain in subdomains"
            :key="`subdomain_${subdomain.id}`"
            :value="subdomain.subdomain"
            :selected="selectedSubdomains.includes(subdomain.subdomain)"
          >
            {{ subdomain.subdomain }}
          </option>
        </pep-pharos-multiselect-dropdown>

        <div class="notifications-modal__form-field notifications-modal__date-picker">
          <DatePicker
            :key="`datepicker_${props.notification?.id || 'new'}`"
            :initial-dates="dates"
            @selected:dates="(d: Array<Date>) => (dates = d)"
          />
          <p v-if="invalidDates">
            <span class="notifications-modal__text--error">{{ invalidDatesMessage }}</span>
          </p>
        </div>
        <pep-pharos-radio-group
          required
          class="notifications-modal__form-field notifications-modal__radio-group"
          :invalidated="invalidStatus"
          :message="invalidStatus ? invalidStatusMessage : ''"
          :value="selectedStatus"
          data-cy="notifications-status-group"
        >
          <span slot="legend">Notification Type</span>
          <div class="notifications-modal__radio-buttons">
            <pep-pharos-radio-button
              v-for="(option, index) in statusOptions"
              :key="`status_${index}`"
              :value="option!.value"
              :checked="option!.value === selectedStatus"
              :data-cy="`notifications-status-option-${option!.value}`"
              @input="selectedStatus = option!.value"
            >
              <span slot="label">
                <span class="notifications-modal__radio-label-container">
                  <span class="notifications-modal__radio-label">{{ option!.label }}</span>
                  <pep-pharos-icon
                    class="notifications-modal__radio-icon"
                    name="question-inverse"
                    a11y-title="Hover over to see notification type description"
                    a11y-hidden="false"
                    role="button"
                    tabindex="0"
                    :aria-describedby="`notification-type-tooltip-${option!.value}`"
                    :data-tooltip-id="`notification-type-tooltip-${option!.value}`"
                  >
                  </pep-pharos-icon>
                  <pep-pharos-tooltip
                    :id="`notification-type-tooltip-${option!.value}`"
                    class="notifications-modal__radio-tooltip"
                    placement="top"
                  >
                    {{ option!.tooltip }}
                  </pep-pharos-tooltip>
                </span>
              </span>
            </pep-pharos-radio-button>
          </div>
        </pep-pharos-radio-group>

        <div class="notifications-modal__preview">
          <pep-pharos-heading class="mb-2 pb-0" preset="legend" :level="3">
            Preview
          </pep-pharos-heading>
          <div v-if="notificationText && selectedStatus">
            <pep-pharos-alert :status="selectedStatus" :closable="false">
              <p>{{ notificationText }}</p>
            </pep-pharos-alert>
          </div>
          <div v-else class="notifications-modal__preview-placeholder">
            <p>Enter a message and select a notification type to preview</p>
          </div>
        </div>
      </form>

      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <pep-pharos-button slot="footer" data-cy="notifications-submit" @click="handleSubmit">
        Submit
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>

<style lang="scss" scoped>
.notifications-modal {
  &__description {
    margin-bottom: var(--pharos-spacing-2-x);
  }
  &__form-field {
    margin-bottom: var(--pharos-spacing-2-x);
  }
  &__radio-group {
    width: 100%;
  }
  &__radio-label-container {
    display: flex;
    align-items: center;
  }
  &__radio-label {
    text-transform: capitalize;
  }
  &__radio-buttons {
    display: grid;
    grid-template-columns: repeat(2, 100%);
    @media (width <= 570px) {
      grid-template-columns: repeat(1, 100%);
    }
    row-gap: var(--pharos-spacing-one-half-x);
  }
  &__radio-icon {
    margin-left: var(--pharos-spacing-one-quarter-x);
  }
  &__preview-placeholder {
    padding: var(--pharos-spacing-1-x) 0;
    text-align: center;
    border: 3px dashed var(--pharos-color-marble-gray-80);
  }
  &__text {
    &--error {
      color: var(--pharos-color-living-coral-53);
    }
  }
}
</style>
