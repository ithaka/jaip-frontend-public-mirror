import { initPDFWorkerPolyfills } from '@/utils/polyfills'

// This module must remain the first side-effect import in pdf-worker-entry.ts.
initPDFWorkerPolyfills()
