import { type WorkingLog, type FinalLog } from '@/interfaces/Log'
import { useCoreStore } from '@/stores/core'
import { getAncestorComponentNames } from '@/utils/helpers'
import { getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { logs } from '@/composables/logging/logEvents'

const useLogger = () => {
  // The core store provides access to the logging API
  const coreStore = useCoreStore()

  // The route and component instance provide context for the log, and can be
  // instantiated when the composable is used.
  const route = useRoute()

  // This provides access to the current component instance, but may not be available in all contexts.
  // It's only used here to get the component name for logging purposes, so it's not a catastrophic failure
  // if it's undefined.
  const componentInstance = getCurrentInstance()

  // Uses clientWidth/Height to get the dimensions.
  const getDocumentDimensions = (): { width: number; height: number } | undefined => {
    if (
      document &&
      document.documentElement &&
      document.documentElement.clientWidth &&
      document.documentElement.clientHeight
    ) {
      const width = Math.max(document.documentElement.clientWidth || 0)
      const height = Math.max(document.documentElement.clientHeight || 0)
      return { width, height }
    }
    return undefined
  }

  // Uses window.innerWidth/Height to get the dimensions.
  const getWindowDimensions = (): { width: number; height: number } | undefined => {
    if (window && window.innerWidth && window.innerHeight) {
      const width = Math.max(window.innerWidth || 0)
      const height = Math.max(window.innerHeight || 0)
      return { width, height }
    }
    return undefined
  }

  // Determine if the user has dark mode enabled in their OS/browser settings.
  const getIsDarkMode = (): boolean => {
    if (window && window.matchMedia) {
      return !!window.matchMedia('(prefers-color-scheme: dark)')
    }
    return false
  }

  // Enhance the WorkingLog with additional context information to create a FinalLog.
  const enhanceLog = (log: WorkingLog): FinalLog => {
    return {
      ...log,
      eventtype: `pep_fe_${log.eventtype}`,
      route_name: route.name,
      path: route.path,
      full_path: route.fullPath,
      query_params: route.query ? JSON.stringify(route.query) : undefined,
      component: componentInstance?.type.__name || 'AnonymousComponent',
      parents: getAncestorComponentNames(componentInstance),
      timestamp: new Date(),
      window_dimensions: getWindowDimensions(),
      document_dimensions: getDocumentDimensions(),
      is_dark_mode: getIsDarkMode(),
    }
  }

  // prepare and send the log to the logging API
  const sendLog = (log: WorkingLog) => {
    const finalLog = enhanceLog(log)
    coreStore.$api.log(finalLog)
    // console.log('Logging event:', finalLog)
  }

  // The log is passed in as a function so we can get Ref values at the time of logging.
  const handleWithLog = async (
    createLog: () => WorkingLog,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    cb: Function | undefined = undefined,
  ) => {
    // If a callback is provided, we execute it before sending the log. Otherwise,
    // just send the log.
    if (cb) {
      const returnValue = await cb()
      sendLog(createLog())
      return returnValue
    } else {
      sendLog(createLog())
    }
  }

  return {
    handleWithLog,
    logs,
  }
}

export { useLogger }
