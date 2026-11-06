// Keep this file free of imports: Cypress bundles src/stores/core.ts without the "@" alias.
/** Whether localStorage keeps a value it is given; storage that discards writes counts as unavailable. */
export const isLocalStorageAvailable = (): boolean => {
  const probe = 'storageProbe'
  try {
    localStorage.setItem(probe, probe)
    const kept = localStorage.getItem(probe) === probe
    localStorage.removeItem(probe)
    return kept
  } catch {
    return false
  }
}
