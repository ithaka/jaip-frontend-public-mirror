import { createWebHistory } from 'vue-router'

const config = {
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {},
      component: () => import('@/views/HomeView.vue')
    },
  ]
}

export default config
