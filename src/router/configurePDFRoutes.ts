import type { RouterOptions } from 'vue-router'
import { hasStaticBlock } from '@/utils/helpers'

const PDFRoute = {
  path: '/pdf/:iid',
  name: 'PDF Viewer',
  meta: {
    hidden: true,
    requiresAny: ['view_pdf']
  },
  component: () => import('@/views/PDFView.vue')
}

export const addPDFRoute = (config: RouterOptions) => {
    if (hasStaticBlock()) {
        return {
            ...config,
            routes: [...config.routes, PDFRoute]
        }
    }
    return config
}