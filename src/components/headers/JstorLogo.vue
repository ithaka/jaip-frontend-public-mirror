<script setup lang="ts">
import jstorLogo from '@/assets/images/jstor-red-on-white.svg'

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
</script>

<template>
  <pep-pharos-link id="jstor-logo" slot="top" @click.prevent.stop="handleLogoClick">
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
