// axios.ts

import axios, { AxiosError } from 'axios'
import type { App } from 'vue'
import type { AxiosInstance, AxiosResponse } from 'axios'
import api from '@/config/api'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'
import { useBaseURL } from '@/composables/urls'
import { useLogger } from '@/composables/logging/useLogger'
import { generics } from '@/composables/logging/categories/generic'

export default {
  install: (app: App) => {
    const coreStore = useCoreStore()
    const { $api } = storeToRefs(coreStore)
    // This creates the axios instance that the app will use.
    const baseURL = useBaseURL()

    const { handleWithLog } = useLogger()

    app.config.globalProperties.$axios = axios.create({
      headers: {
        Accept: 'text/plain, application/json',
      },
      baseURL,
      withCredentials: true,
    })

    // Global error handler for axios that logs any error response.
    app.config.globalProperties.$axios.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response && error.response.config && error.message) {
          const endpoint = error.response.config?.url || 'Unknown endpoint'
          const message = error.message || 'Unknown error'
          const code = error.response.status || 0
          handleWithLog(() =>
            generics.api_error({ message, endpoint: endpoint, code: code.toString() }),
          )
        }
        return Promise.reject(error)
      },
    )

    // This adds the api routes to the global properties so we can manage it entirely from one file
    app.config.globalProperties.$api = api(app.config.globalProperties.$axios as AxiosInstance)
    $api.value = app.config.globalProperties.$api
  },
}
