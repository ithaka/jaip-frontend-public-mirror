/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  env: {
    node: true,
   'vue/setup-compiler-macros': true, 
  },    
  parser: "vue-eslint-parser",
  overrides: [
    {
      files: [
        'cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}',
        '.{vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts}'
      ],
      'extends': [
        'plugin:cypress/recommended'
      ]
    }
  ],
  ignorePatterns: [
    '.gitignore',
    'scoped-custom-element-registry.*',
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  }
}
