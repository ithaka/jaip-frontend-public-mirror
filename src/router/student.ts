import { createWebHistory } from 'vue-router'

const config = {
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {},
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      meta: {
        group: 'research',
        showSearch: true,
      },
      component: () => import('@/views/SearchView.vue'),
    },
    {
      path: '/requests',
      name: 'requests',
      meta: {
        group: 'research',
      },
      component: () => import('@/views/RequestsView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      meta: {
        group: 'support',
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/help',
      name: 'help',
      meta: {
        group: 'support',
      },
      component: () => import('@/views/HelpView.vue'),
    },
    {
      path: '/page/:iid/:pid',
      name: 'Page Viewer',
      meta: {
        hidden: true,
        requiresAny: ['view_document'],
      },
      component: () => import('@/views/PageView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      meta: {
        hidden: true,
      },
      component: () => import('@/views/NotFound.vue'),
    },
  ],
}

export default config
