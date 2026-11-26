import type {
  DynamicFieldDefinition,
  DynamicFieldDataType,
} from '@/types/content.types';
import type { BlogTypeDefinition, BlogFieldInput } from '../types/blog.types';

export type { BlogTypeDefinition, BlogFieldInput };

export const BLOG_CORE_FIELDS = {
  title: 'title',
  excerpt: 'excerpt',
  author: 'author',
  date: 'date',
  cover: 'cover_image_url',
  content: 'content',
} as const;

export const BLOG_FONT_FAMILY =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;";

export const BLOG_FIELD_TYPE_OPTIONS: Array<{
  value: DynamicFieldDataType;
  label: string;
}> = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'richtext', label: 'Formatted text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'Link' },
  { value: 'media', label: 'Image' },
  { value: 'select', label: 'Dropdown' },
  { value: 'boolean', label: 'Yes / No' },
];

export const LOCKED_BLOG_FIELDS = new Set(['title']);

const field = (
  { apiId, label, type, required, help, options }: BlogFieldInput,
  sortOrder: number,
): DynamicFieldDefinition => ({
  apiId,
  displayName: label,
  dataType: type,
  isRequired: Boolean(required),
  sortOrder,
  config: {
    ...(help ? { help } : {}),
    ...(options
      ? { options: options.map((o) => ({ label: o, value: o })) }
      : {}),
  },
  options: options?.map((o) => ({ label: o, value: o })),
});

const build = (inputs: BlogFieldInput[]): DynamicFieldDefinition[] =>
  inputs.map((f, i) => field(f, i));

export const BLOG_TYPES: BlogTypeDefinition[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    postLabel: 'Engineering post',
    emoji: '🛠️',
    description: 'Deep dives, architecture notes and lessons from the team.',
    fields: build([
      { apiId: 'title', label: 'Title', type: 'text', required: true },
      {
        apiId: 'excerpt',
        label: 'Summary',
        type: 'textarea',
        required: true,
        help: 'One or two sentences shown on the blog list.',
      },
      {
        apiId: 'cover_image_url',
        label: 'Cover image',
        type: 'media',
        required: true,
      },
      { apiId: 'content', label: 'Article', type: 'richtext', required: true },
      { apiId: 'author', label: 'Author', type: 'text', required: true },
      { apiId: 'date', label: 'Publish date', type: 'date' },
      {
        apiId: 'tags',
        label: 'Tags',
        type: 'text',
        help: 'Separate with commas, e.g. react, performance',
      },
      {
        apiId: 'reading_time',
        label: 'Reading time',
        type: 'text',
        help: 'e.g. 6 min read',
      },
      { apiId: 'repo_url', label: 'Code repository link', type: 'url' },
    ]),
  },
  {
    id: 'news',
    name: 'News & Announcements',
    postLabel: 'News post',
    emoji: '📰',
    description: 'Company news, press updates and announcements.',
    fields: build([
      { apiId: 'title', label: 'Headline', type: 'text', required: true },
      { apiId: 'excerpt', label: 'Summary', type: 'textarea', required: true },
      { apiId: 'content', label: 'Story', type: 'richtext', required: true },
      { apiId: 'date', label: 'Publish date', type: 'date', required: true },
      { apiId: 'cover_image_url', label: 'Cover image', type: 'media' },
      { apiId: 'author', label: 'Author', type: 'text' },
      {
        apiId: 'location',
        label: 'Location',
        type: 'text',
        help: 'City or region the news relates to.',
      },
      { apiId: 'source', label: 'Source', type: 'text' },
    ]),
  },
  {
    id: 'product-updates',
    name: 'Product Updates',
    postLabel: 'Product update',
    emoji: '🚀',
    description: 'Release notes and what is new in your product.',
    fields: build([
      { apiId: 'title', label: 'Title', type: 'text', required: true },
      {
        apiId: 'version',
        label: 'Version',
        type: 'text',
        required: true,
        help: 'e.g. 2.4.0',
      },
      { apiId: 'excerpt', label: 'Summary', type: 'textarea', required: true },
      {
        apiId: 'content',
        label: 'Release notes',
        type: 'richtext',
        required: true,
      },
      { apiId: 'date', label: 'Release date', type: 'date', required: true },
      {
        apiId: 'highlights',
        label: 'Highlights',
        type: 'textarea',
        help: 'One highlight per line.',
      },
      { apiId: 'cover_image_url', label: 'Cover image', type: 'media' },
      { apiId: 'author', label: 'Author', type: 'text' },
    ]),
  },
  {
    id: 'case-studies',
    name: 'Case Studies',
    postLabel: 'Case study',
    emoji: '📊',
    description: 'Customer success stories with clear results.',
    fields: build([
      { apiId: 'title', label: 'Title', type: 'text', required: true },
      { apiId: 'excerpt', label: 'Summary', type: 'textarea', required: true },
      { apiId: 'client', label: 'Client name', type: 'text', required: true },
      {
        apiId: 'cover_image_url',
        label: 'Cover image',
        type: 'media',
        required: true,
      },
      {
        apiId: 'challenge',
        label: 'The challenge',
        type: 'textarea',
        required: true,
      },
      {
        apiId: 'solution',
        label: 'The solution',
        type: 'textarea',
        required: true,
      },
      {
        apiId: 'results',
        label: 'The results',
        type: 'textarea',
        required: true,
      },
      { apiId: 'content', label: 'Full story', type: 'richtext' },
      { apiId: 'industry', label: 'Industry', type: 'text' },
      { apiId: 'client_logo', label: 'Client logo', type: 'media' },
      {
        apiId: 'key_metrics',
        label: 'Key metrics',
        type: 'textarea',
        help: 'One metric per line, e.g. "40% faster onboarding".',
      },
      { apiId: 'testimonial', label: 'Testimonial', type: 'textarea' },
      { apiId: 'author', label: 'Author', type: 'text' },
      { apiId: 'date', label: 'Publish date', type: 'date' },
    ]),
  },
  {
    id: 'tutorials',
    name: 'Tutorials & Guides',
    postLabel: 'Tutorial',
    emoji: '🎓',
    description: 'Step-by-step how-tos and learning content.',
    fields: build([
      { apiId: 'title', label: 'Title', type: 'text', required: true },
      { apiId: 'excerpt', label: 'Summary', type: 'textarea', required: true },
      {
        apiId: 'difficulty',
        label: 'Difficulty',
        type: 'select',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced'],
      },
      { apiId: 'content', label: 'Tutorial', type: 'richtext', required: true },
      {
        apiId: 'duration',
        label: 'Time to complete',
        type: 'text',
        help: 'e.g. 20 minutes',
      },
      {
        apiId: 'prerequisites',
        label: 'Prerequisites',
        type: 'textarea',
        help: 'What the reader should know first.',
      },
      { apiId: 'cover_image_url', label: 'Cover image', type: 'media' },
      { apiId: 'author', label: 'Author', type: 'text' },
      { apiId: 'date', label: 'Publish date', type: 'date' },
    ]),
  },
  {
    id: 'opinion',
    name: 'Opinion & Editorial',
    postLabel: 'Opinion piece',
    emoji: '✍️',
    description: 'Thought leadership and personal viewpoints.',
    fields: build([
      { apiId: 'title', label: 'Title', type: 'text', required: true },
      { apiId: 'author', label: 'Byline', type: 'text', required: true },
      { apiId: 'content', label: 'Article', type: 'richtext', required: true },
      { apiId: 'excerpt', label: 'Summary', type: 'textarea' },
      { apiId: 'cover_image_url', label: 'Cover image', type: 'media' },
      { apiId: 'date', label: 'Publish date', type: 'date' },
    ]),
  },
  {
    id: 'events',
    name: 'Events & Webinars',
    postLabel: 'Event',
    emoji: '🎤',
    description: 'Announce talks, webinars and meetups.',
    fields: build([
      { apiId: 'title', label: 'Event title', type: 'text', required: true },
      { apiId: 'date', label: 'Event date', type: 'date', required: true },
      {
        apiId: 'location',
        label: 'Location or link',
        type: 'text',
        required: true,
      },
      { apiId: 'excerpt', label: 'Summary', type: 'textarea' },
      { apiId: 'content', label: 'Description', type: 'richtext' },
      { apiId: 'speaker', label: 'Speaker', type: 'text' },
      { apiId: 'cover_image_url', label: 'Cover image', type: 'media' },
      { apiId: 'author', label: 'Organizer', type: 'text' },
    ]),
  },
];

export const getBlogType = (id: string | undefined) =>
  BLOG_TYPES.find((t) => t.id === id);

export type BlogShowcaseLayout = 'grid' | 'magazine' | 'list' | 'minimal';

export interface BlogLayoutOption {
  id: BlogShowcaseLayout;
  name: string;
  description: string;
  badge: string;
}

export const BLOG_LAYOUT_OPTIONS: BlogLayoutOption[] = [
  {
    id: 'grid',
    name: 'Modern Grid',
    description:
      'Clean responsive card grid with aspect-ratio cover images and meta badges.',
    badge: 'Popular',
  },
  {
    id: 'magazine',
    name: 'Featured Magazine',
    description:
      'Prominent full-width hero story on top followed by an editorial card grid.',
    badge: 'Editorial',
  },
  {
    id: 'list',
    name: 'Editorial List',
    description:
      'Medium / Substack style horizontal feed with side thumbnails and clean dividers.',
    badge: 'Minimal',
  },
  {
    id: 'minimal',
    name: 'Compact Minimal',
    description:
      'Typography-focused compact cards with high whitespace and elegant typography.',
    badge: 'Fast',
  },
];

/** Fields every custom blog type starts with, so templates stay connected. */
export const CUSTOM_BLOG_BASE_FIELDS: DynamicFieldDefinition[] = build([
  { apiId: 'title', label: 'Title', type: 'text', required: true },
  { apiId: 'excerpt', label: 'Summary', type: 'textarea', required: true },
  { apiId: 'cover_image_url', label: 'Cover image', type: 'media' },
  { apiId: 'content', label: 'Article', type: 'richtext', required: true },
  { apiId: 'author', label: 'Author', type: 'text' },
  { apiId: 'date', label: 'Publish date', type: 'date' },
]);
