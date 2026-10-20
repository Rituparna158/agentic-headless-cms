FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- Prune ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune worker --docker

# ---- Install ----
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=worker...
RUN pnpm --filter=worker deploy --prod /app/deploy

# ---- Runtime ----
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs workeruser

COPY --from=builder --chown=workeruser:nodejs /app/deploy .

# Copy libvips shared libraries so musl dynamic linker can resolve them on Alpine
RUN cp -d /app/node_modules/.pnpm/@img+sharp-libvips-linuxmusl-x64*/node_modules/@img/sharp-libvips-linuxmusl-x64/lib/*.so* /usr/local/lib/ 2>/dev/null || true

USER workeruser
WORKDIR /app

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
