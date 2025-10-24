import type { RouterOptions, RouteRecordRaw } from 'vue-router'
import { hasStaticBlock } from '@/utils/helpers'

const PDFRoute: RouteRecordRaw = {
  path: '/pdf/:iid',
  name: 'PDF Viewer',
  meta: {
    hidden: true,
    requiresAny: ['view_pdf'],
    label: 'PDF Viewer',
  },
  component: () => import('@/views/PDFView.vue'),
}

export const addPDFRoute = (config: RouterOptions): RouterOptions => {
  if (hasStaticBlock()) {
    return {
      ...config,
      routes: [...(config.routes || []), PDFRoute],
    }
  }
  return config
}
