<script setup lang="ts">
import jstorLogo from '@/assets/images/jstor-red-on-white.svg'
import { useLogger } from '@/composables/logging/useLogger'

defineProps({
  isBigLogo: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['logo-click'])

const handleLogoClick = () => {
  emit('logo-click')
}

const { handleWithLog, logs } = useLogger()
const { jstorLogoClickLog } = logs.getJstorLogoLogs()
</script>

<template>
  <pep-pharos-link
    id="jstor-logo"
    slot="top"
    @click.prevent.stop="handleWithLog(jstorLogoClickLog, handleLogoClick)"
  >
    <img
      :class="['jstor-logo-img', { 'jstor-logo-img-big': isBigLogo }]"
      alt="Jstor Logo"
      data-cy="home"
      :src="jstorLogo"
    />
  </pep-pharos-link>
</template>

<style scoped>
.jstor-logo-img {
  height: var(--pharos-spacing-2-x);
  transition: height 0.3s ease-in-out;
}

.jstor-logo-img-big {
  height: 84px; /* Magic number for logo sizing in this case only*/
}
</style>
