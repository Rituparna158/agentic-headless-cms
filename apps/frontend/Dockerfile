# syntax=docker/dockerfile:1
#
# Build from the monorepo root:
#   docker build -f apps/frontend/Dockerfile -t agentic-cms-frontend .
#
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat && corepack enable

# ---- Prune ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune frontend --docker

# ---- Install ----
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3000}
ENV NEXT_TELEMETRY_DISABLED=1
RUN find /app/apps/frontend -maxdepth 1 -name ".env*" -type l -delete

RUN --mount=type=cache,id=next-cache,target=/app/apps/frontend/.next/cache \
    pnpm turbo run build --filter=frontend...

# ---- Runtime ----
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /var/cache/apk/*

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs
WORKDIR /app/apps/frontend

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

CMD ["node", "server.js"]
