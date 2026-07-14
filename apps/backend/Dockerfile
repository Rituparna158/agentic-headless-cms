# syntax=docker/dockerfile:1
#
# Build from the monorepo root:
#   docker build -f apps/backend/Dockerfile -t agentic-cms-backend .
#
# A pnpm/Turborepo monorepo can't be Docker-built the way a single-package
# app can — `pnpm install` needs the *whole* workspace's package.json files
# to resolve `workspace:*` dependencies (@repo/shared-db, @repo/shared-types),
# so the build context has to be the repo root, not apps/backend/.

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- Prune ----
# `turbo prune` extracts only what this one app actually needs — its own
# source plus the workspace packages it depends on — out of the full
# monorepo. Every later stage works from that pruned subset instead of the
# whole repo, so an unrelated change elsewhere in the monorepo (e.g. the
# frontend) can't invalidate this image's build cache.
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune backend --docker

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
# --filter=backend... (the "..." includes backend's workspace dependencies)
# builds @repo/shared-db and @repo/shared-types first, then backend itself,
# in the correct topological order.
RUN pnpm turbo run build --filter=backend...
# `pnpm prune --prod` only looks at the manifest in the current directory and
# has no workspace-recursive mode, so it can't strip devDependencies (typescript,
# vitest, drizzle-kit, ...) from every workspace package. `pnpm deploy` is
# pnpm's purpose-built answer for monorepos: it resolves backend's workspace
# dependencies (@repo/shared-db, @repo/shared-types) down to their built
# output plus prod-only deps, into one self-contained directory.
RUN pnpm --filter=backend deploy --prod /app/deploy

# ---- Runtime ----
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs expressjs

# Only the deployed, production-only output makes it into the final image —
# no TypeScript source, no devDependencies, no build tools.
COPY --from=builder --chown=expressjs:nodejs /app/deploy .

USER expressjs
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
