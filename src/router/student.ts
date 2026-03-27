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
      path: '/dictionary',
      name: 'dictionary',
      meta: {
        label: 'Dictionary',
        requiresAny: ['use_dictionary'],
        showInFooter: true,
        showAsNew: true,
      },
      component: () => import('@/views/DictionaryView.vue'),
    },
    {
      path: '/collections/reentry',
      name: 'reentry guides',
      meta: {
        label: 'Reentry Guides',
        requiresAny: ['include_reentry_content'],
        showInFooter: true,
      },
      component: () => import('@/views/ReentryView.vue'),
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
      path: '/collections/:collection/:filename',
      name: 'collection item',
      meta: {
        hidden: true,
        label: 'Collection Item',
        requiresAny: ['include_reentry_content'],
      },
      component: () => import('@/views/CollectionsItemView.vue'),
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
      path: '/dictionary/:term',
      name: 'term view',
      meta: {
        hidden: true,
        label: 'Term View',
        requiresAny: ['use_dictionary'],
      },
      component: () => import('@/views/TermView.vue'),
    },
  ],
}

export default config
