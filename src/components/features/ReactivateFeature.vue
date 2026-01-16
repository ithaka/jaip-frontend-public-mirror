<script lang="ts" setup>
import { useCoreStore } from '@/stores/core'
import type { Feature } from '@/interfaces/Features'
import type { PropType } from 'vue'
import { useLogger } from '@/composables/logging/useLogger'

const coreStore = useCoreStore()

const props = defineProps({
  show: Boolean,
  feature: {
    type: Object as PropType<Feature>,
    required: true,
  },
  ungrouped: Boolean,
})

const emit = defineEmits(['close', 'submit'])
const submitForm = async () => {
  const type = props.ungrouped ? 'ungrouped' : 'basic'
  await coreStore.$api.auth.features[type].reactivate({ id: props.feature.id })

  emit('submit')
}

const { handleWithLog, logs } = useLogger()
const { submitReactivateFeatureLog, closeReactivateFeatureModalLog } =
  logs.getReactivateFeatureLogs({ featureId: props.feature.id })
</script>
<template>
  <Teleport to="div#app">
    <pep-pharos-modal
      :id="`reactivate-subdomain-modal-${props.feature.id}`"
      header="Reactivate Feature"
      :open="props.show"
      @pharos-modal-closed="handleWithLog(closeReactivateFeatureModalLog, () => emit('close'))"
    >
      <p slot="description" class="mb-3">
        Are you sure you want to reactivate {{ props.feature.display_name }}?
      </p>

      <pep-pharos-button slot="footer" variant="secondary" @click.prevent.stop="emit('close')">
        Cancel
      </pep-pharos-button>

      <pep-pharos-button
        slot="footer"
        @click.prevent.stop="handleWithLog(submitReactivateFeatureLog, submitForm)"
      >
        Submit
      </pep-pharos-button>
    </pep-pharos-modal>
  </Teleport>
</template>
