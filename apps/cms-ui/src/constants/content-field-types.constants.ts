import type { DynamicFieldDataType } from '@/types/content.types';

export interface FieldTypeCategoryOption {
  type: DynamicFieldDataType;
  label: string;
}

export interface FieldTypeCategoryGroup {
  groupLabel: string;
  options: FieldTypeCategoryOption[];
}

export const FIELD_DATA_TYPES_META: Array<{
  type: DynamicFieldDataType;
  label: string;
  description: string;
}> = [
  {
    type: 'text',
    label: 'Single-line Text',
    description: 'Titles, names, short identifiers, or SKUs',
  },
  {
    type: 'textarea',
    label: 'Multi-line Text',
    description: 'Summaries, short bios, excerpts, or notes',
  },
  {
    type: 'richtext',
    label: 'Rich Text / HTML / MD',
    description: 'Formatted long content, articles, or product specs',
  },
  {
    type: 'number',
    label: 'Number',
    description: 'Prices, ratings, stock counts, or dimensions',
  },
  {
    type: 'boolean',
    label: 'Boolean',
    description: 'Flags like in-stock, featured, or active',
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Calendar date without time (YYYY-MM-DD)',
  },
  {
    type: 'datetime',
    label: 'Date & Time',
    description: 'Publication dates, deadlines, or event times',
  },
  {
    type: 'media',
    label: 'Media File',
    description: 'Images, videos, PDFs, or asset URLs',
  },
  {
    type: 'color',
    label: 'Color Hex',
    description: 'Hex color code or theme accent (#RRGGBB)',
  },
  {
    type: 'select',
    label: 'Select / Dropdown',
    description: 'Single-select choice from configured options',
  },
  {
    type: 'rating',
    label: 'Star Rating',
    description: 'Numerical rating score from 1 to 5 stars',
  },
  {
    type: 'code',
    label: 'Code / Embed',
    description: 'HTML snippets, embed scripts, or code blocks',
  },
  {
    type: 'relation',
    label: 'Cross-Site Relation',
    description: 'Links to other collection entries or sites',
  },
  {
    type: 'json',
    label: 'Structured JSON',
    description: 'Flexible nested specs, variations, or raw payloads',
  },
];

export const FIELD_TYPE_GROUPS: FieldTypeCategoryGroup[] = [
  {
    groupLabel: 'Text & Content',
    options: [
      { type: 'text', label: 'Single-line Text' },
      { type: 'textarea', label: 'Multi-line Text (Paragraph)' },
      { type: 'richtext', label: 'Rich Text / Markdown' },
    ],
  },
  {
    groupLabel: 'Media & Links',
    options: [{ type: 'media', label: 'Media (Image / Asset URL)' }],
  },
  {
    groupLabel: 'Numbers & Values',
    options: [
      { type: 'number', label: 'Numeric Value' },
      { type: 'boolean', label: 'Boolean Flag (True / False)' },
      { type: 'rating', label: 'Star Rating (1 - 5)' },
    ],
  },
  {
    groupLabel: 'Dates & Times',
    options: [
      { type: 'date', label: 'Date (Calendar)' },
      { type: 'datetime', label: 'Date & Time' },
    ],
  },
  {
    groupLabel: 'Advanced & Design',
    options: [
      { type: 'color', label: 'Color Picker (Hex)' },
      { type: 'code', label: 'Code Snippet / Embed' },
      { type: 'json', label: 'Structured JSON Payload' },
      { type: 'relation', label: 'Cross-Site Relation' },
    ],
  },
];
