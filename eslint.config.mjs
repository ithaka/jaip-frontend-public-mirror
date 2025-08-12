import globals from "globals";
import ithakaVueEslintConfig from "@ithaka/eslint-config-vue";
import pluginCypress from 'eslint-plugin-cypress/flat';
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  ...ithakaVueEslintConfig,
  eslintConfigPrettier,
    {
    ...pluginCypress.configs.recommended,
    files: [
      '**/__tests__/*.{cy,spec}.{js,ts,jsx,tsx}',
      'cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}',
      'cypress/support/**/*.{js,ts,jsx,tsx}'
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.cypress,
      },
    },
  },
  {
    files: ["*.vue", "**/*.vue"],
    rules: {
      "vue/no-v-html": "off",
      "vue/no-deprecated-slot-attribute": "off",
      "@typescript-eslint/no-explicit-any": "warn"
    },
  },
];
