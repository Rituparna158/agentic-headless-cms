---
id: page-builder
title: Visual Page Builder Guide
sidebar_label: Page Builder
---

# Visual Page Builder Guide

CMS UI includes a visual drag-and-drop page editor built on top of **GrapesJS v0.23**. It runs inside an isolated iframe to provide sandbox protection, preventing admin stylesheet leaks while enabling real-time previewing, style inspection, and dynamic schema binding.

---

## Accessing the Page Builder

1. In the CMS UI sidebar, navigate to **Collections**.
2. Select any collection containing a `page` or layout field type.
3. Click on an entry to open the editor.
4. Select the **Visual Canvas** tab to launch the GrapesJS editor.

---

## Studio Layout

The visual studio is organized into four main functional zones:

```text
+------------------+------------------------------------+------------------+
| Block Palette    | Top Toolbar: Viewports, Undo, Code | Inspector Panel  |
|                  +------------------------------------+                  |
| - Hero Section   |                                    | - Styles         |
| - Feature Grid   |   Sandboxed Iframe Canvas          | - Typography     |
| - Pricing Cards  |   (Isolated DOM & CSS)             | - Spacing        |
| - Media & Text   |                                    | - CMS Traits     |
| - Forms & CTA    |                                    | - Layers Tree    |
+------------------+------------------------------------+------------------+
```

### 1. Top Toolbar Controls

- **Viewport Switcher**: Instantly preview and adjust responsive styles across Desktop (100%), Tablet (768px), and Mobile (320px).
- **History**: Multi-level Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`).
- **Code Viewer**: Inspect generated HTML and CSS markup.
- **Layers**: Toggle the DOM tree hierarchy to select, reorder, or nest components.
- **Fullscreen**: Expand canvas to full-screen editor mode.

### 2. Block Palette

Pre-built components with production styling:

- **Hero Sections**: Full-width banners with headline, subtitle, buttons, and responsive image slots.
- **Feature Grids**: 2-, 3-, and 4-column structured capability cards.
- **Pricing Tables**: Tiered pricing matrices with feature bullet checklists.
- **Media and Text**: Split layouts combining imagery with editorial copy.
- **Call-to-Action**: Conversion banners with button actions.
- **Custom HTML**: Raw markup insertion for arbitrary embeds.

### 3. Canvas and Dynamic Tokens

- Drag blocks directly onto the canvas.
- Double-click any text element to edit inline.
- Bind schema tokens such as `{{title}}`, `{{author}}`, or `{{publishedAt}}`. During live preview, these tokens hydrate directly from the entry's structured dataset.

### 4. Inspector and CMS Traits Panel

- **Style Manager**: Configure typography (font, size, weight, line-height), dimensions (width, height, max-width), margins, paddings, borders, and shadows.
- **CMS Traits**: Connect an element to CMS media library assets, custom links, or schema fields using the Universal CMS Traits plugin.

---

## Media Asset Integration

The page builder integrates directly with the CMS UI Media Library:

1. Select an image component on the canvas.
2. Click the image source input in the traits inspector.
3. The **Media Asset Picker** modal opens, allowing you to select an existing optimized asset or upload a new file directly without leaving the builder.

---

## Autosave and Crash Recovery

Edits made on the canvas are governed by client-side resilience features:

- **Debounced Local Storage**: Every canvas change is buffered to browser storage (`useCanvasAutoSave`).
- **Draft Recovery Banner**: If the browser tab is closed unexpectedly, returning to the page displays a recovery prompt to restore the most recent unsaved local draft.
- **Status Indicator**: Displays real-time saving status (`All changes saved`, `Saving...`, `Unsaved changes`).

---

## Keyboard Shortcuts

| Shortcut                       | Action                    |
| ------------------------------ | ------------------------- |
| `Ctrl + Z` / `Cmd + Z`         | Undo last action          |
| `Ctrl + Y` / `Cmd + Shift + Z` | Redo                      |
| `Ctrl + S` / `Cmd + S`         | Save draft                |
| `Delete` / `Backspace`         | Remove selected component |
| `Esc`                          | Deselect active component |

---

## Publishing Workflow

- **Save Draft**: Persists the serialized GrapesJS JSON tree and sanitized HTML/CSS to the backend database.
- **Live Preview**: Opens the rendered page in a separate viewport with live token hydration.
- **Publish**: Flags the entry as published, making the layout and content instantly available through the Headless REST API and MCP server.
