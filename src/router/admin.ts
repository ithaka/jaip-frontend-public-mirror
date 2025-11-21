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
      path: '/notifications',
      name: 'notifications',
      meta: {
        group: 'support',
        requiresAny: ['edit_facilities', 'manage_facilities'],
        showSearch: true,
        label: 'Notifications',
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
        label: 'Management',
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
        label: 'Account',
      },
      component: () => import('@/views/AccountView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      meta: {
        group: 'support',
        showSearch: true,
        label: 'About',
      },
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/help',
      name: 'help',
      meta: {
        group: 'support',
        showSearch: true,
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
      path: '/pdf/:iid',
      name: 'pdfViewer',
      meta: {
        hidden: true,
        requiresAny: ['view_pdf'],
        label: 'PDF Viewer',
      },
      component: () => import('@/views/PDFView.vue'),
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
      path: '/collections/:collection/:filename',
      name: 'collectionsItemViewer',
      meta: {
        hidden: true,
        label: 'Collections Item View',
        requiresAny: [
          'include_reentry_content',
          'add_or_edit_users',
          'approve_requests',
          'deny_requests',
          'edit_facilities',
          'manage_facilities',
          'remove_users',
          'bulk_approve',
          'undo_bulk_approve',
        ],
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
  ],
}

export default config
