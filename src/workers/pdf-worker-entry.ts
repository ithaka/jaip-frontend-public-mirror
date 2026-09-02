// Import order is significant: the first side-effect module installs the worker-scoped polyfills
// before PDF.js evaluates. During production builds, Vite bundles both imports into one classic
// IIFE, removing these module declarations from the delivered file so Firefox versions without
// module-worker support can parse it. Development uses PDF.js's main-thread worker fallback instead.
import './pdf-worker-polyfills'
import 'pdfjs-dist/legacy/build/pdf.worker.min.mjs'
