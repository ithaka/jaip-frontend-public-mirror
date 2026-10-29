<script setup lang="ts">
import { defaultLocaleDateRangeString, normalizeDates, setStartDate } from '@/utils/dates'
import type { PropType } from 'vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Entity } from '@/interfaces/Entities'
import { RequestPermissionStatus } from '@/interfaces/Entities'
import { useCoreStore } from '@/stores/core'
import { changeRoute, getRequestPermissionStatus } from '@/utils/helpers'
import ModalSheet from '@/components/popups/ModalSheet.vue'
import DatePicker from '@/components/DatePicker.vue'

const props = defineProps({
  entity: {
    type: Object as PropType<Entity>,
    required: true,
  },
})

const emit = defineEmits(['update'])
const coreStore = useCoreStore()

const router = useRouter()
const handleLinkNavigation = (path: string) => {
  changeRoute(router, {
    path,
    term: '',
    page: 1,
    includeSearchQuery: false,
  })
}

/**
 * Turn on, turn off, and pause requests modal state and handlers.
 */
const showTurnOnRequestsModal = ref(false)
const showTurnOffRequestsModal = ref(false)
const showPauseRequestsModal = ref(false)
const pauseRequestsContent = ref<HTMLElement | null>(null)
const pauseDates = ref<Date[]>(normalizeDates([new Date()]))
const openPauseRequestsModal = () => {
  const permissions = props.entity.request_permissions
  pauseDates.value = permissions?.end_date
    ? normalizeDates([new Date(permissions.start_date), new Date(permissions.end_date)])
    : []
  showPauseRequestsModal.value = true
}
const turnOffRequestsPage = ref<0 | 1>(0)
const turnOffRequestsTitles = ['Turn off requests', 'Turn off and delete requests.']

/**
 * Opens the turn off requests modal and resets the page to the first step.
 *
 * @returns void
 */
const openTurnOffRequestsModal = () => {
  turnOffRequestsPage.value = 0
  showTurnOffRequestsModal.value = true
}

/**
 * Holds the computed status of the request permissions for the entity.
 *
 * @returns The status of the request permissions ("on", "scheduled", "paused", "off").
 */
const requestPermissionStatus = computed(() =>
  getRequestPermissionStatus(props.entity.request_permissions),
)

const isLoading = ref(false)
/**
 * Determines if the user can pause requests based on the selected dates and minimum date constraints.

 * @returns A boolean indicating whether the user can pause requests.
 */
const canPauseRequests = computed(() => {
  const [startDate, endDate] = pauseDates.value
  return Boolean(startDate && endDate && endDate >= startDate && endDate >= new Date())
})

const pauseRequests = async () => {
  if (!canPauseRequests.value || isLoading.value) return
  try {
    isLoading.value = true
    const [startDate, endDate] = normalizeDates(pauseDates.value)
    const payload = {
      facility_id: props.entity.id!,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    }
    if (props.entity.request_permissions) {
      await coreStore.$api.request_management.edit(payload)
    } else {
      await coreStore.$api.request_management.add(payload)
    }
    showPauseRequestsModal.value = false
    emit('update')
  } catch {
    coreStore.toast(
      `We were unable to pause requests. Please try again and if the issue persists, contact ${coreStore.supportEmailDisplay}.`,
      'error',
    )
  } finally {
    isLoading.value = false
  }
}
const turnRequestsBackOn = async () => {
  try {
    isLoading.value = true
    showTurnOnRequestsModal.value = false
    await coreStore.$api.request_management.remove(props.entity.id!)
    emit('update')
  } catch {
    coreStore.toast(
      `We were unable to turn requests back on. Please try again and if the issue persists, contact ${coreStore.supportEmailDisplay}.`,
      'error',
      8000,
    )
  } finally {
    isLoading.value = false
  }
}

/**
 * Turns off requests for the entity by setting the start date to the current date and the end date to null.
 *
 * @returns A promise that resolves when the requests have been successfully turned off.
 */
const turnRequestsOff = async () => {
  try {
    isLoading.value = true
    showTurnOffRequestsModal.value = false
    const startDate = setStartDate(new Date())
    await coreStore.$api.request_management.add({
      facility_id: props.entity.id!,
      start_date: startDate.toISOString(),
      end_date: null,
    })
    emit('update')
  } catch {
    coreStore.toast(
      `We were unable to turn requests off. Please try again and if the issue persists, contact ${coreStore.supportEmailDisplay}.`,
      'error',
      8000,
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="request-permissions">
    <div>
      <pep-pharos-heading class="request-permissions__heading" preset="legend" :level="3">
        Requests
      </pep-pharos-heading>
      <p class="request-permissions__description">
        Allow a user to submit requests for access to items on JSTOR.
      </p>
      <div class="request-permissions__status">
        <pep-pharos-pill
          v-if="
            requestPermissionStatus === RequestPermissionStatus.On ||
            requestPermissionStatus === RequestPermissionStatus.Scheduled
          "
          preset="5"
          icon-left="checkmark"
          class="request-permissions__status-pill"
          >On</pep-pharos-pill
        >
        <pep-pharos-pill
          v-if="requestPermissionStatus === RequestPermissionStatus.Scheduled"
          preset="8"
          icon-left="calendar"
          class="request-permissions__status-pill"
          >Scheduled</pep-pharos-pill
        >
        <span
          v-if="requestPermissionStatus === RequestPermissionStatus.Scheduled"
          class="request-permissions__status--scheduled"
        >
          Scheduled to pause
          {{
            defaultLocaleDateRangeString(
              new Date(entity.request_permissions!.start_date),
              new Date(entity.request_permissions!.end_date!),
            )
          }}
        </span>
        <div
          v-else-if="requestPermissionStatus === RequestPermissionStatus.Paused"
          class="request-permissions__paused-status"
        >
          <pep-pharos-pill preset="7" icon-left="pause" class="request-permissions__status-pill"
            >Paused</pep-pharos-pill
          >
          <span class="request-permissions__status--paused">
            Paused
            {{
              defaultLocaleDateRangeString(
                new Date(entity.request_permissions!.start_date),
                new Date(entity.request_permissions!.end_date!),
              )
            }}
          </span>
        </div>
        <pep-pharos-pill
          v-else-if="requestPermissionStatus === RequestPermissionStatus.Off"
          preset="3"
          icon-left="disable"
          class="request-permissions__status-pill"
          >Off</pep-pharos-pill
        >
      </div>
    </div>
    <div class="request-permissions__controls">
      <div class="request-permissions__buttons">
        <pep-pharos-button
          v-if="
            [RequestPermissionStatus.On, RequestPermissionStatus.Scheduled].includes(
              requestPermissionStatus,
            )
          "
          class="request-permissions__button"
          variant="secondary"
          full-width
          :icon-left="
            requestPermissionStatus === RequestPermissionStatus.Scheduled ? 'edit' : 'pause'
          "
          @click="openPauseRequestsModal"
        >
          {{
            requestPermissionStatus === RequestPermissionStatus.Scheduled
              ? 'Edit pause request'
              : 'Pause requests'
          }}
        </pep-pharos-button>
        <pep-pharos-button
          v-if="requestPermissionStatus === RequestPermissionStatus.Off"
          class="request-permissions__button"
          variant="secondary"
          icon-left="history"
          full-width
          @click="showTurnOnRequestsModal = true"
        >
          Turn back on
        </pep-pharos-button>
        <pep-pharos-button
          v-if="requestPermissionStatus === RequestPermissionStatus.Paused"
          class="request-permissions__button"
          variant="secondary"
          icon-left="history"
          full-width
          @click="showTurnOnRequestsModal = true"
        >
          Resume early
        </pep-pharos-button>
        <pep-pharos-button
          v-if="
            [RequestPermissionStatus.On, RequestPermissionStatus.Scheduled].includes(
              requestPermissionStatus,
            )
          "
          class="request-permissions__button"
          variant="subtle"
          icon-left="disable"
          full-width
          @click="openTurnOffRequestsModal"
        >
          Turn off requests
        </pep-pharos-button>
      </div>
      <p class="request-permissions__note">
        You will be asked to confirm before requests settings are changed.
      </p>
    </div>
  </div>
  <ModalSheet
    :id="`pause-requests-${props.entity.id}`"
    header="Pause requests"
    size="medium"
    :min-height="600"
    :open="showPauseRequestsModal"
    :has-close="true"
    :expanded="true"
    @close="showPauseRequestsModal = false"
  >
    <div
      :id="`pause-requests-content-${props.entity.id}`"
      ref="pauseRequestsContent"
      class="request-permissions__confirmation"
    >
      <div class="mb-5">
        <DatePicker
          v-if="pauseRequestsContent"
          :initial-dates="pauseDates"
          :include-all="false"
          label="Pause requests"
          :trigger-id="`pause-requests-datepicker-${props.entity.id}`"
          required
          :teleport="`#pause-requests-content-${props.entity.id}`"
          @selected-dates="(dates: Date[]) => (pauseDates = dates)"
        />
        <p class="request-permissions__resume-message">
          Requests will automatically resume after this date.
        </p>
      </div>
      <div class="request-permissions__what-to-expect">
        <strong>What to expect:</strong>
        <ul class="request-permissions__list">
          <li>Users will be unable to submit new requests immediately</li>
          <li>
            You can continue to
            <pep-pharos-link href="/requests" @click.prevent="handleLinkNavigation('/requests')">
              review pending requests
            </pep-pharos-link>
          </li>
          <li>Resume any time before the pause duration</li>
        </ul>
      </div>
      <div class="request-permissions__preview-message">
        <strong>Preview message for users:</strong>
        <pep-pharos-alert status="warning" class="request-permissions__alert-preview">
          Requests will be paused at {{ props.entity.name }}
          {{ defaultLocaleDateRangeString(pauseDates[0], pauseDates[1]) }}. In the meantime, browse
          and read available material.
        </pep-pharos-alert>
        <p class="request-permissions__resume-message">
          Note: You can create custom messages using
          <pep-pharos-link
            href="/notifications"
            @click.prevent="handleLinkNavigation('/notifications')"
            >notifications</pep-pharos-link
          >.
        </p>
      </div>
      <div class="request-permissions__confirmation-actions">
        <pep-pharos-button variant="secondary" @click="showPauseRequestsModal = false">
          Cancel
        </pep-pharos-button>
        <pep-pharos-button
          variant="primary"
          :disabled="!canPauseRequests || isLoading"
          @click="pauseRequests"
        >
          Pause requests
        </pep-pharos-button>
      </div>
    </div>
  </ModalSheet>
  <ModalSheet
    :id="`turn-off-requests-${props.entity.id}`"
    :header="turnOffRequestsTitles[turnOffRequestsPage]"
    size="medium"
    :min-height="600"
    :open="showTurnOffRequestsModal"
    :has-close="true"
    :expanded="true"
    @close="showTurnOffRequestsModal = false"
  >
    <div class="request-permissions__confirmation">
      <template v-if="turnOffRequestsPage === 0">
        <p class="request-permissions__description">
          Users will be unable to request JSTOR items beyond what is already available at
          <strong>{{ props.entity.name }}</strong
          >.
        </p>
        <div class="request-permissions__what-to-expect">
          <strong>What to expect:</strong>
          <ul class="request-permissions__list">
            <li>Users will immediately be unable to submit new requests</li>
            <li>
              You can continue to
              <pep-pharos-link href="/requests" @click.prevent="handleLinkNavigation('/requests')"
                >review pending requests</pep-pharos-link
              >
            </li>
          </ul>
        </div>
      </template>
      <div>
        <template v-if="turnOffRequestsPage === 1">
          <p class="request-permissions__description">
            This action will clear and archive all pending requests at
            <strong>{{ props.entity.name }}</strong
            >. This will not impact the status of any previously reviewed requests.
          </p>
        </template>
        <div class="request-permissions__confirmation-actions">
          <pep-pharos-button
            v-if="turnOffRequestsPage === 1"
            variant="subtle"
            class="request-permissions__confirmation-back"
            @click="turnOffRequestsPage = 0"
          >
            Back
          </pep-pharos-button>
          <pep-pharos-button variant="secondary" @click="showTurnOffRequestsModal = false">
            Cancel
          </pep-pharos-button>
          <pep-pharos-button
            v-if="turnOffRequestsPage === 0"
            variant="primary"
            :disabled="isLoading"
            @click="turnOffRequestsPage = 1"
          >
            Next
          </pep-pharos-button>
          <pep-pharos-button
            v-else
            :disabled="isLoading"
            variant="primary"
            @click="turnRequestsOff"
          >
            Turn off and delete requests
          </pep-pharos-button>
        </div>
      </div>
    </div>
  </ModalSheet>
  <ModalSheet
    :id="`turn-on-requests-${props.entity.id}`"
    :header="`Turn on requests`"
    size="medium"
    :min-height="600"
    :open="showTurnOnRequestsModal"
    :has-close="true"
    :expanded="true"
    @close="showTurnOnRequestsModal = false"
  >
    <div class="request-permissions__confirmation">
      <p>
        This action will immediately enable users to make requests at
        <strong>{{ props.entity.name }}</strong
        >.
      </p>
      <div class="request-permissions__confirmation-actions">
        <pep-pharos-button variant="secondary" @click="showTurnOnRequestsModal = false">
          Cancel
        </pep-pharos-button>
        <pep-pharos-button :disabled="isLoading" variant="primary" @click="turnRequestsBackOn">
          Turn requests on
        </pep-pharos-button>
      </div>
    </div>
  </ModalSheet>
</template>

<style scoped lang="scss">
.request-permissions {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pharos-spacing-1-x);
  border: 1px solid var(--pharos-color-marble-gray-80);
  border-radius: 0.25rem;
  margin-top: var(--pharos-spacing-one-and-a-half-x);
  margin-bottom: var(--pharos-spacing-one-and-a-half-x);
  padding: var(--pharos-spacing-1-x);

  &__confirmation {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  &__confirmation-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--pharos-spacing-one-half-x);
    margin-top: auto;
    padding-top: var(--pharos-spacing-2-x);
  }
  &__confirmation-back {
    margin-right: auto;
  }

  @media screen and (min-width: 48rem) {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }

  &__description {
    margin-bottom: var(--pharos-spacing-one-half-x);
  }
  &__confirmation > &__description {
    margin-bottom: var(--pharos-spacing-2-x);
  }
  &__resume-message {
    font-size: var(--pharos-font-size-small);
    color: var(--pharos-color-marble-gray-30);
  }
  &__what-to-expect {
    margin-top: 0;
  }
  &__preview-message {
    margin-top: var(--pharos-spacing-1-x);
  }
  &__alert-preview {
    margin: var(--pharos-spacing-one-half-x) 0;
  }
  &__controls {
    width: fit-content;
    max-width: 100%;
    justify-self: start;
    gap: var(--pharos-spacing-one-quarter-x);

    @media screen and (min-width: 48rem) {
      justify-self: end;
    }
  }
  &__buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    justify-items: start;
    gap: var(--pharos-spacing-one-quarter-x);

    @media screen and (min-width: 48rem) {
      grid-template-columns: minmax(0, 1fr);
      justify-items: end;
    }
  }
  &__button {
    margin-bottom: var(--pharos-spacing-one-quarter-x);
  }
  &__list {
    list-style-type: disc;
    padding-left: var(--pharos-spacing-one-and-a-half-x);
  }
  &__status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--pharos-spacing-one-half-x);
    margin-bottom: var(--pharos-spacing-1-x);

    @media screen and (min-width: 48rem) {
      margin-bottom: var(--pharos-spacing-one-quarter-x);
    }
    &--scheduled {
      color: hsl(243, 84%, 64%);
    }
    &--paused {
      color: #036eda;
    }
  }
  &__paused-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--pharos-spacing-one-half-x);
    min-width: 0;
    max-width: 100%;
  }
  &__status--scheduled,
  &__status--paused {
    flex: 1 1 12rem;
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  &__heading {
    margin-bottom: var(--pharos-spacing-one-x);
  }
  &__note {
    width: 0;
    min-width: 100%;
    font-size: var(--pharos-font-size-small);
    color: var(--pharos-color-marble-gray-30);
  }
}
</style>
