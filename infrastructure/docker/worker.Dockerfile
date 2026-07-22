FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install --frozen-lockfile
COPY apps/worker apps/worker
COPY packages packages
RUN pnpm --filter @pulihkanaku/config build && pnpm --filter @pulihkanaku/database build && pnpm --filter @pulihkanaku/worker build

FROM node:22-alpine AS runtime
RUN apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
USER node
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","apps/worker/dist/main.js"]
