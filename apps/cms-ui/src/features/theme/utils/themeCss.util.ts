import type { ThemeTokens } from '../types/theme.types';

/**
 * Compiles theme design tokens into standard CSS variables and targeted
 * global style rules that reliably style real site pages, headers, footers,
 * and builder blocks without clobbering responsive layouts.
 */
export function compileThemeToCss(tokens: ThemeTokens): string {
  const { colors, typography, layout, customCss } = tokens;

  return `
/* Dynamic CMS Theme Variables */
:root {
  --theme-color-primary: ${colors.primary};
  --theme-color-accent: ${colors.accent};
  --theme-color-bg: ${colors.background};
  --theme-color-surface: ${colors.surface};
  --theme-color-text: ${colors.text};
  --theme-color-muted: ${colors.muted};

  --theme-font-heading: ${typography.fontHeading};
  --theme-font-body: ${typography.fontBody};
  --theme-font-size-base: ${typography.baseFontSize};

  --theme-radius: ${layout.borderRadius};
  --theme-max-width: ${layout.containerWidth};
}

/* Base Body & Container Surface */
html, body, .home-page, [class*="-page"], main, [data-cms-body] {
  background-color: var(--theme-color-bg) !important;
  color: var(--theme-color-text) !important;
  font-family: var(--theme-font-body) !important;
  font-size: var(--theme-font-size-base) !important;
}

/* Headings */
h1, h2, h3, h4, h5, h6,
.hero-title, .features-heading, .feature-title,
[data-cms-slot="headline"], [data-cms-slot="section_title"], [data-cms-slot="card_title"] {
  font-family: var(--theme-font-heading) !important;
  color: var(--theme-color-text) !important;
}

/* Paragraphs & Muted Descriptions */
p, .hero-desc, .features-subheading, .feature-desc,
[data-cms-slot="subheading"], [data-cms-slot="card_desc"] {
  font-family: var(--theme-font-body) !important;
  color: var(--theme-color-muted) !important;
}

/* Buttons & CTA Actions */
a.btn-primary, button.btn-primary, .btn-primary, [data-cms-action="primary"], [data-cms-slot="cta_text"] {
  background-color: var(--theme-color-primary) !important;
  color: #ffffff !important;
  border-radius: var(--theme-radius) !important;
}

a.btn-secondary, button.btn-secondary, .btn-secondary, [data-cms-action="secondary"] {
  background-color: var(--theme-color-surface) !important;
  color: var(--theme-color-text) !important;
  border: 1px solid var(--theme-color-muted) !important;
  border-radius: var(--theme-radius) !important;
}

/* Feature Boxes, Cards & Content Blocks */
.feature-box, .cms-card, [data-cms-card], .cms-post-card, article.cms-post-card, .gjs-cell:not(.cms-post-reader) {
  background-color: var(--theme-color-surface) !important;
  border-radius: var(--theme-radius) !important;
  border-color: rgba(120, 120, 120, 0.2) !important;
  color: var(--theme-color-text) !important;
}

/* Standalone Post Reader Reset (Full Blog Page) */
.cms-post-reader, article.cms-post-reader, [data-cms-show="item"] article {
  background-color: transparent !important;
  border-radius: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

/* Modern Editorial & Blog Prose Typography */
.cms-post-reader, article.cms-post-reader, .cms-reader-body, [data-cms-slot="body"], [data-cms-show="item"] {
  color: var(--theme-color-text, #1e293b);
  line-height: 1.8;
  font-size: var(--theme-font-size-base, 16px);
}

.cms-post-reader h1, .cms-reader-body h1, [data-cms-slot="body"] h1 {
  font-family: var(--theme-font-heading, inherit) !important;
  font-size: clamp(2rem, 3.5vw, 2.5rem) !important;
  font-weight: 800 !important;
  color: var(--theme-color-text, #0f172a) !important;
  line-height: 1.25 !important;
  letter-spacing: -0.025em !important;
  margin-top: 2.5rem !important;
  margin-bottom: 1rem !important;
}

.cms-post-reader h2, .cms-reader-body h2, [data-cms-slot="body"] h2 {
  font-family: var(--theme-font-heading, inherit) !important;
  font-size: clamp(1.4rem, 2.5vw, 1.75rem) !important;
  font-weight: 700 !important;
  color: var(--theme-color-text, #0f172a) !important;
  line-height: 1.35 !important;
  letter-spacing: -0.02em !important;
  margin-top: 2.25rem !important;
  margin-bottom: 0.75rem !important;
  padding-bottom: 0.35rem !important;
  border-bottom: 1px solid rgba(120, 120, 120, 0.15) !important;
}

.cms-post-reader h3, .cms-reader-body h3, [data-cms-slot="body"] h3 {
  font-family: var(--theme-font-heading, inherit) !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  color: var(--theme-color-text, #0f172a) !important;
  line-height: 1.4 !important;
  margin-top: 1.75rem !important;
  margin-bottom: 0.5rem !important;
}

.cms-post-reader h4, .cms-reader-body h4, [data-cms-slot="body"] h4 {
  font-family: var(--theme-font-heading, inherit) !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  color: var(--theme-color-text, #0f172a) !important;
  margin-top: 1.5rem !important;
  margin-bottom: 0.5rem !important;
}

.cms-post-reader p, .cms-reader-body p, [data-cms-slot="body"] p {
  margin-top: 0 !important;
  margin-bottom: 1.25rem !important;
  line-height: 1.8 !important;
  color: var(--theme-color-text, #334155) !important;
}

/* Code Blocks (pre & pre code) */
.cms-post-reader pre, .cms-reader-body pre, [data-cms-slot="body"] pre, pre {
  background: #0f172a !important;
  color: #f8fafc !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
  font-size: 0.875rem !important;
  line-height: 1.65 !important;
  padding: 1.25rem 1.5rem !important;
  border-radius: 12px !important;
  overflow-x: auto !important;
  margin: 1.75rem 0 !important;
  border: 1px solid #1e293b !important;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.08) !important;
}

.cms-post-reader pre code, .cms-reader-body pre code, [data-cms-slot="body"] pre code, pre code {
  background: transparent !important;
  color: inherit !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  font-size: inherit !important;
  white-space: pre !important;
}

/* Inline Code (:not(pre) > code) */
.cms-post-reader :not(pre) > code, .cms-reader-body :not(pre) > code, [data-cms-slot="body"] :not(pre) > code, :not(pre) > code {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 0.875em !important;
  padding: 0.2em 0.45em !important;
  border-radius: 6px !important;
  border: 1px solid #e2e8f0 !important;
  font-weight: 500 !important;
}

/* Ordered & Unordered Lists */
.cms-post-reader ul, .cms-reader-body ul, [data-cms-slot="body"] ul {
  list-style-type: disc !important;
  padding-left: 1.75rem !important;
  margin-top: 0.75rem !important;
  margin-bottom: 1.5rem !important;
}

.cms-post-reader ol, .cms-reader-body ol, [data-cms-slot="body"] ol {
  list-style-type: decimal !important;
  padding-left: 1.75rem !important;
  margin-top: 0.75rem !important;
  margin-bottom: 1.5rem !important;
}

.cms-post-reader li, .cms-reader-body li, [data-cms-slot="body"] li {
  margin-top: 0.45rem !important;
  margin-bottom: 0.45rem !important;
  line-height: 1.75 !important;
  color: var(--theme-color-text, #334155) !important;
}

.cms-post-reader ul ul, .cms-post-reader ol ul,
.cms-reader-body ul ul, .cms-reader-body ol ul,
[data-cms-slot="body"] ul ul, [data-cms-slot="body"] ol ul {
  list-style-type: circle !important;
  margin-top: 0.35rem !important;
  margin-bottom: 0.35rem !important;
  padding-left: 1.25rem !important;
}

.cms-post-reader ul ol, .cms-post-reader ol ol,
.cms-reader-body ul ol, .cms-reader-body ol ol,
[data-cms-slot="body"] ul ol, [data-cms-slot="body"] ol ol {
  list-style-type: lower-alpha !important;
  margin-top: 0.35rem !important;
  margin-bottom: 0.35rem !important;
  padding-left: 1.25rem !important;
}

/* Blockquotes */
.cms-post-reader blockquote, .cms-reader-body blockquote, [data-cms-slot="body"] blockquote {
  border-left: 4px solid var(--theme-color-accent, #6366f1) !important;
  padding: 0.75rem 1.25rem !important;
  margin: 1.75rem 0 !important;
  background: var(--theme-color-surface, #f8fafc) !important;
  border-radius: 0 8px 8px 0 !important;
  color: var(--theme-color-muted, #64748b) !important;
  font-style: italic !important;
}

/* Tables */
.cms-post-reader table, .cms-reader-body table, [data-cms-slot="body"] table {
  width: 100% !important;
  border-collapse: collapse !important;
  margin: 2rem 0 !important;
  font-size: 0.95rem !important;
}

.cms-post-reader th, .cms-reader-body th, [data-cms-slot="body"] th {
  background: var(--theme-color-surface, #f8fafc) !important;
  color: var(--theme-color-text, #0f172a) !important;
  font-weight: 600 !important;
  text-align: left !important;
  padding: 0.75rem 1rem !important;
  border-bottom: 2px solid rgba(120, 120, 120, 0.2) !important;
}

.cms-post-reader td, .cms-reader-body td, [data-cms-slot="body"] td {
  padding: 0.75rem 1rem !important;
  border-bottom: 1px solid rgba(120, 120, 120, 0.1) !important;
}

/* Images & Media in Article */
.cms-post-reader img, .cms-reader-body img, [data-cms-slot="body"] img {
  border-radius: 12px !important;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.08) !important;
  margin: 1.5rem auto !important;
  display: block !important;
}

/* Hide broken / empty image placeholders */
img[src=""], img:not([src]) {
  display: none !important;
}
.cms-reader-image-wrap:has(img[src=""]), .cms-reader-image-wrap:has(img:not([src])) {
  display: none !important;
}

/* Badges & Category Tags */
.hero-badge, .feature-tag, [data-cms-slot="card_tag"] {
  color: var(--theme-color-accent) !important;
  background-color: var(--theme-color-surface) !important;
  border: 1px solid var(--theme-color-accent) !important;
  border-radius: 9999px !important;
}

/* Links & Nav Elements */
a {
  color: var(--theme-color-accent);
}
nav a, header a {
  color: var(--theme-color-text) !important;
}
nav a:hover, header a:hover {
  color: var(--theme-color-accent) !important;
}

/* Global Headers & Footers */
header {
  background-color: var(--theme-color-surface) !important;
  border-bottom: 1px solid rgba(120, 120, 120, 0.15) !important;
}
footer {
  border-top: 1px solid rgba(120, 120, 120, 0.15) !important;
}

/* Containers */
.cms-container, [data-cms-container], .features-section, .hero-wrapper {
  max-width: var(--theme-max-width) !important;
}

${customCss || ''}
`.trim();
}
