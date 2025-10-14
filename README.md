# jaip-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Subdomains

Many aspects of this project are highly dependent on the subdomain. Perhaps most importantly, the difference between the student and admin versions of the site is largely determined by whether the user is visiting the `pep` subdomain or the `admin.pep` subdomain.

In some browsers, including Chrome and Firefox, it is possible to simply use `http://pep.localhost:5173/` and `http://admin.pep.localhost:5173/` as the domains for the site. This requires a modification of `/etc/hosts` and will not work in Safari.

Specifically, a line like the following can be added to `/etc/hosts`, which will allow browsers to use the subdomains properly:

```
127.0.0.1 pep.localhost admin.pep.localhost
```

## Environment

The `.env.example` file includes some values and notes that may be useful to place into a `.env` file. Note that when using a remote server for the API_URL, this will affect the application's environment. The `prod` API will use production data and return `prod` in the environment check that determines the URL of the login button.

## Project Setup

[Install `nvm` for managing the project node version.](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)

Activate the pinned node version based on this project's `.nvmrc` file.

```
$ nvm use
```

If you do not have that node version on your local machine, `nvm` will say so. Use `nvm install` to install the pinned version.

Finally, install project depdendencies:

```
$ yarn install
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Run Headed Component Tests with [Cypress Component Testing](https://on.cypress.io/component)

```sh
yarn test:unit:dev # or `yarn test:unit` for headless testing
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
yarn test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
yarn build
yarn test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

## Logging

Logs are sent from the frontend to the backend using the [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API) in order to send non-blocking requests to the server. Log events must include and `eventtype` and `event_description`. The remaining fields necessary for Captain's Logging will be added by the backend. Additional fields can be added as needed.

Frontend logging works locally as well as in the `TEST` and `PROD` environments. In the ephemeral cluster, however, it will return `405 Method Not Allowed` errors as a result of CORS issues. This does mean frontend logs will not work in the ephemeral environment.

### Local docker image build

The first time you run the docker image build locally, first run:

```
cp nginx/nginx.conf.persistent nginx/nginx.conf
```

This simulates the repo setup that takes place during the `build app image` job in our CICD setup.
