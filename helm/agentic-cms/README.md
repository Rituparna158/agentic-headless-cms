# agentic-cms Helm chart

Deploys the Agentic Headless CMS backend (Express API) and frontend (Next.js
admin UI) to Kubernetes. Targets Kubernetes 1.28+.

Postgres and Redis are **not** part of this chart — they're assumed to be
externally managed (a managed database/cache service, or an existing
in-cluster instance you already run). This chart only wires the connection
details in via Secrets.

## Prerequisites

- A Kubernetes cluster (1.28+) and `kubectl` pointed at it.
- Helm 3+.
- An Ingress controller installed in the cluster (this chart defaults to
  `ingressClassName: nginx` — set `ingress.className` if you use a different
  one, e.g. `traefik`).
- [metrics-server](https://github.com/kubernetes-sigs/metrics-server) (or
  equivalent) installed in the cluster — the HPAs are CPU-based and read from
  the metrics API; without it `kubectl get hpa` shows `<unknown>` targets and
  autoscaling never actually triggers, even though the HPA objects
  themselves deploy fine.
- A reachable Postgres database and Redis instance.
- Docker images for both apps, built and pushed to a registry the cluster can
  pull from.

## 1. Build and push the images

Both Dockerfiles build from the **monorepo root** as their context (a
pnpm/Turborepo workspace needs the whole workspace's `package.json` files to
resolve `workspace:*` dependencies) — run these from the repo root, not from
`apps/backend`/`apps/frontend`:

```sh
docker build -f apps/backend/Dockerfile  -t <registry>/agentic-cms-backend:<tag>  .
docker build -f apps/frontend/Dockerfile -t <registry>/agentic-cms-frontend:<tag> .

docker push <registry>/agentic-cms-backend:<tag>
docker push <registry>/agentic-cms-frontend:<tag>
```

## 2. Configure secrets

The backend requires `DATABASE_URL` and `JWT_SECRET` (min. 32 characters) to
start at all — it fails fast on boot if either is missing or malformed (see
`apps/backend/src/config/env.ts`). `REDIS_URL` has a `localhost`-only default
that only makes sense for local dev; set a real one for any real deployment
(background job queues — media thumbnail generation — depend on it).

Every key under `backend.secrets` in `values.yaml` follows the same shape:

```yaml
backend:
  secrets:
    JWT_SECRET:
      value: '' # set directly (fine for local/dev only)
      existingSecret: '' # or reference a Secret you manage yourself
      existingSecretKey: 'JWT_SECRET'
```

**Recommended for anything beyond local/dev**: create the Secret yourself
(via `kubectl`, sealed-secrets, External Secrets Operator, etc.) and point
`existingSecret`/`existingSecretKey` at it, rather than putting real
credentials in `values.yaml` or on the Helm command line where they end up
in shell history and `helm get values` output:

```sh
kubectl create secret generic agentic-cms-backend-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/agentic_cms' \
  --from-literal=JWT_SECRET='<32+ random characters>' \
  --from-literal=REDIS_URL='redis://host:6379'
```

```yaml
backend:
  secrets:
    DATABASE_URL:
      existingSecret: agentic-cms-backend-secrets
      existingSecretKey: DATABASE_URL
    JWT_SECRET:
      existingSecret: agentic-cms-backend-secrets
      existingSecretKey: JWT_SECRET
    REDIS_URL:
      existingSecret: agentic-cms-backend-secrets
      existingSecretKey: REDIS_URL
```

Adding another sensitive env var later (e.g. S3 storage credentials, SMTP
password) only means adding another key under `backend.secrets` — the
Deployment and Secret templates loop over that map generically, no template
changes needed.

Non-sensitive backend config (`NODE_ENV`, `CORS_ORIGIN`, `LOG_LEVEL`, storage
adapter settings, etc.) lives under `backend.env` instead, rendered as a
plain ConfigMap.

## 3. Install

```sh
helm install agentic-cms ./helm/agentic-cms \
  --set backend.image.repository=<registry>/agentic-cms-backend \
  --set backend.image.tag=<tag> \
  --set frontend.image.repository=<registry>/agentic-cms-frontend \
  --set frontend.image.tag=<tag> \
  --set ingress.host=cms.example.com \
  -f my-secrets-values.yaml   # the existingSecret block from step 2
```

Or with a values file for everything instead of `--set` flags — see
`values.yaml` for the full set of configurable values (replica counts,
resource requests/limits, autoscaling thresholds, ingress TLS, probe paths).

Verify the chart renders and lints before installing:

```sh
helm lint ./helm/agentic-cms
helm template agentic-cms ./helm/agentic-cms -f my-secrets-values.yaml
```

## 4. Upgrading

```sh
helm upgrade agentic-cms ./helm/agentic-cms \
  --set backend.image.tag=<new-tag> \
  --set frontend.image.tag=<new-tag> \
  -f my-secrets-values.yaml
```

## What's included

| Resource                                      | Backend                                | Frontend                                |
| --------------------------------------------- | -------------------------------------- | --------------------------------------- |
| Deployment                                    | ✓                                      | ✓                                       |
| Service (ClusterIP)                           | ✓                                      | ✓                                       |
| ConfigMap (non-sensitive env)                 | ✓                                      | ✓                                       |
| Secret (sensitive env, generic key/value map) | ✓                                      | — (nothing sensitive today)             |
| Liveness/readiness probes                     | `/health/live`, `/health/ready`        | `/login`                                |
| HorizontalPodAutoscaler                       | ✓ (CPU-based, `backend.autoscaling.*`) | ✓ (CPU-based, `frontend.autoscaling.*`) |
| Ingress (shared, path-based)                  | `/api`, `/health`                      | `/`                                     |

`backend.autoscaling.enabled`/`frontend.autoscaling.enabled` default to
`true`. While enabled, the Deployment's `replicas` field is omitted entirely
(not just set once) — the HPA owns scaling from `minReplicas` upward, and
leaving a static `replicas` in the Deployment would otherwise fight the HPA
back down on every `helm upgrade`. Set to `false` to fall back to a fixed
`replicaCount` instead.

## Out of scope

Per the issue this chart was built for: GitHub Actions deployment automation,
managed database provisioning, and a service mesh are all deliberately not
part of this chart.
