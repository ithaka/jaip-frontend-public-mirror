import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4173',
    defaultCommandTimeout: 10000,
    requestTimeout: 20000,
  },
  component: {
    specPattern: 'src/**/__tests__/*.{cy,spec}.{js,ts,jsx,tsx}',
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
  // Cypress records video by default, doing anything with them in github tends
  // to cause errors. They may, however, still be useful locally, and can be
  // restored by setting this to true or removing it.
  video: false,
})
