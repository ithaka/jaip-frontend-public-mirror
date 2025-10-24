import { createWebHistory } from 'vue-router'

const config = {
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        label: 'Home',
      },
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      meta: {
        group: 'research',
        showSearch: true,
        label: 'Search',
      },
      component: () => import('@/views/SearchView.vue'),
    },
    {
      path: '/requests',
      name: 'requests',
      meta: {
        group: 'research',
        label: 'Requests',
      },
      component: () => import('@/views/RequestsView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      meta: {
        group: 'support',
        label: 'About',
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/help',
      name: 'help',
      meta: {
        group: 'support',
        label: 'Help',
      },
      component: () => import('@/views/HelpView.vue'),
    },
    {
      path: '/accessibility',
      name: 'accessibility',
      meta: {
        hidden: true,
        showInFooter: true,
        label: 'Accessibility',
      },
      component: () => import('@/views/AccessibilityView.vue'),
    },
    {
      path: '/page/:iid/:pid',
      name: 'pageViewer',
      meta: {
        hidden: true,
        requiresAny: ['view_document'],
        label: 'Page Viewer',
      },
      component: () => import('@/views/PageView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      meta: {
        hidden: true,
        label: 'Not Found',
      },
      component: () => import('@/views/NotFound.vue'),
    },
  ],
}

export default config
