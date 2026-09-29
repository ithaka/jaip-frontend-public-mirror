import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from "path";
import Markdown from 'unplugin-vue-markdown/vite'
import dynamicImport from "vite-plugin-dynamic-import";

/**
 * Prepare build information for the app, including a build ID and commit hash.
 * 
 * @returns An object containing the build ID, commit hash, and build timestamp.
 */
function getBuildInfo() {
  const builtAt = new Date().toISOString()
  // For CICD, we should use the commit hash provided by the environment variable. If not available, we can try to get it from git.
  let commit = process.env.GIT_COMMIT || process.env.SOURCE_VERSION || ''

  if (!commit) {
    try {
      commit = execSync('git rev-parse --short=12 HEAD', { encoding: 'utf8' }).trim()
    } catch {
      commit = ''
    }
  }

  return {
    // If the commit hash isn't available, then we can just use the timestamp as the build ID.
    buildId: commit ? builtAt + '-' + commit : builtAt,
    commit,
    builtAt,
  }
}

/**
 * A Vite plugin that generates a version.json file containing build information, including the build ID, commit hash, and build timestamp.
 * 
 * @param buildInfo The build information object containing the build ID, commit hash, and build timestamp.
 * @returns A Vite plugin that generates a version.json file with the build information.
 */
function buildVersionManifest(buildInfo: ReturnType<typeof getBuildInfo>): Plugin {
  const source = JSON.stringify(buildInfo, null, 2)

  return {
    name: 'app-version-manifest',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '', 'http://localhost').pathname
        if (pathname !== '/version.json') {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(source)
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const buildInfo = getBuildInfo()
  const config = {
    define: {
      // This is the build ID that is used to determine if a new version of the app is available. It is generated at build time and is unique for each build.
      __APP_BUILD_ID__: JSON.stringify(buildInfo.buildId),
    },
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
      buildVersionManifest(buildInfo),

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
