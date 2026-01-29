<script setup lang="ts">
import { useUserStore } from '@/stores/user'

import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import type { PropType } from 'vue'
import type { MediaRecord } from '@/interfaces/MediaRecord'
import UnrestrictButton from '@/components/buttons/adminButtons/UnrestrictButton.vue'
import RestrictButton from '@/components/buttons/adminButtons/RestrictButton.vue'

const userStore = useUserStore()
const { enabledUngroupedFeatures } = storeToRefs(userStore)

const props = defineProps({
  doc: {
    type: Object as PropType<MediaRecord>,
    default: () => ({}),
  },
})

const hasRestrict = computed(
  () => enabledUngroupedFeatures.value['manage_restricted_list']?.enabled,
)
const showRestrict = computed(() => hasRestrict.value && !props.doc.is_restricted)
const showUnrestrict = computed(() => hasRestrict.value && props.doc.is_restricted)

const emit = defineEmits(['restrictSubmitted', 'close'])
</script>

<template>
  <RestrictButton
    v-if="showRestrict"
    :doc="doc"
    full-width
    @restrict-submitted="emit('restrictSubmitted')"
  />
  <UnrestrictButton
    v-if="showUnrestrict"
    :doc="doc"
    full-width
    @restrict-submitted="emit('restrictSubmitted')"
  />
</template>
