interface Documents {
  pdfs: Function
  pages: Function
  metadata: Function
}
interface Search {
  basic: Function
  status: Function
}
interface Approvals {
  bulk: Function
  bulkUndo: Function
  deny: Function
  incomplete: Function
  approve: Function
  request: Function
}
export default interface ApiObject {
  log: Function
  auth: {
    session: Function
    features: {
      basic: {
        get: Function
        add: Function
        remove: Function
        edit: Function
        reactivate: Function
      }
      ungrouped: {
        get: Function
        add: Function
        remove: Function
        edit: Function
        reactivate: Function
      }
    }
    alerts: Function
    validateSubdomains: Function
    subdomains: {
      get: Function
      add: Function
      remove: Function
      edit: Function
      reactivate: Function
    }
    entities: {
      get: Function
      remove: Function
      add: Function
      edit: Function
    }
    groups: {
      get: Function
      remove: Function
      add: Function
      edit: Function
      reactivate: Function
      clearHistory: Function
      addAdministrator: Function
    }
  }
  // drives: Drives,
  disciplines: Function
  journals: Function
  search: Search
  approvals: Approvals
  documents: Documents
}
