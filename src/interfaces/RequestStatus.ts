// Lowercase statuses, as used in urls, search requests, and frontend comparisons.
export enum RequestStatus {
  Pending = 'pending',
  Completed = 'completed',
  Incomplete = 'incomplete',
  Denied = 'denied',
  Approved = 'approved',
  Restricted = 'restricted',
}

// Capitalized statuses, as returned by the api and shown to users. The "Approved by" variants
// only appear in older data, and `getStatus` treats them as `Approved`.
export enum RequestStatusLabel {
  Pending = 'Pending',
  Completed = 'Completed',
  Incomplete = 'Incomplete',
  Denied = 'Denied',
  Approved = 'Approved',
  ApprovedByDiscipline = 'Approved by Discipline',
  ApprovedByJournal = 'Approved by Journal',
  Restricted = 'Restricted',
}
