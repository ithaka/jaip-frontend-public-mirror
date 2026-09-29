import '@ithaka/pharos/lib/styles/fonts.css'
import '@ithaka/pharos/lib/styles/typography.scss'
import '@/assets/main.scss'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'
import { initViewportUnitsPatch } from '@/utils/patchViewportUnits'
import { createApp } from 'vue'
import type { App } from 'vue'
import { createPinia, storeToRefs } from 'pinia'
import { setCookie } from 'typescript-cookie'
import ChartsVue from '@carbon/charts-vue'
import VueApp from '@/App.vue'
import pharos from '@/plugins/pharos'
import axios from '@/plugins/axios'
import datepicker from '@/plugins/datepicker'
import { useUserStore } from '@/stores/user'
import { useCoreStore } from '@/stores/core'
import { useFeaturesStore } from '@/stores/features'
import { useSearchStore } from './stores/search'
import createRouter from '@/router/createRouter'
import type { RouteLocationNormalized } from 'vue-router'
import { capitalize, parseGroupsQueryParam } from '@/utils/helpers'
import { useNotificationsStore } from './stores/notifications'
import { useLogger } from './composables/logging/useLogger'
import { initPDFViewerPolyfills } from '@/utils/polyfills'

// This needs to run before any web component definitions so that shadow DOM stylesheets
// get viewport units rewritten via the patched CSSStyleSheet.replaceSync.
initViewportUnitsPatch()
initPDFViewerPolyfills()

// After a new deploy, a tab left open on an old build will reference stale hashed chunk
// filenames that no longer exist; force a reload to pick up the current index.html.
// Guard against a reload loop if the new build still fails to load (e.g. CDN outage).
let hasReloadedForPreloadError = false
window.addEventListener('vite:preloadError', (event) => {
  // Log every hit (not just the first) so we can see how often this happens in prod and
  // spot a broken build vs. a normal post-deploy blip or a CDN issue.
  try {
    const { handleWithLog, logs } = useLogger()
    const { assetPreloadErrorLog } = logs.getBuildLogs()
    const err = event.payload instanceof Error ? event.payload : new Error(String(event.payload))
    handleWithLog(assetPreloadErrorLog({ err }))
  } catch (error) {
    console.error('Error handling vite:preloadError event:', error)
    console.error('Original event payload:', event.payload)
  }

  if (hasReloadedForPreloadError) {
    return
  }
  hasReloadedForPreloadError = true
  event.preventDefault()
  window.location.reload()
})

// Check for a new build every 15 minutes, on focus, and when the tab becomes visible again.
const versionCheckInterval = 15 * 60 * 1000
let isCheckingForNewVersion = false
let hasReloadedForNewVersion = false
let hasInitializedVersionChecks = false
let updatePending = false
let lastCheckAt = 0

/**
 * Check for a new build of the app by fetching the version.json file and comparing the build ID with the current build ID.
 * If a new build is detected, reload the page to load the latest version.
 *
 * @returns A promise that resolves when the version check is complete.
 */
const checkForNewVersion = async () => {
  // If we're already checking for a new version or have already reloaded for a new version, don't check again.
  const now = Date.now()
  // Focus and visibilitychange can fire together; throttle checks to one per minute.
  if (isCheckingForNewVersion || hasReloadedForNewVersion || now - lastCheckAt < 60000) {
    return
  }

  lastCheckAt = now
  // Set the flag to indicate that we're checking for a new version.
  isCheckingForNewVersion = true
  try {
    // We use a plain fetch rather than axios because axios is configured to use the base URL,
    // which may not be the same as the root of the app (particularly in ephemeral environments).
    // Because this file is served by nginx, rather than via the api, we need to fetch it from the root of the app.
    // The timestamp query parameter is added to prevent caching of the version.json file, ensuring that we always
    // get the latest version information. We also set cache: 'no-store' to ensure we get the latest version.json
    // file and not a cached version.
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    const { handleWithLog, logs } = useLogger()
    const { versionCheckLog } = logs.getBuildLogs()

    // If the response status is not 200, log the manifest as unavailable and return early.
    if (response.status !== 200) {
      handleWithLog(
        versionCheckLog({
          currentBuildId: __APP_BUILD_ID__,
          status: 'unavailable',
          reason: `Version manifest returned ${response.status}`,
        }),
      )
      return
    }

    // Check the content type of the response to ensure it's JSON. If not, log the manifest as invalid and return early.
    const contentType = String(response.headers.get('content-type') || '')
    if (!contentType.includes('application/json')) {
      handleWithLog(
        versionCheckLog({
          currentBuildId: __APP_BUILD_ID__,
          status: 'invalid_response',
          reason: `Version manifest returned ${contentType || 'unknown content type'}`,
        }),
      )
      return
    }

    // If the build ID in the version.json file is different from the current build ID, log the new version and reload the page.
    const versionInfo = await response.json()

    let attempted = ''
    try {
      attempted = sessionStorage.getItem('reloadedForBuildId') || ''
    } catch {
      // Ignore errors accessing sessionStorage, as it may not be available in some environments.
    }

    if (versionInfo.buildId === __APP_BUILD_ID__ && attempted === __APP_BUILD_ID__) {
      try {
        sessionStorage.removeItem('reloadedForBuildId')
      } catch {
        // Ignore errors accessing sessionStorage, as it may not be available in some environments.
      }
    }

    if (typeof versionInfo.buildId === 'string' && versionInfo.buildId !== __APP_BUILD_ID__) {
      if (attempted === versionInfo.buildId) {
        handleWithLog(
          versionCheckLog({
            currentBuildId: __APP_BUILD_ID__,
            latestBuildId: versionInfo.buildId,
            status: 'reload_failed',
            reason: 'Already reloaded for this build ID, but the new build is still not loading.',
          }),
        )
        hasReloadedForNewVersion = true
        return
      }
      try {
        sessionStorage.setItem('reloadedForBuildId', versionInfo.buildId)
        // Verify that the value was written correctly to sessionStorage. If not, throw an error to be caught below.
        if (sessionStorage.getItem('reloadedForBuildId') !== versionInfo.buildId) {
          throw new Error('Reload guard could not be verified after writing it.')
        }
      } catch (error) {
        handleWithLog(
          versionCheckLog({
            currentBuildId: __APP_BUILD_ID__,
            latestBuildId: versionInfo.buildId,
            status: 'unavailable',
            reason: `Could not persist reload guard: ${String(error)}`,
          }),
        )
        hasReloadedForNewVersion = true
        return
      }
      handleWithLog(
        versionCheckLog({
          currentBuildId: __APP_BUILD_ID__,
          latestBuildId: versionInfo.buildId,
          status: 'new_version',
        }),
      )
      hasReloadedForNewVersion = true
      updatePending = true
      if (document.hidden) {
        window.location.reload()
      }
    }
  } catch (error) {
    console.error('Error checking app version:', error)
  } finally {
    isCheckingForNewVersion = false
  }
}

const initializeVersionChecks = () => {
  // Guards against repeat initializations of the version check to avoid adding listeners repeatedly.
  if (hasInitializedVersionChecks) {
    return
  }

  hasInitializedVersionChecks = true
  checkForNewVersion()
  // Set up periodic checks for a new build every 15 minutes, on focus, and when the tab becomes visible again.
  window.setInterval(checkForNewVersion, versionCheckInterval)

  // Check for a new build when the window gains focus or when the tab becomes visible again.
  window.addEventListener('focus', checkForNewVersion)

  // Defer reloads while the page is visible so an update check cannot interrupt an active task.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && updatePending) {
      window.location.reload()
    } else if (!document.hidden) {
      checkForNewVersion()
    }
  })
}

function checkIfValidUUID(str: string) {
  // Regular expression to check if string is a valid UUID
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
  return regexExp.test(str)
}

function get_subdomain(host: string): string {
  const split_host = host.split('.')
  const ending = split_host[split_host.length - 1]?.startsWith('localhost:') ? -1 : -2
  return split_host.slice(0, ending).join('.')
}

// Start setting up app
const app = createApp(VueApp)
const pinia = createPinia()
app.use(ChartsVue)
app.use(pharos)
app.use(datepicker)
app.use(pinia)

// Set up stores
const coreStore = useCoreStore()
const featuresStore = useFeaturesStore()
const userStore = useUserStore()
const searchStore = useSearchStore()
const notificationsStore = useNotificationsStore()

// Make store values reactive
const {
  subdomain,
  routePath,
  routeQuery,
  customSubdomains,
  hasValidSubdomain,
  isAdminSubdomain,
  environment,
} = storeToRefs(coreStore)
const { features } = storeToRefs(featuresStore)
const {
  isUnauthenticated,
  isAuthenticatedStudent,
  isAuthenticatedAdmin,
  invalidUserEmail,
  entityName,
  groups,
  selectedGroups,
  type,
  gettingUser,
  groupIDs,
  ungroupedFeatures,
  id,
  facilities,
} = storeToRefs(userStore)
const { pageNo, reviewStatus, statusQuery } = storeToRefs(searchStore)

// I don't love this solution, but it does allow us to use fully dynamic routing.
// Even though all the routes are rewritten when there are auth changes, we can capture
// the original query and path here, save them in state, and replace them after completing
// the route update.
routePath.value = location.pathname
routeQuery.value = location.search

// Get current subdomain and check existing authentication
// Because Cypress has issues with subdomains, we use a stub value here to replace the location
// during e2e tests.
// @ts-expect-error Cypress stubs window location
const host = window.__location ? window.__location.host() : location.host
subdomain.value = get_subdomain(host)
let duplicateRoute = false

// We don't need to refetch auth data with every route change.
// This only runs those api calls when necessary.
const handleRouteChange = async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  document.title = to.name
    ? capitalize(to.name.toString()) + ' | JSTOR Access in Prison'
    : 'JSTOR Access in Prison'

  // If we're only chaning the page because we're removing the hash for the uuid
  // cooke, then that's all we need to do.
  if (duplicateRoute) {
    duplicateRoute = false
    return
  }

  // If we don't have features or the user is unauthenticated,
  // then we proceed with auth.
  if (isUnauthenticated.value) {
    await auth(app)
  } else {
    const term = (to.query.term || '').toString()
    const page = (to.query.page || '').toString()
    searchStore.setSearchTerms(term, to.path)
    pageNo.value = parseInt(page, 10) || 1
    if (
      from.query.term !== to.query.term ||
      from.query.page !== to.query.page ||
      from.path !== to.path
    ) {
      if (from.query.page === to.query.page) {
        pageNo.value = 1
      }
      if (to.path === '/requests') {
        const groups = (to.query.groups || '').toString()
        selectedGroups.value['status_search'] = groups
          ? parseGroupsQueryParam(groups)
          : groupIDs.value.length > 4
            ? []
            : groupIDs.value
        if (!reviewStatus.value) {
          reviewStatus.value = isAuthenticatedAdmin.value ? 'pending' : 'completed'
        }
        const sq = (to.query.statusq || '').toString()
        statusQuery.value = sq
      } else {
        reviewStatus.value = ''
      }
      if (to.path === '/search' || to.path === '/requests') {
        searchStore.doSearch(reviewStatus.value, false)
      }

      // NOTE: These must be imported here to avoid attempting to use the logger
      // before the router is initialized.
      const { handleWithLog, logs } = useLogger()
      const { routeChangeLog } = logs.getRouterLogs()
      handleWithLog(routeChangeLog({ to: to.path, from: from.path }))
    }
  }
}

const logout = () => {
  // This will get a list of route paths that are valid for unauthenticated users
  duplicateRoute = true
  // Reset route to home if current route is not valid for unauthenticated users
  userStore.$reset()
  gettingUser.value = false
}
const inOneDay = new Date(new Date().getTime() + 24 * 3600 * 1000)

// Handle auth and the initial fetching of features
const auth = async (app: App) => {
  // Prepare Stores
  const api = app.config.globalProperties.$api
  await notificationsStore.getDisplayNotifications()
  if (!!subdomain.value && !hasValidSubdomain.value) {
    const subdomains = await api.auth.validateSubdomains()
    if (subdomains.data && subdomains.data.subdomain) {
      customSubdomains.value.push(subdomains.data.subdomain)
    }
  }

  const env_response = await api.environment.get()
  if (env_response.data && env_response.data.environment) {
    environment.value = env_response.data.environment
  }

  const router = app.config.globalProperties.$router

  // Get UUID from url hash
  const uuid = location.hash.replace('#', '')
  const valid = checkIfValidUUID(uuid)

  // Set UUID Cookie and remove hash
  if (valid && isAdminSubdomain.value && (location || {}).hash) {
    setCookie('uuid', uuid, { expires: inOneDay, sameSite: 'None', secure: true, path: '/' })

    duplicateRoute = true
    if (router) {
      router.replace({ path: app.config.globalProperties.$route.path })
    }
  }

  // If we don't have auth data, get it and put it in the store
  if (isUnauthenticated.value) {
    gettingUser.value = true
    try {
      const resp = await api.auth.session()
      // If we have an invalid email, we need to show the user a message. We can extract the email
      // from the 401 response.
      if (resp.name === 'AxiosError' && resp.response.data && resp.response.data.invalid_email) {
        invalidUserEmail.value = resp.response.data.invalid_email
      }
      if (resp && resp.data) {
        // We need to get features here, immediately after retrieving user data, because
        // the user store will need the features list to accurately set the admin status
        // of the user.
        const data = resp.data
        if (data.type == 'users' && !features.value.length) {
          const resp = await api.auth.features.basic.get({ is_active: true })
          if (resp.data && resp.data.features && resp.data.total > 0) {
            features.value = resp.data.features
          }
        }
        if (data?.uuid) {
          setCookie('uuid', data.uuid, {
            expires: inOneDay,
            sameSite: 'None',
            secure: true,
            path: '/',
          })
        }
        if (data.invalid_email) {
          invalidUserEmail.value = data.invalid_email
        } else {
          groups.value = data.groups
          ungroupedFeatures.value = data.ungrouped_features || {}
          id.value = data.id
          type.value = data.type
          entityName.value = data.name
          gettingUser.value = false
          facilities.value = data.facilities || []
        }
      }
    } catch {
      logout()
    } finally {
      gettingUser.value = false
      if (isUnauthenticated.value) {
        logout()
      }
    }
  }
}
// Finalize router and mount app
const router = createRouter(isAuthenticatedStudent.value, isAuthenticatedAdmin.value)
app.use(router)
app.use(axios)
initializeVersionChecks()

router.beforeEach((to, from) => {
  if (updatePending) {
    window.location.assign(to.fullPath)
    return false
  }
  return handleRouteChange(to, from)
})
app.mount('#app')
