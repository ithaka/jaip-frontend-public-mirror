import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from "path";
import Markdown from 'unplugin-vue-markdown/vite'
import dynamicImport from "vite-plugin-dynamic-import";

export default defineConfig(({ mode }) => {
  const config = {
    build: {
      assetsDir: "assets/generated",
      // This is the default value for target:
      // target: 'baseline-widely-available',
      // We can't use the default because we're still supporting devices using Firefox 91 ESR
      target: ['chrome100', 'edge100', 'firefox91', 'safari16'],
      compilerOptions: {
        useDefineForClassFields: true,
      },
      rollupOptions: {
        output: {
          entryFileNames: `[name].[hash].mjs`,
          chunkFileNames: `[name].[hash].mjs`,
          // Pharos derives custom element tag names from `class.name`, so minifying them
          // produces duplicate tags (e.g. `pep-aq`) and breaks registration.
          keepNames: true,
        },
      }
    },
    // Firefox versions before module-worker support ignore PDF.js's `type: "module"` option. Bundling
    // the worker and its polyfills into one import-free script works in either mode.
    worker: {
      format: 'iife' as const,
    },
    server: {},
    plugins: [
      vue({
        include: [/\.vue$/, /\.md$/],
        template: {
          compilerOptions: {
            isCustomElement: (tag: string) => tag.startsWith('pep-pharos-'),
          }
        }
      }),
      Markdown({}),
      vueJsx(),
      viteStaticCopy({
        targets: [
          {
            src: './node_modules/@ithaka/pharos/lib/styles/icons/**/*',
            dest: 'styles/icons/pharos',
          },
          {
            src: './node_modules/pdfjs-dist/wasm/**/*',
            dest: 'scripts/pdfjs/wasm',
            // PDF.js resolves decoder assets directly beneath wasmUrl. The copy plugin
            // otherwise preserves the node_modules path inside the destination.
            rename: { stripBase: 3 },
          },
        ],
      }),
      dynamicImport({
        filter(id: string) {
          // https://github.com/vite-plugin/vite-plugin-dynamic-import/blob/v1.3.0/src/index.ts#L133-L135
          if (id.includes("/node_modules/@ithaka/pharos/")) {
            return true;
          }
        },
      }),

    ],
    optimizeDeps: {
      esbuildOptions: {
        keepNames: true,
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'vue': 'vue/dist/vue.esm-bundler.js',
        "/styles/icons": path.resolve(
          import.meta.dirname,
          "public/styles/icons/pharos"
        ),
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['if-function' as const],
        }
      }
    },
  }

  // This handles rerouting to a server specified by API_URL in a .env file
  // when ENVIRONMENT is set to "development". This allows us to use the prod or staging
  // clusters during frontend development.
  process.env = Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  if (process.env.ENVIRONMENT==="development") {
    config.server = {
      proxy: {
        '/api': {
          target: process.env.API_URL,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }

  return config
})
