FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:24.18.0-alpine AS build-stage
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable
COPY ./ .

# alpine has no git, so this puts the commit hash into the build for version checking
ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT

RUN yarn build-only

FROM docker-virtual.artifactory.acorn.cirrostratus.org/nginx:stable-alpine AS production-stage

RUN apk upgrade --no-cache 
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/nginx/shared/ /etc/nginx/shared

RUN cat /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

