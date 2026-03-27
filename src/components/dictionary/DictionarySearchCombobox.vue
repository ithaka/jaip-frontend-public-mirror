<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type InputFileEvent from '@/interfaces/Events/InputEvent'
import { changeRoute } from '@/utils/helpers'
import { useCoreStore } from '@/stores/core'

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

const coreStore = useCoreStore()

const router = useRouter()
const typedValue = ref(props.initialValue)
const suggestedOptions = ref<string[]>([])
const latestRequestId = ref(0)
const dictionaryCombobox = ref<HTMLElement | null>(null)
let shadowOptionObserver: MutationObserver | null = null

const getDictionaryResults = async (query: string): Promise<string[]> => {
  if (query.trim().length < 3) {
    return []
  }
  const results = await coreStore.$api.dictionary.headwordSearch(query)
  return results.data
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

  // Remove the search term from the combobox after submission
  typedValue.value = ''
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
  dictionaryCombobox.value?.blur()
}

const handleComboboxChange = () => {
  const comboboxValue = (dictionaryCombobox.value as { value?: string } | null)?.value || ''
  // The combobox component emits a change event on blur, but we don't actually want to submit
  // a search if the user hasn't changed the value from the initial value.
  if (
    comboboxValue.trim() === typedValue.value.trim() &&
    typedValue.value.trim() === props.initialValue.trim()
  ) {
    return
  }
  typedValue.value = comboboxValue
  void updateSuggestions(typedValue.value)
  handleTermSubmit()
}

const styleFirstShadowOption = () => {
  const shadowRoot = dictionaryCombobox.value?.shadowRoot
  const options = shadowRoot?.querySelectorAll('.combobox__option')
  options?.forEach((option, index) => {
    option.classList.add('dictionary-search-combobox__shadow-option')
    option.classList.toggle('dictionary-search-combobox__shadow-option--first', index === 0)
  })
}

const ensureShadowFirstOptionStyle = (shadowRoot: ShadowRoot) => {
  if (shadowRoot.querySelector('[data-dictionary-option-styles]')) {
    return
  }

  const style = document.createElement('style')
  style.setAttribute('data-dictionary-option-styles', 'true')
  style.textContent = `
    .dictionary-search-combobox__shadow-option--first::before {
      content: "Just search for: ";
    }
    .dictionary-search-combobox__shadow-option--first{
      background-color: var(--pharos-color-marble-gray-94) !important;
    }
    .dictionary-search-combobox__shadow-option {
      padding: var(--pharos-spacing-three-quarters-x) !important;
      font-weight: normal !important;
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
  if (query.length === 0) {
    return []
  }

  // We remove the typed query from the suggestions to avoid duplication while still placing the matching
  // word first in the list.
  return [query, ...suggestedOptions.value.filter((option) => option !== query)]
})

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
