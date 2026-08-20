import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref } from 'vue'

enum Breakpoint {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  XLarge = 'xlarge',
  Max = 'max',
}

const breakpoints: Record<Breakpoint, string> = {
  [Breakpoint.Small]: '22.5rem', // 360px
  [Breakpoint.Medium]: '48rem', // 768px
  [Breakpoint.Large]: '66rem', // 1056px
  [Breakpoint.XLarge]: '85rem', // 1360px
  [Breakpoint.Max]: '99rem', // 1584px
}

// Returns a reactive boolean that reflects whether the given media query currently matches.
const useMediaQuery = (query: string): Ref<boolean> => {
  const matches = ref(false)
  const mediaQuery = window.matchMedia(query)
  const update = (event: MediaQueryList | MediaQueryListEvent) => {
    matches.value = event.matches
  }

  onMounted(() => {
    update(mediaQuery)
    mediaQuery.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', update)
  })

  return matches
}

// The reactive flags exposed for the current viewport width.
export interface Breakpoints {
  // Exclusive size flags: exactly one is true at a time.
  isXsmall: ComputedRef<boolean>
  isSmall: ComputedRef<boolean>
  isMedium: ComputedRef<boolean>
  isLarge: ComputedRef<boolean>
  isXlarge: ComputedRef<boolean>
  isMax: ComputedRef<boolean>
  // "At most" flags: true for the named size or anything smaller.
  atMostSmall: ComputedRef<boolean>
  atMostMedium: ComputedRef<boolean>
  atMostLarge: ComputedRef<boolean>
  atMostXlarge: ComputedRef<boolean>
}

export const useBreakpoints = (): Breakpoints => {
  const atLeastSmall = useMediaQuery(`(min-width: ${breakpoints[Breakpoint.Small]})`)
  const atLeastMedium = useMediaQuery(`(min-width: ${breakpoints[Breakpoint.Medium]})`)
  const atLeastLarge = useMediaQuery(`(min-width: ${breakpoints[Breakpoint.Large]})`)
  const atLeastXLarge = useMediaQuery(`(min-width: ${breakpoints[Breakpoint.XLarge]})`)
  const atLeastMax = useMediaQuery(`(min-width: ${breakpoints[Breakpoint.Max]})`)

  return {
    isXsmall: computed(() => !atLeastSmall.value),
    isSmall: computed(() => atLeastSmall.value && !atLeastMedium.value),
    isMedium: computed(() => atLeastMedium.value && !atLeastLarge.value),
    isLarge: computed(() => atLeastLarge.value && !atLeastXLarge.value),
    isXlarge: computed(() => atLeastXLarge.value && !atLeastMax.value),
    isMax: computed(() => atLeastMax.value),

    atMostSmall: computed(() => !atLeastMedium.value),
    atMostMedium: computed(() => !atLeastLarge.value),
    atMostLarge: computed(() => !atLeastXLarge.value),
    atMostXlarge: computed(() => !atLeastMax.value),
  }
}
