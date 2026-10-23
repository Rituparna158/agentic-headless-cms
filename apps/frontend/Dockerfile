FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- Prune ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune frontend --docker

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
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3000}
ENV NEXT_TELEMETRY_DISABLED=1
RUN find /app/apps/frontend -maxdepth 1 -name ".env*" -type l -delete


RUN pnpm turbo run build --filter=frontend...

# ---- Runtime ----
FROM node:24-alpine AS runner
RUN apk add --no-cache libc6-compat
# Strip unused package managers (npm, yarn, corepack) from production runner
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

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

CMD ["node", "server.js"]
