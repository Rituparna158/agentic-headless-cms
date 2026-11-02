---
id: introduction
title: Introduction to CMS UI
sidebar_label: Introduction
---

# Introduction to CMS UI

CMS UI is the visual studio and content administration interface built directly on top of the Agentic Headless CMS. It transforms a decoupled, API-first headless backend into a complete content management experience for editors, marketers, and developers.

While traditional headless CMS solutions force content teams to work with raw form fields or rely on developers for layout adjustments, CMS UI combines the flexibility of headless content schemas with visual drag-and-drop page composition.

---

## Built on Top of Headless CMS

CMS UI is not an isolated tool; it natively integrates with the Agentic Headless CMS core architecture:

### Schema System Integration

CMS UI directly consumes and extends the schema engine defined in CMS Core (`/api/v1/schemas`). Any content model configured in the headless backend—whether created via database migrations, the API, or the UI—is immediately available in CMS UI:

- **Field Definitions**: Supports text, rich text (Tiptap), numbers, booleans, dropdown selections, date/time pickers, media attachments, and relational foreign keys.
- **Validation Rules**: Runtime schema validation is enforced via Zod contracts on both the client and server.
- **Multi-Entry Collections**: Manage structured datasets (blog posts, products, team members, documentation articles) with individual entry drafts and publication states.

### Dual-Builder Architecture

To maintain architectural separation of concerns, CMS UI implements a dual-builder pattern:

1. **Structured Schema Layer (PageSideDrawer)**
   - Content fields are entered through structured input drawers and stored as normalized JSON in PostgreSQL.
   - This structured data remains decoupled from presentation, ready for consumption by external frontends (Next.js), mobile applications, and AI agents via REST and MCP servers.

2. **Visual Presentation Layer (GrapesJS Canvas)**
   - For landing pages and marketing layouts, editors can design layouts visually using GrapesJS in an isolated iframe.
   - The visual builder reads the structured schema definitions and provides dynamic tokens (such as `{{title}}`, `{{author}}`, and `{{excerpt}}`) that automatically hydrate with live collection data.

---

## Core Capabilities

### Visual Page Builder

- Drag-and-drop canvas with pre-built production blocks (Hero, Feature Grid, Pricing, CTA, Testimonials).
- Responsive breakpoint switcher supporting Desktop (100%), Tablet (768px), and Mobile (320px).
- Element-level style inspector for typography, dimensions, spacing, flexbox, borders, and shadows.

### Centralized Media Library

- Manage images, videos, and documents with folder organization and search.
- Integrated directly into the visual page builder through the Media Asset Picker modal.

### Automated Snapshots and Rollback

- Point-in-time version history snapshots stored in PostgreSQL.
- Review past revisions with side-by-side comparison and perform one-click rollbacks.

### Tamper-Evident Audit Logs

- Immutable audit log tracking every login, schema modification, content update, and publication event.
- Includes actor identity, IP address, timestamp, and payload diffs for compliance.

### Enterprise Access Control and MFA

- Cookie-based session authentication with TOTP Multi-Factor Authentication.
- Role-Based Access Control (RBAC) with fine-grained capabilities (`manage_users`, `manage_content`).

---

## Next Steps

- [Installation and Setup](/cms-ui/docs/getting-started/installation)
- [Visual Page Builder Guide](/cms-ui/docs/guides/page-builder)
- [Collections and Schemas Guide](/cms-ui/docs/guides/collections-and-schemas)
- [Media Library Guide](/cms-ui/docs/guides/media-library)
- [Version History and Rollback](/cms-ui/docs/guides/version-history)
- [Audit Logs and Governance](/cms-ui/docs/guides/audit-logs)
- [Access Control and RBAC](/cms-ui/docs/guides/access-control)
