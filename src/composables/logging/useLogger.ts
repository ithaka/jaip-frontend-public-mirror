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
