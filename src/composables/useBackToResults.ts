import { useRouter } from 'vue-router'

const RESULTS_ROUTE_NAMES = ['search', 'requests']

/**
 * Lets a page offer a way back to the search or requests results it was opened from.
 *
 * The router records the entry the user came from in the history state, so this only finds a
 * location when they arrived by navigating within the app. A stable link, a bookmark, or a link
 * opened in a new tab has nothing to go back to, and `resultsHref` is undefined.
 */
export const useBackToResults = () => {
  const router = useRouter()

  const previous = router.options.history.state.back
  const previousRoute = typeof previous === 'string' ? router.resolve(previous) : undefined
  const resultsHref =
    previousRoute && RESULTS_ROUTE_NAMES.includes(String(previousRoute.name))
      ? previousRoute.href
      : undefined

  // Going back one entry, rather than pushing the results location again, keeps the browser's
  // history in step with what the user sees.
  const goBackToResults = () => router.back()

  return { resultsHref, goBackToResults }
}
