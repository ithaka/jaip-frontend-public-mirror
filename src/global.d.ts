declare module '*.vue' {
  import type { ComponentOptions } from 'vue'
  const Component: ComponentOptions
  export default Component
}

declare module '*.md' {
  import type { ComponentOptions } from 'vue'
  const Component: ComponentOptions
  export default Component
}

// PDF.js publishes this executable worker entry without a corresponding TypeScript declaration.
declare module 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'
