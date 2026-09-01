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
// We can retain a page viewer route that redirects to the pdf viewer
// so that we can
const PageViewerRoute: RouteRecordRaw = {
  path: '/page/:iid/:pid',
  name: 'Page Viewer',
  meta: {
    hidden: true,
    requiresAny: ['view_pdf'],
    label: 'Page Viewer',
  },
  redirect: (to) => ({
    name: 'PDF Viewer',
    params: { iid: to.params.iid },
  }),
}
export const addPDFRoute = (config: RouterOptions): RouterOptions => {
  if (hasStaticBlock()) {
    return {
      ...config,
      routes: [...(config.routes || []), PDFRoute, PageViewerRoute],
    }
  }
  return config
}
