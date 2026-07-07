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
    esbuild: {
      keepNames: true,
      supported: {
        'top-level-await': true //browsers can handle top-level-await features
      },
    },
    build: {
      assetsDir: "assets/generated",
      // This is the default value for target:
      // target: 'baseline-widely-available',
      // We can't use the default because we're still supporting devices using Firefox 91 ESR
      target: ['chrome107', 'edge107', 'firefox91', 'safari16'],
      keepNames: true,
      compilerOptions: {
        useDefineForClassFields: true,
      },
      rollupOptions: {
        external: [
          `/scripts/pdf.worker.min.mjs`
        ],
        output: {
          entryFileNames: `[name].[hash].mjs`,
          chunkFileNames: `[name].[hash].mjs`,
        },
      }
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
      include: [
          '@ithaka/pharos'
      ],
      esbuildOptions: {
        target: "esnext",
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        'vue': 'vue/dist/vue.esm-bundler.js',
        "/styles/icons": path.resolve(
          __dirname,
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


