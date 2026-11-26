import type { PageEntry } from '@/types/content.types';
import type { ThemeConfig } from '@/features/theme/types/theme.types';

export type Rec = Record<string, unknown>;

export type RenderMode = 'draft' | 'live';

export type DiagnosticLevel = 'error' | 'warning' | 'info';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface RenderDiagnostic {
  level: DiagnosticLevel;
  code:
    | 'unresolved-token'
    | 'unresolved-slot'
    | 'schema-not-found'
    | 'repeat-no-source'
    | 'repeat-auto-schema'
    | 'repeat-choose-source'
    | 'schema-ambiguous'
    | 'repeat-empty';
  /** The token, slot or schema name the problem is about. */
  key?: string;
  message: string;
}

/** Where a repeating block (feed, grid) can get its items from. */
export interface RenderSources {
  /** Multi-entry schema items, keyed by schema slug. */
  schemas: Record<string, Rec[]>;
  /** Schema used by a repeat block that does not name one (the current page's own). */
  defaultSchema?: string;
  /** Every distinct blog/schema on the site, for the "only one exists" rule. */
  siteSchemaKeys?: string[];
  /** Schema names that exist on several pages (and not on the current one). */
  ambiguousSchemas?: string[];
  /** Standalone content entries, used by `data-cms-collection` blocks. */
  entries: Rec[];
}

export interface MenuLink {
  label: string;
  path: string;
  depth: number;
}

export interface RenderInput {
  /** Older/newer post for `next-post` / `prev-post` links. */
  /** Display names of tags by slug. */
  tagNames?: Record<string, string>;
  neighbors?: { prev: Rec | null; next: Rec | null };
  /** The website's name and logo, for `data-cms-site` blocks. */
  site?: { name: string; logoUrl?: string };
  /** Navigation menus by id, for `data-cms-menu` blocks. */
  menus?: Record<string, MenuLink[]>;
  /** Values of the page being rendered (title, slug, single-entry sections…). */
  page: Rec;
  /** The post/entry being viewed, if any. */
  item: Rec | null;
  sources: RenderSources;
  hrefs: {
    /** Address of a single post. */
    post: (item: Rec) => string;
    /** Address of the page's list view. */
    list: string;
    /** Address of a site page or an external link from a menu. */
    page?: (path: string) => string;
    /** Address of a tag archive. */
    tag?: (slug: string) => string;
  };
}

export interface RenderResult {
  html: string;
  diagnostics: RenderDiagnostic[];
}

export interface PageLayout {
  html: string;
  css: string;
}

export interface SitePage {
  id: string;
  /** Normalized: leading slash, no trailing slash ("/" for the home page). */
  slug: string;
  title: string;
  status: string;
  /** GrapesJS layout, when the page has one. */
  layout: PageLayout | null;
  /** Legacy custom-builder design (array body), when the page has one. */
  customDesign: unknown[] | null;
  /** Page-level values used by tokens (title, slug, single-entry sections…). */
  scope: Rec;
  /** Slug of this page's own multi-entry schema, if any. */
  defaultSchema?: string;
  /** Posts of this page's own multi-entry schema. */
  posts: Rec[];
  /** Search and sharing settings of this page. */
  seo: Rec | null;
  /** All multi-entry schemas on this page, keyed by slug and id. */
  ownSchemas: Record<string, Rec[]>;
  raw: PageEntry;
}

/** A reusable piece of design (header, footer, call-to-action…). */
export interface SiteSection {
  id: string;
  slug: string;
  name: string;
  html: string;
  css: string;
  /** Shown automatically on every page. */
  role: 'header' | 'footer' | null;
}

export interface SiteTag {
  slug: string;
  name: string;
  description?: string;
}

export interface SchemaOwner {
  pageId: string;
  items: Rec[];
}

export interface SiteModel {
  pages: SitePage[];
  /** Which pages carry each schema, keyed by slug and id. */
  schemaOwners: Record<string, SchemaOwner[]>;
  /** Distinct schemas on the site (one entry per schema, by slug or id). */
  schemaKeys: string[];
  entries: Rec[];
  /** Navigation menus by id. */
  menus: Record<string, MenuLink[]>;
  /** Tags used to group posts. */
  tags: SiteTag[];
  /** Approved comments (in Draft mode also those waiting for approval). */
  comments: Rec[];
  /** Reusable sections, including the global header and footer. */
  sections: SiteSection[];
  /** Redirects from an old address to a new one. */
  redirects: { from: string; to: string }[];
  /** Site-wide global theme configuration tokens. */
  theme?: ThemeConfig;
}

export interface RawSchema {
  id?: string;
  slug?: string;
  name?: string;
  entryType?: string;
  items?: Rec[];
  values?: Rec;
  fields?: unknown[];
}

export interface ResolvedPath {
  /** Set when the address is a tag archive (`/blog/tag/ai`). */
  tag?: SiteTag;
  page: SitePage;
  /** The post addressed by the path (`/blog/engineering/my-post`), if any. */
  post: Rec | null;
}

export interface ViewContext {
  site: SiteInfo;
  /** Turns a site address ("/blog/my-post") into the link to use. */
  url: (path: string) => string;
  /** Address used for the canonical link; omit it to leave the link out. */
  canonical?: (path: string) => string;
  comments?: Rec[];
}

export interface RenderedView {
  html: string;
  css: string;
  /** <title>, description and sharing tags for the document head. */
  head: string;
  diagnostics: RenderDiagnostic[];
  /** The post shown, if any. */
  item: Rec | null;
  /** The design came from another page because this one has none. */
  borrowedFrom: SitePage | null;
}

export interface SiteInfo {
  name: string;
  logoUrl?: string;
  seo?: { titleTemplate?: string; description?: string; socialImage?: string };
  /** Public address, e.g. https://myblog.com, used for links in feeds. */
  baseUrl?: string;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  image: string;
  noindex: boolean;
}

export interface ExportedFile {
  path: string;
  content: string;
}

export interface ExportResult {
  files: ExportedFile[];
  /** Pages that were left out, with the reason. */
  skipped: { title: string; reason: string }[];
}

export type ValueKind = 'text' | 'html' | 'image';

export interface Resolved {
  kind: ValueKind;
  value: string;
}

export interface PublishedSiteData {
  entries: PageEntry[];
  site: SiteInfo;
}
