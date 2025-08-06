// axios.ts

import axios from 'axios'
import type { App } from 'vue'
import type { AxiosInstance } from 'axios'
import api from '@/config/api'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

export default {
  install: (app: App) => {
    const coreStore = useCoreStore()
    const { isEphemeralAdmin, isEphemeralStudent, $api, baseTestURL, baseAdminURL } =
      storeToRefs(coreStore)
    // This creates the axios instance that the app will use.
    let baseURL = `${window.location.protocol}//${window.location.host}`
    if (isEphemeralAdmin.value) {
      baseURL = baseAdminURL.value
    } else if (isEphemeralStudent.value) {
      baseURL = baseTestURL.value
    }

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
