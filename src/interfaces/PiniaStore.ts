import type ApiObject from '@/interfaces/ApiObject'
import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    // you can define simpler values too
    $api: ApiObject
  }
}
