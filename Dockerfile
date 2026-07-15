FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:24.18.0-alpine AS build-stage
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable
COPY ./ .
RUN yarn build-only

FROM docker-virtual.artifactory.acorn.cirrostratus.org/nginx:stable-alpine AS production-stage

# TODO: remove this explicit pin once `apk upgrade` reliably picks up
# curl/libcurl fixes on its own (see CVE-2026-5773, CVE-2026-6276).
RUN apk upgrade --no-cache \
    && apk add --no-cache curl=8.20.0-r0 libcurl=8.20.0-r0

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/nginx/shared/ /etc/nginx/shared
RUN cat /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

