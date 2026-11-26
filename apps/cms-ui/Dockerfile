FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# Prune 
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune cms-ui --docker

# Install
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build 
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
ARG VITE_API_URL
ARG VITE_APP_ID
ENV VITE_API_URL=${VITE_API_URL:-/api/v1}
ENV VITE_APP_ID=${VITE_APP_ID:-CMS_UI}
RUN pnpm turbo run build --filter=cms-ui...

# Runtime
# Static nginx (non-root, uid 101) with hardened security headers and compression.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

USER nginx

COPY --chown=nginx:nginx apps/cms-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/apps/cms-ui/dist /usr/share/nginx/html

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:5173/health || wget -q --spider http://127.0.0.1:5173/healthz || exit 1
