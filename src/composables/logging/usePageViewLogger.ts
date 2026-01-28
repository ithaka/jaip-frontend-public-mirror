import { useLogger } from '@/composables/logging/useLogger'
import { onBeforeUnmount, onMounted } from 'vue'

// A composable to log page view and exit events. This will automatically log
// page landing and exit events when the logPageView function is called.
const usePageViewLogger = () => {
  const { handleWithLog, logs } = useLogger()
  const { landingLog, exitLog } = logs.getPageLandingLogs()

  const logPageView = () => {
    const uuid = crypto.randomUUID()
    onMounted(() => {
      handleWithLog(() => landingLog(uuid))
    })
    onBeforeUnmount(() => {
      handleWithLog(() => exitLog(uuid))
    })
  }

  return {
    logPageView,
  }
}

export { usePageViewLogger }
