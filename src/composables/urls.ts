import { routes } from '@/config/api'
import type { Collections } from '@/interfaces/Collections'
import { useCoreStore } from '@/stores/core'
import { storeToRefs } from 'pinia'

export const useBaseURL = () => {
  const coreStore = useCoreStore()
  const { isEphemeralAdmin, isEphemeralStudent, baseTestURL, baseAdminURL } = storeToRefs(coreStore)

  let baseURL = `${window.location.protocol}//${window.location.host}`
  if (isEphemeralAdmin.value) {
    baseURL = baseAdminURL.value
  } else if (isEphemeralStudent.value) {
    baseURL = baseTestURL.value
  }

  return baseURL
}

export const useCustomContentPDFURL = (collection: Collections, id: string) => {
  const baseURL = useBaseURL()
  const url = routes.collections.pdf(collection, id)
  return `${baseURL}${url}`
}

export const usePDFDownloadURL = (iid: string) => {
  const baseURL = useBaseURL()
  const url = routes.documents.pdfs(iid)
  return `${baseURL}${url}`
}

export const useValidDownloadURL = (
  iid: string | undefined,
  collection: Collections | undefined,
  id: string | undefined,
) => {
  if (iid) {
    return usePDFDownloadURL(iid)
  } else if (collection && id) {
    return useCustomContentPDFURL(collection, id)
  } else {
    return null
  }
}
