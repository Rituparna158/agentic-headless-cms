# Component Catalog & Shared UI System

This document catalogs the design system, reusable UI primitives, layout containers, accessible widgets, and visual builder blocks used across the **Agentic Headless CMS** platform.

---

## Table of Contents

- [1. Design Tokens & Styling Philosophy](#1-design-tokens--styling-philosophy)
- [2. Primitives (`@repo/shared-ui`)](#2-primitives-reposhared-ui)
  - [Button](#button)
  - [Input & Textarea](#input--textarea)
  - [Badge](#badge)
  - [AdvancedTable](#advancedtable)
  - [ToastProvider & useToast](#toastprovider--usetoast)
  - [DialogProvider & useDialog](#dialogprovider--usedialog)
- [3. Application Shell & Studio Widgets (`apps/cms-ui`)](#3-application-shell--studio-widgets-appscms-ui)
  - [PageSideDrawer](#pagesidedrawer)
  - [LiveAnnouncer](#liveannouncer)
  - [InlineErrorAlert](#inlineerroralert)
  - [EmptyStateCard](#emptystatecard)
  - [DeletePageModal](#deletepagemodal)
- [4. Visual Canvas Blocks (GrapesJS)](#4-visual-canvas-blocks-grapesjs)
  - [Block Directory](#block-directory)
  - [Block Anatomy & Slot Hydration](#block-anatomy--slot-hydration)

---

## 1. Design Tokens & Styling Philosophy

The CMS Studio uses a tailored dark-mode aesthetic built on **Tailwind CSS v3**:

- **Color System**:
  - Background: Neutral zinc shades (`#09090b` for canvas shell, `#121215` for drawer headers/panels).
  - Borders: Subtle zinc borders (`border-zinc-800/80` or `border-zinc-700/60`).
  - Primary Accent: Indigo (`#6366f1` / `bg-indigo-600` / `hover:bg-indigo-500`).
  - Status Indicators: Emerald (`#10b981`) for Published/Live, Amber (`#f59e0b`) for Modified/Warning, Rose (`#f43f5e`) for Error/Destructive.
- **Typography**: Clean system sans-serif hierarchy paired with monospaced accents (`font-mono`) for slugs, API IDs, and JSON tokens.
- **Accessibility**: All interactive elements maintain standard 2px focus rings (`focus:ring-2 focus:ring-primary/50`), ARIA expanded/controls attributes, and screen-reader announcements.

---

## 2. Primitives (`@repo/shared-ui`)

Exported from `packages/shared-ui` for consistency across all apps.

### Button

Interactive action trigger supporting multiple semantic visual variants.

```tsx
import { Button } from '@repo/shared-ui';

<Button variant="primary" size="md" onClick={handleSave}>
  Save Changes
</Button>
<Button variant="outline" size="sm" disabled={isPending}>
  Cancel
</Button>
```

- **Variants**: `primary`, `secondary`, `outline`, `ghost`, `destructive`.
- **Sizes**: `sm`, `md`, `lg`.

### Input & Textarea

Form controls with integrated error handling, labels, and placeholder support.

```tsx
import { Input, Textarea } from '@repo/shared-ui';

<Input
  id="slug"
  placeholder="page-slug"
  value={slug}
  onChange={(e) => setSlug(e.target.value)}
  error={errors.slug?.message}
/>;
```

### Badge

Compact visual indicator for entity status, taxonomy, or roles.

```tsx
import { Badge } from '@repo/shared-ui';

<Badge variant="success">Published</Badge>
<Badge variant="neutral">Draft</Badge>
<Badge variant="warning">MFA Challenge</Badge>
```

### AdvancedTable

A full-featured tabular data grid supporting client/server pagination, multi-column sorting, and debounce search filtering.

```tsx
import { AdvancedTable } from '@repo/shared-ui';

<AdvancedTable
  rows={tableRows}
  columns={tableColumns}
  enablePagination={true}
  manualPagination={true}
  totalCount={totalCount}
  page={currentPage}
  pageSize={10}
  onPageChange={(page) => setPage(page)}
  onSortChange={(key, dir) => handleSort(key, dir)}
  searchValue={searchQuery}
  onSearchChange={(query) => setSearchQuery(query)}
  filterPlaceholder="Search collections..."
/>;
```

### ToastProvider & useToast

Global notification system mounted at application root.

```tsx
import { useToast } from '@repo/shared-ui';

function ExampleComponent() {
  const toast = useToast();

  const handlePublish = async () => {
    try {
      await publishPage();
      toast.success('Page published successfully!');
    } catch {
      toast.error('Failed to publish page.');
    }
  };
}
```

### DialogProvider & useDialog

Modal dialog provider for alerts and confirmation dialogs with keyboard trap management.

---

## 3. Application Shell & Studio Widgets (`apps/cms-ui`)

### PageSideDrawer

The slide-over drawer ([PageSideDrawer.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/components/PageSideDrawer/PageSideDrawer.tsx)) is the central workstation for editing page metadata and dynamic custom schemas.

```tsx
<PageSideDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  collection={activeCollection}
  page={selectedPage}
  onSavePage={async (pageId, data, publishImmediately) => {
    await updatePageMutation.mutateAsync({ pageId, data, publishImmediately });
  }}
  isSaving={updatePageMutation.isPending}
/>
```

- **Views**:
  - `table`: Overview of attached schemas on the page.
  - `builder`: Visual schema designer (add/edit fields, field data types, initial values).
  - `form`: Form for entering values for schema fields.
- **Accessibility**: Managed focus trap ([useFocusTrap.ts](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/hooks/useFocusTrap.ts)) keeping keyboard navigation trapped within the drawer while open (`Escape` key to close).

### LiveAnnouncer

Aria-live announcer region ([LiveAnnouncer.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/components/ui/LiveAnnouncer.tsx)) delivering screen-reader updates on background events (e.g. "Auto-saved changes", "Page published live").

### InlineErrorAlert

Local contextual banner ([InlineErrorAlert.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/components/ui/InlineErrorAlert.tsx)) rendering API failures without unmounting UI or blowing out error boundaries.

### EmptyStateCard

Actionable placeholder component ([EmptyStateCard.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/components/ui/EmptyStateCard.tsx)) displayed when collections or search results return zero entries.

### DeletePageModal

Double-confirmation destructive modal ([DeletePageModal.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/collections/components/modals/DeletePageModal.tsx)) requiring explicit action to prevent accidental deletion of live content.

---

## 4. Visual Canvas Blocks (GrapesJS)

### Block Directory

Registered in [CustomBlocksPlugin.ts](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/collections/pages/editors/components/CustomBlocksPlugin.ts) and customizable via settings panels:

| Block Name          | Category      | Editable Attributes                                                 |
| :------------------ | :------------ | :------------------------------------------------------------------ |
| **HeroSection**     | Layout / Hero | Title, Subtitle, CTA Button Label, CTA Link, Background Image       |
| **FeatureGrid**     | Content       | Columns count, Feature Items (Icon, Title, Description)             |
| **PricingTable**    | Commercial    | Tier Names, Monthly/Annual Pricing, Feature Checklists, Button Link |
| **Testimonials**    | Social Proof  | Quote text, Author Name, Author Title, Avatar Image URL             |
| **MapEmbed**        | Embeds        | Latitude, Longitude, Zoom Level, Address string                     |
| **VideoShowcase**   | Media         | Video Embed URL (YouTube, Vimeo, MP4), Autoplay, Aspect Ratio       |
| **DynamicForm**     | Forms         | Form Action URL, Fields array, Submit Button Text                   |
| **FAQ**             | Content       | Accordion questions and answers, initial expanded state             |
| **Navbar & Footer** | Navigation    | Logo URL, Nav Links array, Copyright text                           |

### Block Anatomy & Slot Hydration

Blocks define HTML component structures with data attributes enabling live trait editing in GrapesJS:

```html
<section class="py-20 px-6 bg-zinc-900 text-white" data-gjs-type="hero-section">
  <div class="max-w-5xl mx-auto text-center">
    <h1 class="text-5xl font-bold tracking-tight" data-slot="title">
      Unleash Modern Content
    </h1>
    <p class="mt-4 text-xl text-zinc-400" data-slot="subtitle">
      Powered by an API-first visual architecture.
    </p>
    <a
      href="#"
      class="mt-8 inline-block px-6 py-3 bg-indigo-600 rounded-xl"
      data-slot="cta"
    >
      Get Started
    </a>
  </div>
</section>
```

- **`data-gjs-type`**: Identifies component definition in the GrapesJS model manager.
- **`data-slot`**: Designates editable text regions that sync with component settings panels.
- **Sanitization**: Output is sanitized with DOMPurify on canvas save to ensure clean HTML delivery.
