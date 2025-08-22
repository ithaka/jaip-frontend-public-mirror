import '@/assets/main.scss'

import { createApp } from 'vue'
import type { App } from 'vue'
import { createPinia, storeToRefs } from 'pinia'
import { setCookie } from 'typescript-cookie'
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
app.use(pharos)
app.use(datepicker)

app.use(pinia)

// Set up stores
const coreStore = useCoreStore()
const featuresStore = useFeaturesStore()
const userStore = useUserStore()
const searchStore = useSearchStore()

// Make store values reactive
const {
  subdomain,
  routePath,
  routeQuery,
  alert,
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
          ? JSON.parse(groups)
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
    }
  }
}

const logout = () => {
  const router = app.config.globalProperties.$router
  duplicateRoute = true
  routePath.value = '/'
  routeQuery.value = '?term=&page=1'
  userStore.$reset()
  gettingUser.value = false
  router.push({
    path: '/',
    query: {
      term: '',
      page: 1,
    },
  })
}
const inOneDay = new Date(new Date().getTime() + 24 * 3600 * 1000)

// Handle auth and the initial fetching of features
const auth = async (app: App) => {
  // Prepare Stores
  const api = app.config.globalProperties.$api
  const alerts = await api.auth.alerts()
  if (alerts.data) {
    alert.value = alerts.data
  }
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
    setCookie('uuid', uuid, { expires: inOneDay, sameSite: 'None', secure: true })

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
          setCookie('uuid', data.uuid, { expires: inOneDay, sameSite: 'None', secure: true })
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
router.beforeEach((to, from) => handleRouteChange(to, from))
app.mount('#app')
