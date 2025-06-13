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
````
127.0.0.1 pep.localhost admin.pep.localhost
````

## Environment
The `.env.example` file includes some values and notes that may be useful to place into a `.env` file.

## Project Setup

```sh
yarn
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
