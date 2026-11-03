# ADR-0001: Selection of GrapesJS as the Visual Page Builder Engine

## Status

**Accepted** (Date: 2026-08-15)

## Context

The **Agentic Headless CMS** is fundamentally designed as an API-first content platform operated by both human teams and AI agents. While traditional headless CMS solutions restrict editing to form fields and structured JSON, modern digital marketing and editorial teams require visual WYSIWYG composition (drag-and-drop landing page assembly, responsive multi-column layouts, visual style tweaks, and live preview).

We needed an interactive page builder engine within `apps/cms-ui` satisfying the following requirements:

1. **Canvas Style Isolation**: The admin dashboard's dark-mode styles must not bleed into the page being edited, and vice versa.
2. **Framework-Agnostic Output**: Pages must export clean, standard HTML and CSS suitable for consumption by downstream web renderers (Next.js, Astro, Nuxt) without requiring a proprietary runtime.
3. **Responsive Breakpoints**: Native ability to toggle canvas viewports between Desktop (1200px+), Tablet (768px), and Mobile (375px).
4. **Rich Extensibility**: Ability to register custom modular blocks (Hero banners, Pricing grids, Testimonial sliders, Dynamic forms) with configurable attribute settings.
5. **Asset & Layer Management**: Visual hierarchy tree and style manager out of the box.

---

## Options Considered

### Option 1: Document/Rich-Text Editors with Custom Block Embeds (Lexical / Slate / TipTap)

- **Strengths**: Lightweight, fast load times, excellent prose editing, minimal bundle overhead.
- **Weaknesses**: Primarily linear document models (paragraphs, headings, blockquotes). Building flexible 2D grid layouts, responsive column wrapping, absolute/flex styling, and complex interactive landing pages requires massive bespoke extensions.

### Option 2: React-Native Page Builder Frameworks (Craft.js)

- **Strengths**: Native React components render directly on canvas; leverages existing React design systems.
- **Weaknesses**:
  - The canvas shares the same DOM tree as the studio, leading to CSS class name collisions and unpredictable style bleeding.
  - High state re-render overhead on every drag-and-drop interaction.
  - Exported pages require a React runtime and component registry on the consuming client to rehydrate.

### Option 3: In-House Custom Drag-and-Drop Canvas (HTML5 DnD / dnd-kit)

- **Strengths**: Complete control over behavior, zero third-party dependencies, exact tailored fit.
- **Weaknesses**: Prohibitive ongoing development and maintenance costs. Features like style managers, layer trees, undo/redo stacks, media asset pickers, and cross-browser iframe message passing would divert significant engineering effort from core CMS capabilities.

### Option 4: GrapesJS (DOM-Level Visual Builder Engine)

- **Strengths**:
  - **Iframe Sandboxing**: Canvas runs in an isolated `<iframe>`, ensuring 100% style isolation between dashboard UI and canvas document.
  - **Mature Ecosystem**: Built-in Command, Layer, Asset, and Style managers.
  - **Pure Standards-Based Output**: Directly produces clean HTML, CSS, and structured block JSON without requiring client-side runtime libraries.
  - **Block Plugin Architecture**: Clean APIs (`editor.BlockManager.add`) to register custom CMS components.
- **Weaknesses**:
  - Relatively large library footprint (~350 kB uncompressed).
  - DOM-centric architecture requires careful lifecycle management inside React 19 functional components.

---

## Decision

We chose **Option 4: GrapesJS**, integrating it into `apps/cms-ui` through a dedicated React wrapper component ([GrapesJSEditor.tsx](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/collections/pages/editors/GrapesJSEditor.tsx)).

### Key Architectural Implementations:

1. **Dynamic Code-Splitting**: GrapesJS and its plugin suite (`grapesjs-blocks-basic`, `grapesjs-plugin-forms`, `grapesjs-preset-webpage`) are isolated into dynamic imports and dedicated Rollup manual chunks (`manualChunks` in [vite.config.ts](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/vite.config.ts)). This prevents GrapesJS from bloating the initial studio entry chunk.
2. **Custom CMS Block Registry**: Reusable custom blocks ([CustomBlocksPlugin.ts](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/collections/pages/editors/components/CustomBlocksPlugin.ts)) are registered with dynamic attributes and slot placeholders (Hero, Feature Grid, CTA Banner, Pricing, Testimonials).
3. **Security Sanitization**: All canvas output is passed through [template-sanitizer.util.ts](file:///home/sobhan-sahoo/code/agentic-headless-cms/apps/cms-ui/src/features/collections/utils/template-sanitizer.util.ts) (DOMPurify) before serialization to strip unauthorized `<script>`, `<iframe>`, or event handler vectors.

---

## Consequences

### Positive

- Marketing teams gain a visual, responsive landing page builder without compromising the headless nature of the CMS.
- Frontends (Next.js) can render published pages server-side directly using clean HTML/CSS with zero hydration overhead.
- Total styling isolation is guaranteed via iframe sandboxing.

### Trade-offs & Mitigations

- **Bundle Footprint**: Mitigated by Rollup manual chunking (`grapesjs` chunk is only loaded when navigating to `/collections/:slug/:pageId`).
- **React 19 Compatibility**: Lifecycle mounted strictly via `useEffect` with strict cleanup (`editor.destroy()`) on unmount.
