import type { AxiosInstance } from 'axios'
import type ApiObject from '@/interfaces/ApiObject'
const global_path = 'api'
const global_version = 'v2'
const global_route_prefix = `/${global_path}`
const global_route_prefix_versioned = `${global_route_prefix}/${global_version}`

export default ($axios: AxiosInstance): ApiObject => ({
  auth: {
    session: () =>
      $axios
        .get(`${global_route_prefix_versioned}/auth`)
        // We need to catch and return the error here because we may need it to display a
        // message to an unauthorized user.
        .catch((error) => {
          return error
        }),
    features: {
      basic: {
        get: (data) =>
          $axios.post(
            `${global_route_prefix_versioned}/site-administration/features/grouped/get`,
            data,
          ),
        add: (data) =>
          $axios.post(
            `${global_route_prefix_versioned}/site-administration/features/grouped`,
            data,
          ),
        remove: (data) =>
          $axios.delete(`${global_route_prefix_versioned}/site-administration/features/grouped`, {
            data,
          }),
        edit: (data) =>
          $axios.patch(
            `${global_route_prefix_versioned}/site-administration/features/grouped`,
            data,
          ),
        reactivate: (data) =>
          $axios.post(
            `${global_route_prefix_versioned}/site-administration/features/grouped/reactivate`,
            data,
          ),
      },
      ungrouped: {
        get: (data) =>
          $axios.post(
            `${global_route_prefix_versioned}/site-administration/features/ungrouped/get`,
            data,
          ),
        add: (data) =>
          $axios.post(
            `${global_route_prefix_versioned}/site-administration/features/ungrouped`,
            data,
          ),
        remove: (data) =>
          $axios.delete(`${global_route_prefix_versioned}/site-administration/features/ungrouped`, {
            data,
          }),
        edit: (data) =>
          $axios.patch(
            `${global_route_prefix_versioned}/site-administration/features/ungrouped`,
            data,
          ),
        reactivate: (data) =>
          $axios.post(
            `${global_route_prefix_versioned}/site-administration/features/ungrouped/reactivate`,
            data,
          ),
      },
    },
    alerts: () => $axios.get(`${global_route_prefix_versioned}/alerts`),
    validateSubdomains: () => $axios.get(`${global_route_prefix_versioned}/subdomains/validate`),
    subdomains: {
      get: (data) =>
        $axios.post(`${global_route_prefix_versioned}/site-administration/subdomains/get`, data),
      add: (data) =>
        $axios.post(`${global_route_prefix_versioned}/site-administration/subdomains`, data),
      remove: (data) =>
        $axios.delete(`${global_route_prefix_versioned}/site-administration/subdomains`, { data }),
      edit: (data) =>
        $axios.patch(`${global_route_prefix_versioned}/site-administration/subdomains`, data),
      reactivate: (data) =>
        $axios.post(
          `${global_route_prefix_versioned}/site-administration/subdomains/reactivate`,
          data,
        ),
    },
    entities: {
      get: (data, entity) =>
        $axios.post(`${global_route_prefix_versioned}/entities/${entity}/get`, data),
      remove: (data, entity) =>
        $axios.delete(`${global_route_prefix_versioned}/entities/${entity}`, { data }),
      add: (data, entity) =>
        $axios.post(`${global_route_prefix_versioned}/entities/${entity}`, data),
      edit: (data, entity) =>
        $axios.patch(`${global_route_prefix_versioned}/entities/${entity}`, data),
    },
    groups: {
      get: (data) =>
        $axios.post(`${global_route_prefix_versioned}/site-administration/groups/get`, data),
      remove: (data) =>
        $axios.delete(`${global_route_prefix_versioned}/site-administration/groups`, { data }),
      add: (data) =>
        $axios.post(`${global_route_prefix_versioned}/site-administration/groups`, data),
      edit: (data) =>
        $axios.patch(`${global_route_prefix_versioned}/site-administration/groups`, data),
      reactivate: (data) =>
        $axios.patch(
          `${global_route_prefix_versioned}/site-administration/groups/reactivate`,
          data,
        ),
      clearHistory: (data) =>
        $axios.delete(`${global_route_prefix_versioned}/site-administration/groups/clear-history`, {
          data,
        }),
      addAdministrator: (data) =>
        $axios.post(
          `${global_route_prefix_versioned}/site-administration/groups/create-group-admin`,
          data,
        ),
    },
  },
  disciplines: () => $axios.get(`${global_route_prefix_versioned}/disciplines`),
  journals: (code: string) => $axios(`${global_route_prefix_versioned}/disciplines/${code}`),
  search: {
    basic: (data) => $axios.post(`${global_route_prefix_versioned}/search`, data),
    status: (data, status) =>
      $axios.post(`${global_route_prefix_versioned}/search/${status}`, data),
  },
  approvals: {
    bulk: (data) => $axios.post(`${global_route_prefix_versioned}/media-review/bulk`, data),
    bulkUndo: (data) =>
      $axios.post(`${global_route_prefix_versioned}/media-review/bulk-undo`, data),
    deny: (data) => $axios.post(`${global_route_prefix_versioned}/media-review/deny`, data),
    incomplete: (data) =>
      $axios.post(`${global_route_prefix_versioned}/media-review/incomplete`, data),
    approve: (data) => $axios.post(`${global_route_prefix_versioned}/media-review/approve`, data),
    request: (data) => $axios.post(`${global_route_prefix_versioned}/media-review/request`, data),
  },
  documents: {
    pdfs: (iid: string) => {
      const config = {
        headers: {
          Accept: `application/pdf`,
        },
      }
      return $axios.get(`${global_route_prefix_versioned}/page/${iid}`, config)
    },
    // NOTE: Logs from this route are used in counter reporting. If any changes are made here,
    // be sure to make adjustments to avoid interfering or check with the data team.
    metadata: (iid: string) => $axios.get(`${global_route_prefix_versioned}/metadata/${iid}`),
    pages: (iid: string, pid: string) => {
      return $axios({
        url: `${global_route_prefix_versioned}/page/${iid}/${pid}`,
        method: 'GET',
        responseType: 'blob',
      })
    },
  },
})
