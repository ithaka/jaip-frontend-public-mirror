// axios.ts

import type { App } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import '@/assets/datepicker.css'

export default {
  install: (app: App) => {
    app.component('VueDatePicker', VueDatePicker)
  }
}
