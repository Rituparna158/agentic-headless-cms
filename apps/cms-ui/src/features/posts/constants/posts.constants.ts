import {
  DynamicFieldDataType,
  DynamicSchemaDefinition,
  CrossSiteSharedTemplate,
} from '../types/posts.types';

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
  {
    type: 'enum',
    label: 'Enumeration / Enum',
    description: 'Predefined options like Status, Category, or Brand',
  },
  {
    type: 'url',
    label: 'External URL',
    description: 'Canonical web links or affiliate references',
  },
  {
    type: 'email',
    label: 'Email Address',
    description: 'Contact emails or notification recipients',
  },
];

export interface FieldTypeCategoryGroup {
  groupLabel: string;
  options: Array<{
    type: DynamicFieldDataType;
    label: string;
  }>;
}

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
    options: [
      { type: 'media', label: 'Media (Image / Asset URL)' },
      { type: 'url', label: 'External Web URL' },
      { type: 'email', label: 'Email Address' },
    ],
  },
  {
    groupLabel: 'Numbers & Values',
    options: [
      { type: 'number', label: 'Numeric Value' },
      { type: 'rating', label: 'Star Rating (1-5)' },
    ],
  },
  {
    groupLabel: 'Controls & Selectors',
    options: [
      { type: 'boolean', label: 'Boolean Switch' },
      { type: 'select', label: 'Dropdown Select' },
      { type: 'color', label: 'Color Hex / Swatch' },
    ],
  },
  {
    groupLabel: 'Dates & Times',
    options: [
      { type: 'date', label: 'Date (YYYY-MM-DD)' },
      { type: 'datetime', label: 'Date & Time' },
    ],
  },
  {
    groupLabel: 'Advanced',
    options: [
      { type: 'code', label: 'Code / Embed Snippet' },
      { type: 'json', label: 'Structured JSON' },
    ],
  },
];

export const STARTER_SCHEMAS: Record<
  'ecommerce' | 'posts' | 'realestate',
  DynamicSchemaDefinition
> = {
  ecommerce: {
    name: 'E-Commerce Products',
    slug: 'products',
    description: 'Online store product catalog with pricing, SKU, and specs',
    type: 'collection',
    fields: [
      {
        apiId: 'title',
        displayName: 'Product Title',
        dataType: 'text',
        isRequired: true,
        sortOrder: 0,
      },
      {
        apiId: 'slug',
        displayName: 'URL Slug',
        dataType: 'text',
        isRequired: true,
        sortOrder: 1,
      },
      {
        apiId: 'price',
        displayName: 'Price ($)',
        dataType: 'number',
        isRequired: true,
        sortOrder: 2,
      },
      {
        apiId: 'sku',
        displayName: 'SKU Code',
        dataType: 'text',
        isRequired: false,
        sortOrder: 3,
      },
      {
        apiId: 'in_stock',
        displayName: 'In Stock',
        dataType: 'boolean',
        isRequired: false,
        sortOrder: 4,
      },
      {
        apiId: 'rating',
        displayName: 'Rating (1-5)',
        dataType: 'number',
        isRequired: false,
        sortOrder: 5,
      },
      {
        apiId: 'description_html',
        displayName: 'Product Description (HTML/MD)',
        dataType: 'richtext',
        isRequired: false,
        sortOrder: 6,
      },
    ],
  },
  posts: {
    name: 'Universal Posts & Content',
    slug: 'posts',
    description:
      'Dynamic content schema with flexible body container supporting HTML, Markdown, and composed blocks',
    type: 'collection',
    fields: [
      {
        apiId: 'title',
        displayName: 'Title',
        dataType: 'text',
        isRequired: true,
        sortOrder: 0,
      },
      {
        apiId: 'slug',
        displayName: 'URL Slug',
        dataType: 'text',
        isRequired: true,
        sortOrder: 1,
      },
      {
        apiId: 'body',
        displayName: 'Body (HTML / MD / Blocks / Any Data)',
        dataType: 'json',
        isRequired: false,
        sortOrder: 2,
      },
      {
        apiId: 'excerpt',
        displayName: 'Short Excerpt',
        dataType: 'text',
        isRequired: false,
        sortOrder: 3,
      },
      {
        apiId: 'author',
        displayName: 'Author Name',
        dataType: 'text',
        isRequired: false,
        sortOrder: 4,
      },
    ],
  },
  realestate: {
    name: 'Real Estate Listings',
    slug: 'properties',
    description: 'Property catalog with location, pricing, and specs',
    type: 'collection',
    fields: [
      {
        apiId: 'title',
        displayName: 'Property Name',
        dataType: 'text',
        isRequired: true,
        sortOrder: 0,
      },
      {
        apiId: 'slug',
        displayName: 'URL Slug',
        dataType: 'text',
        isRequired: true,
        sortOrder: 1,
      },
      {
        apiId: 'price',
        displayName: 'Listing Price ($)',
        dataType: 'number',
        isRequired: true,
        sortOrder: 2,
      },
      {
        apiId: 'bedrooms',
        displayName: 'Bedrooms',
        dataType: 'number',
        isRequired: false,
        sortOrder: 3,
      },
      {
        apiId: 'location',
        displayName: 'City / Location',
        dataType: 'text',
        isRequired: true,
        sortOrder: 4,
      },
      {
        apiId: 'description_html',
        displayName: 'Full Details (HTML/MD)',
        dataType: 'richtext',
        isRequired: false,
        sortOrder: 5,
      },
    ],
  },
};

export const FORKABLE_SHARED_TEMPLATES: CrossSiteSharedTemplate[] = [
  {
    id: 'tpl-amazon-product-showcase',
    title: 'Amazon-Style Product Detail & Gallery',
    category: 'ecommerce',
    description:
      'High-converting product showcase with title, dynamic price badge, SKU tag, stock indicator, and rich HTML specs.',
    isPublic: true,
    forkCount: 42,
    authorSite: 'Global Retail Hub',
    schema: STARTER_SCHEMAS.ecommerce,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Product Title',
        fieldApiId: 'title',
        fieldType: 'text',
      },
      {
        slotId: 'slot-price',
        label: 'Price Display',
        fieldApiId: 'price',
        fieldType: 'number',
      },
      {
        slotId: 'slot-sku',
        label: 'SKU Tag',
        fieldApiId: 'sku',
        fieldType: 'text',
      },
      {
        slotId: 'slot-body',
        label: 'Specs & Description',
        fieldApiId: 'description_html',
        fieldType: 'richtext',
      },
    ],
  },
  {
    id: 'tpl-editorial-post',
    title: 'Modern Editorial Article & Story Layout',
    category: 'blog',
    description:
      'Clean typography layout supporting raw HTML, markdown headings, author byline, and responsive content column.',
    isPublic: true,
    forkCount: 88,
    authorSite: 'Media Central',
    schema: STARTER_SCHEMAS.posts,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Article Title',
        fieldApiId: 'title',
        fieldType: 'text',
      },
      {
        slotId: 'slot-excerpt',
        label: 'Summary / Excerpt',
        fieldApiId: 'excerpt',
        fieldType: 'text',
      },
      {
        slotId: 'slot-author',
        label: 'Author Name',
        fieldApiId: 'author',
        fieldType: 'text',
      },
      {
        slotId: 'slot-body',
        label: 'HTML / Markdown Body',
        fieldApiId: 'body_html',
        fieldType: 'richtext',
      },
    ],
  },
  {
    id: 'tpl-luxury-property-listing',
    title: 'Luxury Property & Real Estate Card',
    category: 'real-estate',
    description:
      'Visual showcase with prominent pricing, bedroom count badge, location header, and expandable amenities.',
    isPublic: true,
    forkCount: 19,
    authorSite: 'Prime Realty Network',
    schema: STARTER_SCHEMAS.realestate,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Property Title',
        fieldApiId: 'title',
        fieldType: 'text',
      },
      {
        slotId: 'slot-price',
        label: 'Listing Price',
        fieldApiId: 'price',
        fieldType: 'number',
      },
      {
        slotId: 'slot-location',
        label: 'Location',
        fieldApiId: 'location',
        fieldType: 'text',
      },
      {
        slotId: 'slot-body',
        label: 'Property Details',
        fieldApiId: 'description_html',
        fieldType: 'richtext',
      },
    ],
  },
];

export const POSTS_SHARED_TEMPLATES_STORAGE_KEY =
  'agentic_cms_shared_templates_v1';
export const POSTS_FORKED_TEMPLATES_STORAGE_KEY =
  'agentic_cms_forked_templates_v1';
