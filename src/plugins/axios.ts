// axios.ts

import axios from 'axios'
import type { App } from 'vue'
import type { AxiosInstance } from 'axios'
import api from '@/config/api'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { useBaseURL } from '@/composables/urls'

export default {
  install: (app: App) => {
    const coreStore = useCoreStore()
    const { $api } = storeToRefs(coreStore)
    // This creates the axios instance that the app will use.
    const baseURL = useBaseURL()

    app.config.globalProperties.$axios = axios.create({
      headers: {
        Accept: 'text/plain, application/json',
      },
      baseURL,
      withCredentials: true,
    })

    // This adds the api routes to the global properties so we can manage it entirely from one file
    app.config.globalProperties.$api = api(app.config.globalProperties.$axios as AxiosInstance)

    $api.value = app.config.globalProperties.$api
  },
}
