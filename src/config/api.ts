import type { AxiosInstance } from 'axios'
import type ApiObject from '@/interfaces/ApiObject'

export default ($axios: AxiosInstance): ApiObject => ({
  auth: {
    session: () =>
      $axios
        .get('/api/auth/session')
        // We need to catch and return the error here because we may need it to display a
        // message to an unauthorized user.
        .catch((error) => {
          return error
        }),
    features: {
      basic: {
        get: (data) => $axios.post('/api/auth/features/basic/get', data),
        add: (data) => $axios.post(`/api/auth/features/basic`, data),
        remove: (data) => $axios.delete(`/api/auth/features/basic`, { data }),
        edit: (data) => $axios.patch(`/api/auth/features/basic`, data),
        reactivate: (data) => $axios.post(`/api/auth/features/basic/reactivate`, data),
      },
      ungrouped: {
        get: (data) => $axios.post('/api/auth/features/ungrouped/get', data),
        add: (data) => $axios.post(`/api/auth/features/ungrouped`, data),
        remove: (data) => $axios.delete(`/api/auth/features/ungrouped`, { data }),
        edit: (data) => $axios.patch(`/api/auth/features/ungrouped`, data),
        reactivate: (data) => $axios.post(`/api/auth/features/ungrouped/reactivate`, data),
      },
    },
    alerts: () => $axios.get('/api/auth/alerts'),
    validateSubdomains: (entity: string) => $axios.get(`/api/auth/subdomains/${entity}`),
    subdomains: {
      get: (data) => $axios.post(`/api/auth/getSubdomains`, data),
      add: (data) => $axios.post(`/api/auth/subdomains`, data),
      remove: (data) => $axios.delete(`/api/auth/subdomains`, { data }),
      edit: (data) => $axios.patch(`/api/auth/subdomains`, data),
      reactivate: (data) => $axios.post(`/api/auth/reactivateSubdomains`, data),
    },
    entities: {
      get: (data, entity) => $axios.post(`/api/auth/getEntities/${entity}`, data),
      remove: (data, entity) => $axios.delete(`/api/auth/entities/${entity}`, { data }),
      add: (data, entity) => $axios.post(`/api/auth/entities/${entity}`, data),
      edit: (data, entity) => $axios.patch(`/api/auth/entities/${entity}`, data),
    },
    groups: {
      get: (data) => $axios.post(`/api/auth/getGroups`, data),
      remove: (data) => $axios.delete('/api/auth/groups', { data }),
      add: (data) => $axios.post('/api/auth/groups', data),
      edit: (data) => $axios.patch('/api/auth/groups', data),
      reactivate: (data) => $axios.patch('/api/auth/reactivateGroups', data),
      clearHistory: (data) => $axios.delete('/api/auth/clearHistory', { data }),
      addAdministrator: (data) => $axios.post(`/api/auth/createGroupAdmin`, data),
    },
  },
  disciplines: () => $axios.get('/api/disciplines'),
  journals: (code: string) => $axios(`/api/disciplines/${code}`),
  search: {
    basic: (data) => $axios.post(`/api/search`, data),
    status: (data, status) => $axios.post(`/api/search/${status}`, data),
  },
  approvals: {
    bulk: (data) => $axios.post(`/api/approvals/bulk`, data),
    bulkUndo: (data) => $axios.post(`/api/approvals/bulkUndo`, data),
    deny: (data) => $axios.post(`/api/approvals/deny`, data),
    incomplete: (data) => $axios.post(`/api/approvals/incomplete`, data),
    approve: (data) => $axios.post(`/api/approvals/approve`, data),
    request: (data) => $axios.post(`/api/approvals/request`, data),
  },
  documents: {
    pdfs: (iid: string) => {
      const config = {
        headers: {
          Accept: 'application/pdf',
        },
      }
      return $axios.get(`/api/pages/pdf/${iid}`, config)
    },
    // NOTE: Logs from this route are used in counter reporting. If any changes are made here,
    // be sure to make adjustments to avoid interfering or check with the data team.
    metadata: (iid: string) => $axios.get(`/api/pages/metadata/${iid}`),
    pages: (iid: string, pid: string) => {
      return $axios({
        url: `/api/pages/${iid}/${pid}`,
        method: 'GET',
        responseType: 'blob',
      })
    },
  },
})
