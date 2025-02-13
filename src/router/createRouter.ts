import unauthenticatedRoutes from '@/router/unauthenticated'
import student from '@/router/student'
import admin from '@/router/admin'
import { createRouter } from 'vue-router'
import { addPDFRoute } from '@/router/configurePDFRoutes'

export default (isStudent: boolean, isAdmin: boolean) => {
  if (isStudent) {
    return createRouter(addPDFRoute(student))
  } else if (isAdmin) {
    return createRouter(addPDFRoute(admin))
  } else {
    return createRouter(unauthenticatedRoutes)
  }
}
