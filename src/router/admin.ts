import { createWebHistory } from 'vue-router'

const config = {
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
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
      path: '/notifications',
      name: 'notifications',
      meta: {
        group: 'support',
        requiresAny: ['edit_facilities', 'manage_facilities'],
        showSearch: true,
      },
      component: () => import('@/views/NotificationsView.vue'),
    },
    {
      path: '/management',
      name: 'Management',
      meta: {
        group: 'support',
        requiresAnyUngrouped: [
          'add_group',
          'delete_group',
          'edit_group',
          'clear_history',
          'manage_superusers',
          'create_group_admins',
          'add_subdomain',
          'edit_subdomain',
          'delete_subdomain',
          'add_feature',
          'edit_feature',
          'delete_feature',
          'add_ungrouped_feature',
          'edit_ungrouped_feature',
          'delete_ungrouped_feature',
        ],
        showSearch: true,
      },
      component: () => import('@/views/AccountManagement.vue'),
    },
    {
      path: '/account',
      name: 'account',
      meta: {
        group: 'support',
        requiresAny: ['get_users', 'get_facilities'],
        showSearch: true,
      },
      component: () => import('@/views/AccountView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      meta: {
        group: 'support',
        showSearch: true,
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/help',
      name: 'help',
      meta: {
        group: 'support',
        showSearch: true,
      },
      component: () => import('@/views/HelpView.vue'),
    },
    {
      path: '/pdf/:iid',
      name: 'PDF Viewer',
      meta: {
        hidden: true,
        requiresAny: ['view_pdf'],
      },
      component: () => import('@/views/PDFView.vue'),
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
