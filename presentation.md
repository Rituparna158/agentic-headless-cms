---
title: Agentic Headless CMS
theme: corporate
animation: slide-up
overflow: split
---

<!-- layout: title -->
<!-- titleAlign: center -->
<!-- titlePosition: center -->

# Agentic Headless CMS

## Overview & Project Progress

---

## Agenda

<!-- layout: bullets -->

- What is a Headless CMS?
- Architecture & Tech Stack
- Phase 1: Core CMS Engine (Completed)
- Phase 2: Client SDKs (Completed)
- Live Product Demo
- Upcoming Roadmap & Next Steps

<!-- notes -->

Hello everyone. Today we are presenting the progress on our Headless CMS project, covering the completed core engine, the client SDKs, a live demo of the dashboard, and what we are working on next.

<!-- /notes -->

---

<!-- layout: split -->

## What is a Headless CMS?

A Headless CMS separates the **backend content repository** from the **frontend presentation layer**.

- The backend manages and stores content, exposing it through APIs.
- The frontend can be any application—a Next.js website, a mobile app, or any external client.
- This allows multiple platforms to consume the exact same content from one central system.

::col::

### Traditional vs Headless

- **Traditional CMS**: Backend and frontend are tightly coupled together.
- **Headless CMS**: API-driven, flexible, and allows any frontend technology.

<!-- notes -->

To give a quick context: unlike traditional CMS systems where the frontend and backend are tightly coupled, our headless architecture exposes clean APIs so any frontend application can fetch and display content.

<!-- /notes -->

---

<!-- layout: split -->

## System Architecture

Our repository is organized as a monorepo containing:

- **`apps/backend`**: Express API server, REST and GraphQL endpoints, authentication, and database logic.
- **`apps/frontend`**: Admin dashboard built with Next.js App Router for managing content and schemas.
- **`packages/shared-ui`**: Reusable UI component library.
- **`packages/types` & `validation`**: Shared TypeScript types and schema validations.

::col::

### Core Technologies

- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Frontend**: Next.js, TypeScript, Tailwind CSS

<!-- notes -->

Here is our architecture: we use a monorepo structure where the backend handles data and APIs, the frontend provides the admin interface, and shared packages ensure type safety across the whole project.

<!-- /notes -->

---

<!-- layout: statement -->
<!-- align: center -->

# Phase 1: Core CMS Engine

<!-- layout: split -->

## Content & Schemas

The core content authoring system is fully functional:

- **Schema Builder**: Define content structures with custom fields (Text, Rich Text, Number, Boolean, Media, etc.).
- **Content Manager**: Create and edit entries based on defined schemas.
- **Draft & Publish**: Staging workflow to draft changes before publishing them live.
- **Version History**: Track previous revisions with diff view and rollback options.

::col::

### What it solves

Content creators can define their own models and manage content lifecycle directly from the UI without database migrations.

<!-- notes -->

In Phase 1, we built the core content features: users can create custom schemas, write content entries, use draft and publish states, and inspect or restore previous versions.

<!-- /notes -->

---

<!-- layout: split -->

# Phase 1: Core CMS Engine

## Security & Administration

Enterprise access and security features are in place:

- **Authentication & MFA**: User login with Two-Factor Authentication (TOTP authenticator app support).
- **Role-Based Access Control (RBAC)**: Manage roles and configure schema-level permissions (Create, Read, Update, Delete, Publish).
- **API Tokens**: Generate scoped API keys for external applications.
- **Media Library**: Upload, preview, and organize media files in folders.
- **Audit Logs**: Record and view user actions across the system.

::col::

### Security Focus

Gives administrators full control over who can access, edit, or publish content.

<!-- notes -->

For security, we have implemented RBAC for granular permissions, API token management for external clients, 2FA/MFA authentication, and a complete media library.

<!-- /notes -->

---

<!-- layout: split -->

## Phase 2: Client SDKs & Codegen

To make consuming content seamless for developers, we built a complete SDK ecosystem:

- **TypeScript & Node SDKs**: Type-safe API clients for querying content, schemas, and media.
- **React & Next.js SDKs**: Native hooks (`useContent`, `useQuery`) for fast frontend delivery.
- **Automated SDK Codegen (`sdk-codegen`)**: Generates typed client libraries directly from schema definitions.

::col::

### Developer Experience

Developers don't need to write manual API requests or types; the SDK and codegen provide end-to-end type safety out of the box.

<!-- notes -->

In Phase 2, we built the SDK suite and automated codegen: developers get typed SDKs and can generate client types directly from CMS schemas.

<!-- /notes -->

---

<!-- layout: statement -->
<!-- align: center -->

# Live Demonstration

Let's walk through the working application.

---

<!-- layout: split -->

## Demo Walkthrough Checklist

1. **Authentication**: Sign in and view security settings.
2. **Schema Builder**: Creating a schema and configuring field types.
3. **Content Authoring**: Adding an entry, testing Draft vs. Publish, and checking Version History.
4. **Media Library**: Uploading assets and browsing folders.
5. **Roles & API Tokens**: Viewing role permissions and token creation.

::col::

### Local Setup

- **Admin Dashboard**: `http://localhost:3001`
- **Backend API**: `http://localhost:3000/api/v1`

<!-- notes -->

Now let's switch to the live application to see these features in action: from creating schemas to managing content entries and security settings.

<!-- /notes -->

---

<!-- layout: split -->

## Next Steps & Roadmap

What we are planning to work on next:

- **Plugin System (`plugin-sdk`)**: Enabling custom middleware hooks, event listeners, and API routes.
- **UI & Content View Refinements**: Switching content representation to table views and completing audit logs.
- **Agentic AI Assistance**: AI-assisted content drafting, auto-tagging, and schema recommendations.

::col::

### Continuous Improvement

Expanding extensibility and developer tools while keeping the core CMS stable and fast.

<!-- notes -->

Looking forward, our next focus is expanding the plugin ecosystem, polishing the content table and audit views, and integrating AI assistance for editors.

<!-- /notes -->

---

<!-- layout: split -->

## CMS UI & Page Builder (Completed)

We have successfully completed the integration of the `cms_ui`:

- **Authentication**: Secured access to the page builder and UI components, including Single Sign-On (SSO) and Multi-Factor Authentication (MFA).
- **Page Builder Integration**: Connected the CMS data structures directly to frontend rendering.
- **Dynamic Output**: Achieved seamless content delivery to end-user facing applications.

::col::

### Impact

The `cms_ui` provides a robust, out-of-the-box solution for rendering dynamic pages authored in the CMS.

<!-- notes -->

Now let's talk about the CMS UI and Page Builder integration, which is a massive milestone we just completed.

First, on the security front: we haven't just added basic login. We've fully integrated enterprise-grade authentication directly into the page builder. This includes Single Sign-On (SSO) for seamless corporate access and Multi-Factor Authentication (MFA) to ensure all content workflows and user data remain strictly secure.

Second, the Page Builder itself is now fully wired up. The raw data structures and schemas you create in the headless backend are instantly translated into visual frontend components. You can build, preview, and arrange pages dynamically without writing a single line of frontend code.

Ultimately, this means our CMS UI isn't just an admin panel anymore; it's a complete, end-to-end engine for dynamic output, seamlessly delivering the exact content your end-users will see in real-time.

<!-- /notes -->

---

<!-- layout: split -->

## Future Plans: Advanced Templates & Routing

As part of our upcoming plans, we will focus on:

- **Admin Audit Log**: Add a dedicated Audit Log page for the admin view only.
- **Advanced Routing**: Link multiple pages together, and create index pages with nested sub-pages.

::col::

### Custom Templates

We will create custom templates for different kinds of user pages:

- About page
- Custom form
- Footer page
- Custom sidebar
- Search forms
- Nested comments
- Different types of image display sections

<!-- notes -->

In our future plans, we aim to introduce custom templates for various page types like about pages, forms, sidebars, and comments, alongside an admin-only audit log and advanced multi-page linking structures.

<!-- /notes -->

---

<!-- layout: title -->

# Thank You!

## Q&A and Feedback
