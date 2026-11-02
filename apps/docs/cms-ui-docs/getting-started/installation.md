---
id: installation
title: Installation and Setup
sidebar_label: Installation
---

# Installation and Setup

CMS UI can be installed and executed using two primary methods depending on your environment:

- **Method 1: Local Monorepo Setup**: Best for development and customization of the Studio, schemas, and custom GrapesJS blocks.
- **Method 2: Docker Compose Deployment**: Best for running the full platform with PostgreSQL, Redis, Backend API, Web Frontend, and the Nginx Gateway.

---

## System Requirements

Verify that your local system satisfies the following minimum requirements:

| Dependency           | Minimum Version | Recommended | Notes                                               |
| :------------------- | :-------------- | :---------- | :-------------------------------------------------- |
| **Node.js**          | `v20.9.0`       | `v22.x LTS` | Required for local monorepo development             |
| **pnpm**             | `v9.0.0`        | `v9.15.x`   | Monorepo package manager (`npm i -g pnpm`)          |
| **Docker & Compose** | `v24.0+`        | Latest      | Manages database, cache, and containerized services |
| **PostgreSQL**       | `v15.0+`        | `v16.x`     | Relational content and schema storage               |
| **Redis**            | `v7.0+`         | `v7.2+`     | Cache layer and task queues                         |

---

## Method 1: Local Monorepo Setup

This method runs CMS UI locally via Vite alongside the backend API and database.

### 1. Clone the Monorepo

```bash
git clone https://github.com/mindfiredigital/agentic-headless-cms.git
cd agentic-headless-cms
pnpm install
```

### 2. Start PostgreSQL and Redis

Start the containerized backing services using Docker Compose:

```bash
docker compose up -d postgres redis
```

- **PostgreSQL**: Port `5432` (Default database: `agentic_cms`)
- **Redis**: Port `6379`

### 3. Run Migrations and Seed Admin User

Initialize the database schema and create the default administrator account:

```bash
# Run database migrations
pnpm db:migrate

# Seed administrator credentials
pnpm seed:admin
```

Default seeded credentials:

- **Email**: `admin@agentic-cms.com`
- **Password**: `admin` (or `Password123!` depending on `.env` configuration)

### 4. Configure CMS UI Environment

Create the environment file inside `apps/cms-ui/`:

```bash
cp apps/cms-ui/.env.example apps/cms-ui/.env
```

Default variables in `apps/cms-ui/.env`:

```env
VITE_API_URL=/api/v1
VITE_ENVIRONMENT=development
VITE_APP_ID=CMS_UI
```

| Variable           | Description                                          | Default       |
| ------------------ | ---------------------------------------------------- | ------------- |
| `VITE_API_URL`     | Base endpoint for the backend API                    | `/api/v1`     |
| `VITE_ENVIRONMENT` | Build mode (`development`, `production`, `test`)     | `development` |
| `VITE_APP_ID`      | Identifier sent in `X-App-Id` headers for audit logs | `CMS_UI`      |

### 5. Start the Development Servers

To start all services concurrently:

```bash
pnpm dev
```

Or run CMS UI independently:

```bash
pnpm --filter cms-ui dev
```

### Local Port Allocation

| Service                  | Local URL             | Port |
| ------------------------ | --------------------- | ---- |
| **CMS UI Studio**        | http://localhost:3003 | 3003 |
| **Backend API**          | http://localhost:3000 | 3000 |
| **Web Frontend**         | http://localhost:3001 | 3001 |
| **Documentation Portal** | http://localhost:3002 | 3002 |

---

## Method 2: Docker Compose Deployment (Nginx Gateway)

The project includes a production-ready `docker-compose.yml` that orchestrates all services behind an Nginx reverse proxy gateway on port **80**.

### 1. Launch All Services

From the monorepo root:

```bash
docker compose up -d
```

This launches the following containers:

- `postgres`: PostgreSQL 16 database
- `redis`: Redis 7 cache and job queue
- `backend`: Express REST API and MCP server (internal port 3000)
- `worker`: Background asynchronous worker
- `frontend`: Next.js public web application
- `cms-ui`: Vite / Nginx studio container (internal port 5173)
- `gateway`: Nginx reverse proxy routing port 80 traffic

### 2. Accessing the Applications via Nginx Gateway

When running via Docker Compose, all HTTP traffic flows through the Nginx gateway on port **80**:

| Application          | Gateway URL            | Routing Behavior                             |
| -------------------- | ---------------------- | -------------------------------------------- |
| **CMS UI Studio**    | http://cms.localhost   | Direct proxy to `cms-ui` container           |
| **CMS UI Alternate** | http://admin.localhost | Direct proxy to `cms-ui` container           |
| **Admin Redirect**   | http://localhost/admin | HTTP 302 redirect to `http://cms.localhost/` |
| **Web Frontend**     | http://localhost       | Direct proxy to `frontend` container         |
| **Backend REST API** | http://localhost/api/  | Direct proxy to `backend` container          |
| **API Subdomain**    | http://api.localhost   | Direct proxy to `backend` container          |

### 3. Local Subdomain Resolution Note

Modern web browsers (including Google Chrome, Microsoft Edge, and Mozilla Firefox) automatically resolve any `*.localhost` domain (such as `cms.localhost` or `api.localhost`) to `127.0.0.1` without manual configuration.

If your operating system or local DNS resolver does not resolve subdomains automatically, add the following entry to your `/etc/hosts` file (or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```text
127.0.0.1 cms.localhost admin.localhost api.localhost
```

---

## First Login and MFA Setup

1. Open **http://localhost:3003** (Method 1) or **http://cms.localhost** (Method 2).
2. Enter the administrator credentials:
   - **Email**: `admin@agentic-cms.com`
   - **Password**: `admin`
3. On first login, the system will prompt you to configure Multi-Factor Authentication (TOTP). Scan the QR code using any standard authenticator app (Google Authenticator, Authy, or 1Password) and submit the verification code to complete sign-in.

---

## Next Steps

- [Introduction to CMS UI](/cms-ui/docs/getting-started/introduction)
- [Visual Page Builder Guide](/cms-ui/docs/guides/page-builder)
- [Collections and Schemas Guide](/cms-ui/docs/guides/collections-and-schemas)
- [Media Library Guide](/cms-ui/docs/guides/media-library)
