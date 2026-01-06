import type { WorkingLog } from '@/interfaces/Log'
import type { Ref } from 'vue'
import { generics } from './generic'

const getFooterLogs = () => {
  const footerLinkClickLog =
    (options: {
      destination: string
      is_new?: boolean
      is_external?: boolean
    }): (() => WorkingLog) =>
    () => ({
      ...generics.linkClick(
        'footer',
        `${options.is_external ? 'external' : 'internal'}_navigation`,
      ),
      destination: options.destination,
      is_new: options.is_new ?? false,
    })

  return {
    footerLinkClickLog,
  }
}

const getSkipNavigationLogs = (target: Ref<string>) => {
  const skipToDestinationLog = (): WorkingLog => ({
    ...generics.linkClick('skip_navigation', 'skip_navigation'),
    event_description: `Activated skip to ${target.value} link`,
    destination: target.value,
  })

  return {
    skipToDestinationLog,
  }
}

const jstorLogoClickLog = (): WorkingLog => ({
  ...generics.linkClick('home', 'internal_navigation'),
  event_description: `Clicked JSTOR logo to navigate to home page`,
  destination: '/home',
})

const getJstorLogoLogs = () => {
  return {
    jstorLogoClickLog,
  }
}

const getHeaderLogs = () => {
  const logOutLog = (): WorkingLog => ({
    ...generics.buttonClick('logout'),
    event_description: 'Clicked logout button in main header',
  })

  const logInLog = (): WorkingLog => ({
    ...generics.linkClick('login', 'external_navigation'),
    event_description: 'Clicked login button in main header',
  })

  const openSidenavLog = (): WorkingLog => ({
    ...generics.buttonClick('open_sidenav'),
  })
  const closeSidenavLog = (): WorkingLog => ({
    ...generics.buttonClick('close_sidenav'),
  })
  const changeRouteLog =
    (destination: string): (() => WorkingLog) =>
    () => ({
      ...generics.linkClick(destination),
    })
  return {
    jstorLogoClickLog,
    logOutLog,
    logInLog,
    openSidenavLog,
    closeSidenavLog,
    changeRouteLog,
  }
}

const getRequestWarningLogs = () => {
  const searchLinkLog = (): WorkingLog => ({
    ...generics.linkClick('search_results'),
  })

  const requestsLinkLog = (): WorkingLog => ({
    ...generics.linkClick('requests_page'),
  })

  return {
    searchLinkLog,
    requestsLinkLog,
  }
}

export const navigationLogs = {
  getFooterLogs,
  getSkipNavigationLogs,
  getJstorLogoLogs,
  getRequestWarningLogs,
  getHeaderLogs,
}
