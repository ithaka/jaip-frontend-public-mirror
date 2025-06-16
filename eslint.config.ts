import ithakaBaseEslintConfig from "@ithaka/eslint-config-base";
import ithakaVueEslintConfig from "@ithaka/eslint-config-vue";
import { defineConfig, globalIgnores } from "eslint/config";

export default [
  ...ithakaBaseEslintConfig,
  ...ithakaVueEslintConfig,

  ...defineConfig([globalIgnores([
    "dist/**",
    "node_modules/**",
    ".yarn/**",
    "public/**",
  ])]),
  
  {
    languageOptions: {
      globals: {
        window: true,
        document: true,
        navigator: true,
        URL: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        HTMLDivElement: true,
        HTMLElement: true,
        HTMLInputElement: true,
        location: true,
        console: true,
        KeyboardEvent: true,
        URLSearchParams: true,
        module: true,

      },
    },
  },

];