FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
ARG PUBLIC_SITE_URL
ARG CONTACT_EMAIL
RUN npm run build

FROM node:22.23.4-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist/site ./site
COPY --from=build /app/dist/serve.mjs ./serve.mjs
USER node
EXPOSE 3100
CMD ["node", "serve.mjs"]
