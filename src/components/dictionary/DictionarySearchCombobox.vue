<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import { changeRoute } from '@/utils/helpers'

const props = withDefaults(
  defineProps<{
    initialValue?: string
    placeholder?: string
  }>(),
  {
    initialValue: '',
    placeholder: 'Search dictionary',
  },
)

const router = useRouter()
const typedValue = ref(props.initialValue)
const suggestedOptions = ref<string[]>([])
const latestRequestId = ref(0)
const dictionaryCombobox = ref<HTMLElement | null>(null)
let shadowOptionObserver: MutationObserver | null = null

// TODO: Replace with actual dictionary API results when endpoint is available.
const exampleAWords = [
  'abacus',
  'abalone',
  'abandon',
  'abbey',
  'ability',
  'abject',
  'ablaze',
  'abnormal',
  'aboard',
  'abode',
  'abound',
]

const getDictionaryResults = async (query: string): Promise<string[]> => {
  console.log('Fetching dictionary results for query:', query)
  return Promise.resolve(exampleAWords)
}

const updateSuggestions = async (query: string) => {
  const requestId = ++latestRequestId.value
  const results = await getDictionaryResults(query)
  if (requestId !== latestRequestId.value) {
    return
  }
  suggestedOptions.value = results
}

const handleComboboxInput = (e: InputFileEvent) => {
  typedValue.value = e.target.value || ''
  void updateSuggestions(typedValue.value)
}

const handleTermSubmit = () => {
  const term = typedValue.value.trim()
  if (!term) {
    return
  }

  changeRoute(
    router,
    undefined,
    `/dictionary/${encodeURIComponent(term)}`,
    '',
    1,
    undefined,
    undefined,
    {
      includeSearchQuery: false,
      closeOnNavigate: false,
    },
  )
}

const handleComboboxChange = () => {
  const comboboxValue = (dictionaryCombobox.value as { value?: string } | null)?.value || ''
  typedValue.value = comboboxValue
  void updateSuggestions(typedValue.value)
  handleTermSubmit()
}

const styleFirstShadowOption = () => {
  const shadowRoot = dictionaryCombobox.value?.shadowRoot
  const options = shadowRoot?.querySelectorAll('.combobox__option')
  options?.forEach((option, index) => {
    option.classList.toggle('dictionary-search-combobox__shadow-option--first', index === 0)
  })
  const firstOption = shadowRoot?.querySelector('.combobox__option') as HTMLElement | null
  if (firstOption) {
    firstOption.style.backgroundColor = 'var(--pharos-color-marble-gray-94)'
  }
}

const ensureShadowFirstOptionStyle = (shadowRoot: ShadowRoot) => {
  if (shadowRoot.querySelector('[data-dictionary-first-option-style]')) {
    return
  }

  const style = document.createElement('style')
  style.setAttribute('data-dictionary-first-option-style', 'true')
  style.textContent = `
    .dictionary-search-combobox__shadow-option--first::before {
      content: "Just search for: ";
    }

    .search__button {
      background-color: #fff;
    }
  `
  shadowRoot.appendChild(style)
}

const connectShadowOptionStyling = async () => {
  await nextTick()
  const shadowRoot = dictionaryCombobox.value?.shadowRoot
  if (!shadowRoot) {
    requestAnimationFrame(() => {
      void connectShadowOptionStyling()
    })
    return
  }

  ensureShadowFirstOptionStyle(shadowRoot)
  styleFirstShadowOption()
  shadowOptionObserver = new MutationObserver(() => {
    styleFirstShadowOption()
  })
  shadowOptionObserver.observe(shadowRoot, { childList: true, subtree: true })
}

const optionList = computed(() => {
  const query = typedValue.value.trim()
  return [query, ...suggestedOptions.value]
})

watch(
  () => props.initialValue,
  (value) => {
    typedValue.value = value
    void updateSuggestions(value)
  },
)

onMounted(() => {
  void updateSuggestions(typedValue.value)
  void connectShadowOptionStyling()
})

onBeforeUnmount(() => {
  shadowOptionObserver?.disconnect()
})
</script>

<template>
  <div class="dictionary-search-combobox">
    <pep-pharos-combobox
      ref="dictionaryCombobox"
      :value="typedValue"
      :placeholder="placeholder"
      message=""
      search-mode=""
      @input="handleComboboxInput"
      @change="handleComboboxChange"
    >
      <option
        v-for="(option, index) in optionList"
        :key="`dictionary_option_${index}`"
        :value="option"
      >
        {{ option }}
      </option>
    </pep-pharos-combobox>
  </div>
</template>

<style scoped lang="scss">
.dictionary-search-combobox {
  display: block;
  width: 100%;
}
</style>
