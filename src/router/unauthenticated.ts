import type { RouteRecordRaw } from 'vue-router'
import { createWebHistory } from 'vue-router'

const config = {
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: <RouteRecordRaw[]>[
    {
      path: '/',
      name: 'home',
      meta: {
        label: 'Home',
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      meta: {
        label: 'Search',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/requests',
      name: 'requests',
      meta: {
        label: 'Requests',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/notifications',
      name: 'notifications',
      meta: {
        label: 'Notifications',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/management',
      name: 'Management',
      meta: {
        label: 'Management',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/analytics',
      name: 'analytics',
      meta: {
        label: 'Analytics',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/account',
      name: 'account',
      meta: {
        label: 'Account',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      meta: {
        label: 'About',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/dictionary',
      name: 'dictionary',
      meta: {
        label: 'Dictionary',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/dictionary/:term',
      name: 'term view',
      meta: {
        label: 'Term View',
        hidden: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/accessibility',
      name: 'accessibility',
      meta: {
        hidden: true,
        label: 'Accessibility',
        showInFooter: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/pdf/:iid',
      name: 'pdfViewer',
      meta: {
        hidden: true,
        label: 'PDF Viewer',
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/page/:iid/:pid',
      name: 'pageViewer',
      meta: {
        hidden: true,
        label: 'Page Viewer',
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/collections/reentry',
      name: 'reentry guides',
      meta: {
        hidden: true,
        label: 'Reentry Guides',
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/collections/:collection/:filename',
      name: 'collection item',
      meta: {
        hidden: true,
        label: 'Collection Item',
      },
      component: () => import('@/views/AboutView.vue'),
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
