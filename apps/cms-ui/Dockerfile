FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- Prune ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune cms-ui --docker

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
ARG VITE_API_URL
ARG VITE_APP_ID
ENV VITE_API_URL=${VITE_API_URL:-/api/v1}
ENV VITE_APP_ID=${VITE_APP_ID:-CMS_UI}
RUN pnpm turbo run build --filter=cms-ui...

# ---- Runtime ----
FROM base AS runner
WORKDIR /app/apps/cms-ui

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs viteuser

COPY --from=builder --chown=viteuser:nodejs /app/apps/cms-ui/dist ./dist
COPY --from=builder --chown=viteuser:nodejs /app/apps/cms-ui/package.json ./package.json
COPY --from=installer --chown=viteuser:nodejs /app/node_modules /app/node_modules

USER viteuser
ENV NODE_ENV=production
EXPOSE 5173

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:5173/healthz || exit 1

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
