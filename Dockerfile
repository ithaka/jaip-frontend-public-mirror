FROM docker-virtual.artifactory.acorn.cirrostratus.org/node:22.17.1-alpine AS build-stage 
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable
COPY ./ .
RUN yarn build-only

FROM docker-virtual.artifactory.acorn.cirrostratus.org/nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/nginx/shared/ /etc/nginx/shared
RUN cat /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

