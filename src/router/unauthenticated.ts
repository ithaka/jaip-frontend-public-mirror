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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/AboutView.vue'),
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
  ],
}

export default config
