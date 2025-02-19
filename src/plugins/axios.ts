// axios.ts

import axios from 'axios'
import type { App } from 'vue'
import type { AxiosInstance } from 'axios'
import api from '@/config/api'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

export default {
  install: (app: App) => {
    // This creates the axios instance that the app will use.
    app.config.globalProperties.$axios = axios.create({
      headers: {
        Accept: 'text/plain, application/json',
      },
    })
    const coreStore = useCoreStore()

    // This adds the api routes to the global properties so we can manage it entirely from one file
    app.config.globalProperties.$api = api(app.config.globalProperties.$axios as AxiosInstance)

    const { $api } = storeToRefs(coreStore)
    $api.value = app.config.globalProperties.$api
  },
}
