import type { AxiosInstance } from 'axios'
import type ApiObject from '@/interfaces/ApiObject'
import type { Log } from '@/interfaces/Log'
const global_path = 'api'
const global_version = 'v2'
const global_route_prefix = `/${global_path}`
const global_route_prefix_versioned = `${global_route_prefix}/${global_version}`

export const routes = {
  log: `${global_route_prefix_versioned}/log`,
  auth: {
    get: `${global_route_prefix_versioned}/auth`,
  },
  environment: {
    get: `${global_route_prefix_versioned}/environment`,
  },
  features: {
    grouped: {
      get: `${global_route_prefix_versioned}/site-administration/features/grouped/get`,
      add: `${global_route_prefix_versioned}/site-administration/features/grouped`,
      remove: `${global_route_prefix_versioned}/site-administration/features/grouped`,
      edit: `${global_route_prefix_versioned}/site-administration/features/grouped`,
      reactivate: `${global_route_prefix_versioned}/site-administration/features/grouped/reactivate`,
    },
    ungrouped: {
      get: `${global_route_prefix_versioned}/site-administration/features/ungrouped/get`,
      add: `${global_route_prefix_versioned}/site-administration/features/ungrouped`,
      remove: `${global_route_prefix_versioned}/site-administration/features/ungrouped`,
      edit: `${global_route_prefix_versioned}/site-administration/features/ungrouped`,
      reactivate: `${global_route_prefix_versioned}/site-administration/features/ungrouped/reactivate`,
    },
  },
  alerts: {
    get: `${global_route_prefix}/v3/alerts`,
    getPaginated: `${global_route_prefix}/v3/alerts/get`,
    add: `${global_route_prefix}/v3/alerts`,
    edit: `${global_route_prefix}/v3/alerts`,
    delete: `${global_route_prefix}/v3/alerts`,
  },
  validateSubdomains: {
    get: `${global_route_prefix_versioned}/subdomains/validate`,
  },
  subdomains: {
    get: `${global_route_prefix_versioned}/site-administration/subdomains/get`,
    add: `${global_route_prefix_versioned}/site-administration/subdomains`,
    remove: `${global_route_prefix_versioned}/site-administration/subdomains`,
    edit: `${global_route_prefix_versioned}/site-administration/subdomains`,
    reactivate: `${global_route_prefix_versioned}/site-administration/subdomains/reactivate`,
  },
  entities: {
    get: (entity: string) => `${global_route_prefix_versioned}/entities/${entity}/get`,
    remove: (entity: string) => `${global_route_prefix_versioned}/entities/${entity}`,
    add: (entity: string) => `${global_route_prefix_versioned}/entities/${entity}`,
    edit: (entity: string) => `${global_route_prefix_versioned}/entities/${entity}`,
  },
  groups: {
    get: `${global_route_prefix_versioned}/site-administration/groups/get`,
    remove: `${global_route_prefix_versioned}/site-administration/groups`,
    add: `${global_route_prefix_versioned}/site-administration/groups`,
    edit: `${global_route_prefix_versioned}/site-administration/groups`,
    reactivate: `${global_route_prefix_versioned}/site-administration/groups/reactivate`,
    clearHistory: `${global_route_prefix_versioned}/site-administration/groups/clear-history`,
    addAdministrator: `${global_route_prefix_versioned}/site-administration/groups/create-group-admin`,
  },
  disciplines: {
    get: `${global_route_prefix_versioned}/disciplines`,
  },
  journals: {
    get: (code: string) => `${global_route_prefix_versioned}/disciplines/${code}`,
  },
  search: {
    basic: `${global_route_prefix_versioned}/search`,
    status: (status: string) => `${global_route_prefix_versioned}/search/${status}`,
  },
  approvals: {
    bulk: `${global_route_prefix_versioned}/media-review/bulk`,
    bulkUndo: `${global_route_prefix_versioned}/media-review/bulk-undo`,
    deny: `${global_route_prefix_versioned}/media-review/deny`,
    incomplete: `${global_route_prefix_versioned}/media-review/incomplete`,
    approve: `${global_route_prefix_versioned}/media-review/approve`,
    request: `${global_route_prefix_versioned}/media-review/request`,
  },
  global_restricts: {
    restrict: `${global_route_prefix_versioned}/global-restricted-list/restrict`,
    unrestrict: `${global_route_prefix_versioned}/global-restricted-list/unrestrict`,
    get: `${global_route_prefix_versioned}/global-restricted-list/get`,
    download: `${global_route_prefix_versioned}/global-restricted-list/download`,
    last_updated: {
      get: `${global_route_prefix_versioned}/global-restricted-list/last-updated`,
    },
  },
  documents: {
    pdfs: (iid: string) => `${global_route_prefix_versioned}/page/${iid}`,
    metadata: (iid: string) => `${global_route_prefix_versioned}/metadata/${iid}`,
    pages: (iid: string, pid: string) => `${global_route_prefix_versioned}/page/${iid}/${pid}`,
  },
}
export default ($axios: AxiosInstance): ApiObject => ({
  log: (log: Log) => {
    // This is an odd workaround for the fact that Beacon API does not support sending
    // JSON data directly. We need to stringify the log object and send it as a Blob with
    // the correct MIME type.
    const blob = new Blob([JSON.stringify(log)], { type: 'application/json; charset=UTF-8' })
    navigator.sendBeacon(routes.log, blob)
  },
  auth: {
    session: () => {
      return (
        $axios
          .get(routes.auth.get)
          // We need to catch and return the error here because we may need it to display a
          // message to an unauthorized user.
          .catch((error) => {
            return error
          })
      )
    },
    features: {
      basic: {
        get: (data) => $axios.post(routes.features.grouped.get, data),
        add: (data) => $axios.post(routes.features.grouped.add, data),
        remove: (data) =>
          $axios.delete(routes.features.grouped.remove, {
            data,
          }),
        edit: (data) => $axios.patch(routes.features.grouped.edit, data),
        reactivate: (data) => $axios.post(routes.features.grouped.reactivate, data),
      },
      ungrouped: {
        get: (data) => $axios.post(routes.features.ungrouped.get, data),
        add: (data) => $axios.post(routes.features.ungrouped.add, data),
        remove: (data) =>
          $axios.delete(routes.features.ungrouped.remove, {
            data,
          }),
        edit: (data) => $axios.patch(routes.features.ungrouped.edit, data),
        reactivate: (data) => $axios.post(routes.features.ungrouped.reactivate, data),
      },
    },
    alerts: () => $axios.get(routes.alerts.get),
    validateSubdomains: () => $axios.get(routes.validateSubdomains.get),
    subdomains: {
      get: (data) => $axios.post(routes.subdomains.get, data),
      add: (data) => $axios.post(routes.subdomains.add, data),
      remove: (data) => $axios.delete(routes.subdomains.remove, { data }),
      edit: (data) => $axios.patch(routes.subdomains.edit, data),
      reactivate: (data) => $axios.post(routes.subdomains.reactivate, data),
    },
    entities: {
      get: (data, entity) => $axios.post(routes.entities.get(entity), data),
      remove: (data, entity) => $axios.delete(routes.entities.remove(entity), { data }),
      add: (data, entity) => $axios.post(routes.entities.add(entity), data),
      edit: (data, entity) => $axios.patch(routes.entities.edit(entity), data),
    },
    groups: {
      get: (data) => $axios.post(routes.groups.get, data),
      remove: (data) => $axios.delete(routes.groups.remove, { data }),
      add: (data) => $axios.post(routes.groups.add, data),
      edit: (data) => $axios.patch(routes.groups.edit, data),
      reactivate: (data) => $axios.patch(routes.groups.reactivate, data),
      clearHistory: (data) =>
        $axios.delete(routes.groups.clearHistory, {
          data,
        }),
      addAdministrator: (data) => $axios.post(routes.groups.addAdministrator, data),
    },
  },
  environment: {
    get: () => $axios.get(routes.environment.get),
  },
  disciplines: () => $axios.get(routes.disciplines.get),
  journals: (code: string) => $axios(routes.journals.get(code)),
  search: {
    basic: (data) => $axios.post(routes.search.basic, data),
    status: (data, status) => $axios.post(routes.search.status(status), data),
  },
  approvals: {
    bulk: (data) => $axios.post(routes.approvals.bulk, data),
    bulkUndo: (data) => $axios.post(routes.approvals.bulkUndo, data),
    deny: (data) => $axios.post(routes.approvals.deny, data),
    incomplete: (data) => $axios.post(routes.approvals.incomplete, data),
    approve: (data) => $axios.post(routes.approvals.approve, data),
    request: (data) => $axios.post(routes.approvals.request, data),
  },
  global_restricts: {
    restrict: (data) => $axios.post(routes.global_restricts.restrict, data),
    unrestrict: (data) => $axios.post(routes.global_restricts.unrestrict, data),
    get: (data) => $axios.post(routes.global_restricts.get, data),
    download: () =>
      $axios
        .get(routes.global_restricts.download, {
          responseType: 'blob',
          headers: {
            Accept: 'text/csv',
          },
        })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute(
            'download',
            `restricted_list_${new Date().toISOString().slice(0, 10)}.csv`,
          )
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          return response
        }),
    last_updated: {
      get: () => $axios.get(routes.global_restricts.last_updated.get),
    },
  },

  documents: {
    pdfs: (iid: string) => {
      const config = {
        headers: {
          Accept: `application/pdf`,
        },
      }
      return $axios.get(routes.documents.pdfs(iid), config)
    },
    // NOTE: Logs from this route are used in counter reporting. If any changes are made here,
    // be sure to make adjustments to avoid interfering or check with the data team.
    metadata: (iid: string) => $axios.get(routes.documents.metadata(iid)),
    pages: (iid: string, pid: string) => {
      return $axios({
        url: routes.documents.pages(iid, pid),
        method: 'GET',
        responseType: 'blob',
      })
    },
  },
  alerts: {
    get: () => $axios.get(routes.alerts.get),
    getPaginated: (data) => $axios.post(routes.alerts.getPaginated, data),
    add: (data) => $axios.post(routes.alerts.add, data),
    edit: (data) => $axios.patch(routes.alerts.edit, data),
    delete: (id) => $axios.delete(routes.alerts.delete, { data: { id } }),
  },
})
