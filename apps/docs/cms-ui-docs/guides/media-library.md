---
id: media-library
title: Media Library Guide
sidebar_label: Media Library
---

# Media Library Guide

CMS UI provides a centralized digital asset management interface designed for organizing, searching, and inserting media files across both structured schemas and visual page builder layouts.

---

## Overview

The Media Library (`/media`) interacts directly with the backend storage adapter (supporting local filesystem storage or S3-compatible cloud buckets). All uploaded assets are indexed in PostgreSQL with full metadata, including dimensions, file size, MIME type, and attribution.

---

## Key Features

### 1. Folder-Based Organization

- Create hierarchical folders to categorize assets by project, campaign, or media type (for example, `/blog/covers`, `/marketing/banners`, `/avatars`).
- Drag-and-drop or move assets between folders.
- Search across all folders or limit queries to the active directory.

### 2. Multi-Format Asset Support

The library supports all common web media formats:

- **Images**: JPEG, PNG, WebP, SVG, AVIF, GIF
- **Documents**: PDF, CSV, TXT
- **Media**: MP4, WebM audio and video files

### 3. File Metadata Inspection

Clicking any asset card opens the details panel, which displays:

- Asset preview thumbnail
- Original filename and generated storage key
- File dimensions (width x height in pixels)
- File size (formatted in KB or MB)
- MIME type and creation timestamp
- Direct public URL for external CDN or frontend consumption

---

## Integration with Visual Page Builder

The Media Library is embedded directly into the GrapesJS visual editor:

1. When editing an image or background block on the canvas, select the element.
2. In the right-hand **CMS Traits Panel**, click **Choose Media Asset**.
3. The **Media Asset Picker** modal opens on top of the canvas.
4. You can select an existing image or click **Upload** to add a new file immediately.
5. Selecting the asset automatically populates the image URL on the canvas element.

---

## Integration with Schema Fields

For structured collections that define a `media` field type (such as an article cover image or author headshot):

1. Open the collection entry in the **PageSideDrawer**.
2. Click the **Select Media** button on the media field input.
3. Choose the asset from the picker modal and confirm.
4. The media record ID and URL are saved as part of the entry's JSON payload.

---

## Next Steps

- [Visual Page Builder Guide](/cms-ui/docs/guides/page-builder)
- [Collections and Schemas Guide](/cms-ui/docs/guides/collections-and-schemas)
- [Audit Logs and Governance](/cms-ui/docs/guides/audit-logs)
