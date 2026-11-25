import {
  type DynamicFieldDataType,
  type DynamicSchemaDefinition,
  type CrossSiteSharedTemplate,
  type FieldTypeCategoryGroup,
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
  | 'ecommerce'
  | 'retail'
  | 'saas'
  | 'portfolio'
  | 'posts'
  | 'realestate'
  | 'restaurant'
  | 'education',
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
  retail: {
    name: 'Retail & Fashion Boutique Catalog',
    slug: 'boutique-products',
    description:
      'Editorial boutique product catalog with seasonal drops, designer spotlight, and lookbooks',
    type: 'collection',
    fields: [
      {
        apiId: 'title',
        displayName: 'Garment / Item Name',
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
        apiId: 'brand',
        displayName: 'Brand / Atelier',
        dataType: 'text',
        isRequired: false,
        sortOrder: 2,
      },
      {
        apiId: 'price',
        displayName: 'Retail Price ($)',
        dataType: 'number',
        isRequired: true,
        sortOrder: 3,
      },
      {
        apiId: 'collection_drop',
        displayName: 'Seasonal Drop',
        dataType: 'text',
        isRequired: false,
        sortOrder: 4,
      },
      {
        apiId: 'lookbook_tag',
        displayName: 'Lookbook Category',
        dataType: 'text',
        isRequired: false,
        sortOrder: 5,
      },
      {
        apiId: 'in_stock',
        displayName: 'Available to Order',
        dataType: 'boolean',
        isRequired: false,
        sortOrder: 6,
      },
      {
        apiId: 'description_html',
        displayName: 'Lookbook Story & Specs (HTML)',
        dataType: 'richtext',
        isRequired: false,
        sortOrder: 7,
      },
    ],
  },
  saas: {
    name: 'SaaS Features & Subscription Plans',
    slug: 'saas-features',
    description:
      'Tech startup features, monthly/annual tiers, API capabilities, and cloud limits',
    type: 'collection',
    fields: [
      {
        apiId: 'name',
        displayName: 'Feature / Plan Name',
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
        apiId: 'tier',
        displayName: 'Subscription Tier',
        dataType: 'text',
        isRequired: false,
        sortOrder: 2,
      },
      {
        apiId: 'monthly_price',
        displayName: 'Monthly Price ($)',
        dataType: 'number',
        isRequired: false,
        sortOrder: 3,
      },
      {
        apiId: 'annual_price',
        displayName: 'Annual Price ($)',
        dataType: 'number',
        isRequired: false,
        sortOrder: 4,
      },
      {
        apiId: 'is_popular',
        displayName: 'Featured Popular Badge',
        dataType: 'boolean',
        isRequired: false,
        sortOrder: 5,
      },
      {
        apiId: 'cta_label',
        displayName: 'Action Button Label',
        dataType: 'text',
        isRequired: false,
        sortOrder: 6,
      },
      {
        apiId: 'description_html',
        displayName: 'Details & Feature Checklist',
        dataType: 'richtext',
        isRequired: false,
        sortOrder: 7,
      },
    ],
  },
  portfolio: {
    name: 'Agency Case Studies & Creative Work',
    slug: 'case-studies',
    description:
      'Visual portfolio case studies with client briefs, metrics, and art direction',
    type: 'collection',
    fields: [
      {
        apiId: 'title',
        displayName: 'Case Study Title',
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
        apiId: 'client',
        displayName: 'Client Name',
        dataType: 'text',
        isRequired: true,
        sortOrder: 2,
      },
      {
        apiId: 'discipline',
        displayName: 'Creative Discipline',
        dataType: 'text',
        isRequired: false,
        sortOrder: 3,
      },
      {
        apiId: 'year',
        displayName: 'Project Year',
        dataType: 'text',
        isRequired: false,
        sortOrder: 4,
      },
      {
        apiId: 'metrics_summary',
        displayName: 'Impact Metric',
        dataType: 'text',
        isRequired: false,
        sortOrder: 5,
      },
      {
        apiId: 'description_html',
        displayName: 'Project Story & Gallery (HTML)',
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
  restaurant: {
    name: 'Culinary Menus & Hospitality Offerings',
    slug: 'menu-items',
    description:
      'Chef seasonal dishes, tasting courses, wine cellars, and dietary flags',
    type: 'collection',
    fields: [
      {
        apiId: 'title',
        displayName: 'Dish / Beverage Title',
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
        apiId: 'menu_section',
        displayName: 'Menu Section',
        dataType: 'text',
        isRequired: true,
        sortOrder: 2,
      },
      {
        apiId: 'price',
        displayName: 'Price ($)',
        dataType: 'number',
        isRequired: true,
        sortOrder: 3,
      },
      {
        apiId: 'dietary_tags',
        displayName: 'Dietary Notes (e.g. GF, V)',
        dataType: 'text',
        isRequired: false,
        sortOrder: 4,
      },
      {
        apiId: 'chef_recommended',
        displayName: 'Chef Specialty',
        dataType: 'boolean',
        isRequired: false,
        sortOrder: 5,
      },
      {
        apiId: 'description_html',
        displayName: 'Ingredients & Preparation',
        dataType: 'richtext',
        isRequired: false,
        sortOrder: 6,
      },
    ],
  },
  education: {
    name: 'Academy Masterclasses & Courses',
    slug: 'courses',
    description:
      'Online learning courses, syllabus breakdown, instructor accreditation, and certificates',
    type: 'collection',
    fields: [
      {
        apiId: 'title',
        displayName: 'Course Title',
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
        apiId: 'instructor',
        displayName: 'Lead Instructor',
        dataType: 'text',
        isRequired: true,
        sortOrder: 2,
      },
      {
        apiId: 'level',
        displayName: 'Difficulty Level',
        dataType: 'text',
        isRequired: false,
        sortOrder: 3,
      },
      {
        apiId: 'duration_hours',
        displayName: 'Total Hours',
        dataType: 'number',
        isRequired: false,
        sortOrder: 4,
      },
      {
        apiId: 'price',
        displayName: 'Tuition Fee ($)',
        dataType: 'number',
        isRequired: false,
        sortOrder: 5,
      },
      {
        apiId: 'certificate',
        displayName: 'Certificate Included',
        dataType: 'boolean',
        isRequired: false,
        sortOrder: 6,
      },
      {
        apiId: 'description_html',
        displayName: 'Curriculum & Learning Outcomes',
        dataType: 'richtext',
        isRequired: false,
        sortOrder: 7,
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
    id: 'tpl-retail-boutique-store',
    title: 'Modern Retail & Fashion Boutique',
    category: 'retail',
    description:
      'Editorial-grade luxury fashion and lifestyle storefront with curated seasonal drops, lookbook grids, designer spotlight, and styling concierge.',
    isPublic: true,
    forkCount: 37,
    authorSite: 'Atelier & Co.',
    schema: STARTER_SCHEMAS.retail,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Item Name',
        fieldApiId: 'title',
        fieldType: 'text',
      },
      {
        slotId: 'slot-brand',
        label: 'Brand / Atelier',
        fieldApiId: 'brand',
        fieldType: 'text',
      },
      {
        slotId: 'slot-price',
        label: 'Retail Price',
        fieldApiId: 'price',
        fieldType: 'number',
      },
      {
        slotId: 'slot-drop',
        label: 'Collection Drop',
        fieldApiId: 'collection_drop',
        fieldType: 'text',
      },
      {
        slotId: 'slot-body',
        label: 'Story & Garment Specs',
        fieldApiId: 'description_html',
        fieldType: 'richtext',
      },
    ],
  },
  {
    id: 'tpl-saas-software-platform',
    title: 'SaaS & Cloud Software Platform',
    category: 'saas',
    description:
      'Modern software startup layout featuring interactive hero banners, monthly/annual tiered pricing tables, developer API highlights, and SOC-2 trust badges.',
    isPublic: true,
    forkCount: 56,
    authorSite: 'DevScale Systems',
    schema: STARTER_SCHEMAS.saas,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Plan / Feature Name',
        fieldApiId: 'name',
        fieldType: 'text',
      },
      {
        slotId: 'slot-tier',
        label: 'Tier Identifier',
        fieldApiId: 'tier',
        fieldType: 'text',
      },
      {
        slotId: 'slot-price',
        label: 'Monthly Rate',
        fieldApiId: 'monthly_price',
        fieldType: 'number',
      },
      {
        slotId: 'slot-cta',
        label: 'Button Action',
        fieldApiId: 'cta_label',
        fieldType: 'text',
      },
      {
        slotId: 'slot-body',
        label: 'Feature Checklist & Details',
        fieldApiId: 'description_html',
        fieldType: 'richtext',
      },
    ],
  },
  {
    id: 'tpl-agency-portfolio-studio',
    title: 'Digital Agency & Creative Studio',
    category: 'portfolio',
    description:
      'Bold creative portfolio showcase with client case studies, dynamic project grids, studio practice pillars, and creative brief kickoff inquiries.',
    isPublic: true,
    forkCount: 29,
    authorSite: 'Studio Vanguard',
    schema: STARTER_SCHEMAS.portfolio,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Case Study Title',
        fieldApiId: 'title',
        fieldType: 'text',
      },
      {
        slotId: 'slot-client',
        label: 'Client Name',
        fieldApiId: 'client',
        fieldType: 'text',
      },
      {
        slotId: 'slot-discipline',
        label: 'Design Discipline',
        fieldApiId: 'discipline',
        fieldType: 'text',
      },
      {
        slotId: 'slot-body',
        label: 'Case Study Summary',
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
  {
    id: 'tpl-restaurant-culinary-spot',
    title: 'Culinary Bistro & Restaurant Hospitality',
    category: 'restaurant',
    description:
      'Warm hospitality dining showcase with seasonal chef tasting menus, online table reservation forms, dietary tags, and private event packages.',
    isPublic: true,
    forkCount: 24,
    authorSite: 'Bistrot Gourmet',
    schema: STARTER_SCHEMAS.restaurant,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Dish Name',
        fieldApiId: 'title',
        fieldType: 'text',
      },
      {
        slotId: 'slot-section',
        label: 'Menu Course',
        fieldApiId: 'menu_section',
        fieldType: 'text',
      },
      {
        slotId: 'slot-price',
        label: 'Item Price',
        fieldApiId: 'price',
        fieldType: 'number',
      },
      {
        slotId: 'slot-body',
        label: 'Ingredients & Preparation',
        fieldApiId: 'description_html',
        fieldType: 'richtext',
      },
    ],
  },
  {
    id: 'tpl-education-academy-course',
    title: 'Online Academy & Course Masterclass',
    category: 'course',
    description:
      'Curriculum-driven online academy with structured lesson syllabus, difficulty badges, instructor accreditation, and student certification enrollment.',
    isPublic: true,
    forkCount: 45,
    authorSite: 'EduPrime Global',
    schema: STARTER_SCHEMAS.education,
    slots: [
      {
        slotId: 'slot-title',
        label: 'Course Title',
        fieldApiId: 'title',
        fieldType: 'text',
      },
      {
        slotId: 'slot-instructor',
        label: 'Lead Instructor',
        fieldApiId: 'instructor',
        fieldType: 'text',
      },
      {
        slotId: 'slot-level',
        label: 'Difficulty Level',
        fieldApiId: 'level',
        fieldType: 'text',
      },
      {
        slotId: 'slot-body',
        label: 'Syllabus & Outcomes',
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

export const POSTS_PAGE_SIZE = 10;
