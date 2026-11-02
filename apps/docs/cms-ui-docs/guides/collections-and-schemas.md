---
id: collections-and-schemas
title: Collections and Schemas Guide
sidebar_label: Collections & Schemas
---

# Collections and Schemas Guide

CMS UI is built directly on top of the Agentic Headless CMS schema engine. It allows content teams and developers to configure flexible content models, create multi-entry collections, manage structured fields, and seamlessly link headless data to visual layouts.

---

## Schema Architecture

In Agentic Headless CMS, all content models are defined as normalized schemas. CMS UI communicates with the backend schema endpoints (`/api/v1/schemas`) using typed contracts validated at runtime with Zod:

- **Schema Metadata**: Each schema contains a human-readable name, a unique URL slug, an optional description, and a layout mode (structured collection or visual page).
- **Field Definitions**: Schemas contain an array of typed field definitions specifying validation rules, default values, and presentation hints.
- **Relational Integrity**: Schemas can establish relational links to other collections (such as linking a Blog Post entry to an Author collection).

---

## Supported Field Types

CMS UI supports a comprehensive set of schema field types:

| Field Type      | UI Component          | Description                                                                  |
| --------------- | --------------------- | ---------------------------------------------------------------------------- |
| **Text**        | Single-line input     | Short strings, titles, subtitles, and external URLs                          |
| **Rich Text**   | Tiptap WYSIWYG editor | Formatted body content with headings, lists, bold/italic, code, and links    |
| **Number**      | Numeric input         | Integers and floating-point values (pricing, counts, order indices)          |
| **Boolean**     | Switch / Checkbox     | Binary flags (featured item, active status, allow comments)                  |
| **Select**      | Dropdown menu         | Predefined single or multi-option choices (category, status, layout variant) |
| **Date / Time** | Date picker           | ISO 8601 timestamps (publication date, event start, expiration)              |
| **Media**       | Asset picker button   | Relational reference to files stored in the Media Library                    |
| **Relation**    | Collection selector   | Foreign key link to entries in other schemas (author, related posts, tags)   |

---

## Multi-Entry Collections

Collections represent repeated datasets where each entry shares the same schema structure. Common collection types include:

- **Blog Posts**: Title, slug, author, cover image, excerpt, body, publication date.
- **Products**: Name, SKU, price, gallery, description, inventory status.
- **Team Members**: Name, position, biography, headshot, social profile URLs.
- **Customer Testimonials**: Client name, company, quote, rating, avatar.

### Managing Collection Entries

1. In the sidebar, navigate to **Collections**.
2. Select your desired collection to view the entry table.
3. The entry table supports search, filtering by status (`Draft`, `Published`), and column sorting.
4. Click **New Entry** to create an item, or click any existing row to edit.

---

## Structured Data vs Visual Pages

CMS UI supports two entry authoring workflows:

### 1. Structured Entries

For content consumed primarily by APIs, mobile apps, or headless frontend frameworks (such as Next.js or Astro), entries are managed via the **PageSideDrawer** form. All field inputs are validated against the schema and saved as clean JSON without presentation markup.

### 2. Visual Layouts with Dynamic Tokens

When an entry is configured for visual presentation (such as a marketing page or case study), the entry combines structured schema data with a GrapesJS canvas layout:

- **Dynamic Token Binding**: The visual canvas can embed tokens such as `{{title}}`, `{{author}}`, and `{{date}}`.
- **Dynamic Repeaters**: Using the `data-cms-repeat="true"` attribute on container elements, the visual builder can dynamically iterate over multiple collection entries (for example, rendering a 3-card blog feed grid).
- **Live Hydration**: During preview and publication, the engine interpolates tokens with the actual values stored in the database.

---

## Draft and Publish Lifecycle

Every collection entry maintains an explicit lifecycle status:

- **Draft**: Changes are saved privately. Draft content is only accessible to authenticated users with preview tokens.
- **Published**: The entry is made publicly available through the headless REST API (`/api/v1/content/:schema/:slug`) and the MCP server for AI agent workflows.
- **Archive / Unpublish**: Revokes public accessibility while retaining the entry record in the database.

---

## Next Steps

- [Visual Page Builder Guide](/cms-ui/docs/guides/page-builder)
- [Media Library Guide](/cms-ui/docs/guides/media-library)
- [Version History and Rollback](/cms-ui/docs/guides/version-history)
