# syntax=docker/dockerfile:1
#
# Build from the monorepo root:
#   docker build -f apps/frontend/Dockerfile -t agentic-cms-frontend .
#
# Same reasoning as apps/backend/Dockerfile: a pnpm/Turborepo monorepo needs
# the whole workspace's package.json files to resolve `workspace:*`
# dependencies (@repo/shared-types), so the build context has to be the repo
# root, not apps/frontend/.

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- Prune ----
# `turbo prune` extracts only what this one app actually needs — its own
# source plus the workspace packages it depends on — out of the full
# monorepo. Every later stage works from that pruned subset instead of the
# whole repo, so an unrelated change elsewhere in the monorepo (e.g. the
# backend) can't invalidate this image's build cache.
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune frontend --docker

# ---- Install ----
# Split from the build stage on purpose: out/json/ contains only
# package.json files (no source), so this layer is cached and skipped
# entirely on rebuilds unless a dependency actually changed.
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
# Disabled telemetry for the Docker build; not relevant for a self-hosted
# image and avoids a network call during the build.
ENV NEXT_TELEMETRY_DISABLED=1
# --filter=frontend... (the "..." includes frontend's workspace dependencies)
# builds @repo/shared-types first, then frontend itself. next.config.js sets
# output: 'standalone', so this produces .next/standalone — a self-contained
# server bundle with only the production deps this app actually traces to.
RUN pnpm turbo run build --filter=frontend...

# ---- Runtime ----
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

# The standalone output already contains a pruned node_modules and a
# server.js entrypoint — static assets are copied in separately since
# `output: standalone` deliberately excludes them. (No public/ dir exists
# yet; add a COPY for it here once one is introduced.)
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs
WORKDIR /app/apps/frontend

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "server.js"]
