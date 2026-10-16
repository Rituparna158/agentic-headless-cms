# syntax=docker/dockerfile:1
#
# Build from the monorepo root:
#   docker build -f apps/worker/Dockerfile -t agentic-cms-worker .
#
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
RUN find /app/deploy -name "*.map" -delete 2>/dev/null || true
# Ensure prebuilt libvips libraries from @img/sharp-libvips-linuxmusl-x64 are linked for sharp
RUN mkdir -p /app/deploy/libvips && \
    LIBVIPS_DIR=$(find /app/node_modules -path "*/@img/sharp-libvips-linuxmusl-x64/lib" | head -n 1) && \
    if [ -n "$LIBVIPS_DIR" ]; then \
      cp -a "$LIBVIPS_DIR"/* /app/deploy/libvips/ && \
      SHARP_IMG_DIR=$(find /app/deploy/node_modules/.pnpm -path "*/@img+sharp-linuxmusl-x64*/node_modules/@img" | head -n 1); \
      if [ -n "$SHARP_IMG_DIR" ]; then \
        cp -a "$(dirname "$LIBVIPS_DIR")" "$SHARP_IMG_DIR/sharp-libvips-linuxmusl-x64"; \
      fi; \
    fi

# ---- Runtime ----
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat
# Strip unused package managers (npm, yarn, corepack) from production runner
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY --from=builder /app/deploy/libvips/ /usr/lib/
ENV LD_LIBRARY_PATH=/usr/lib:/usr/local/lib

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs workerjs

COPY --from=builder --chown=workerjs:nodejs /app/deploy .

USER workerjs
WORKDIR /app

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
