# @mindfiredigital/sdk-nextjs

The official Next.js App Router SDK for **Agentic Headless CMS**, designed for React Server Components, Server Actions, and Draft Mode preview.

## Installation

```bash
npm install @mindfiredigital/sdk-nextjs @mindfiredigital/sdk-core
# or
pnpm add @mindfiredigital/sdk-nextjs @mindfiredigital/sdk-core
```

## Configuration

Set the environment variables in your Next.js project (`.env.local`):

```env
CMS_API_URL=http://localhost:3000
CMS_API_TOKEN=your_service_or_api_token
CMS_APP_ID=HEADLESS_CMS
```

---

## Quickstart

Fetch content directly inside any React Server Component:

```tsx
import { getContentList, getContentEntry } from '@mindfiredigital/sdk-nextjs';

export default async function BlogPage() {
  const { data: articles } = await getContentList('articles', {
    page: 1,
    pageSize: 10,
  });

  return (
    <main>
      <h1>Articles</h1>
      <ul>
        {articles.map((article) => (
          <li key={article.id}>{article.data.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

---

## Content Publication Status & Draft Mode

### 1. Published Content by Default

Queries return **only published entries** (`publishedData`) for public consumers. Drafts are never leaked to public routes:

```typescript
// Returns only published entries
const published = await getContentList('articles');
```

### 2. Previewing Drafts

Pass `draft: true` when Draft Mode is enabled to preview unpublished content:

```tsx
import { draftMode } from 'next/headers';
import { getContentEntry } from '@mindfiredigital/sdk-nextjs';

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isEnabled: isDraft } = await draftMode();

  const article = await getContentEntry('articles', id, {
    draft: isDraft,
  });

  return (
    <article>
      {isDraft && <p>Preview Mode Active</p>}
      <h1>{article.data.title}</h1>
    </article>
  );
}
```

---

## Working with Relation Fields

Relation fields store the **UUID of the related entry**:

```tsx
import { getContentEntry } from '@mindfiredigital/sdk-nextjs';

export default async function Article({ id }: { id: string }) {
  const article = await getContentEntry('articles', id);
  const authorId = article.data.authorId as string;

  // Resolve relation via target UUID
  const author = await getContentEntry('authors', authorId);

  return (
    <div>
      <h1>{article.data.title}</h1>
      <p>Author: {author.data.name}</p>
    </div>
  );
}
```

---

## Metadata & Static Params Helpers

### `generateMetadataFromEntry`

By default, `generateMetadataFromEntry` selects the first `text` or `richtext` schema field as `title`, the second `text` or `richtext` field as `description`, and the first `media` field as the OpenGraph image (automatically resolving media asset UUID strings via `getMediaAsset()`).

If your schema defines a non-title field first (such as `slug`), pass explicit field overrides, and pass `draft: true` inside Draft Mode routes:

```tsx
import { draftMode } from 'next/headers';
import { generateMetadataFromEntry } from '@mindfiredigital/sdk-nextjs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { isEnabled: isDraft } = await draftMode();

  return generateMetadataFromEntry('articles', id, {
    draft: isDraft,
    titleField: 'title',
    descriptionField: 'excerpt',
    imageField: 'coverImage',
  });
}
```

### `generateCmsStaticParams`

`generateCmsStaticParams` infers the returned param key type from `paramKey` (defaulting to `'slug'`) so Next.js 16 route type validation passes cleanly:

```tsx
export async function generateStaticParams() {
  // Uses `entry.data.slug` when present, or `entry.id` when `idAsSlug: true`
  return generateCmsStaticParams('articles', {
    paramKey: 'id',
    idAsSlug: true,
  });
}
```

---

## Rich Text (`richtext`) & Lexical JSON Format

Rich-text fields in Headless CMS are stored as serialized **Lexical editor JSON**:

```json
{
  "root": {
    "children": [
      {
        "children": [{ "text": "Hello world", "type": "text", "version": 1 }],
        "type": "paragraph",
        "version": 1
      }
    ],
    "type": "root",
    "version": 1
  }
}
```

Use the exported `toPlainText` helper to extract clean plain text (supporting serialized Lexical JSON, parsed Lexical objects, and HTML strings) for excerpts or metadata, or render the parsed Lexical state with `@lexical/react`:

```tsx
import { toPlainText } from '@mindfiredigital/sdk-nextjs';

const summary = toPlainText(article.data.body);
```

---

## Next.js 16 `cacheComponents: true` Compatibility

If your Next.js 16 app enables `experimental.cacheComponents: true` (or `cacheComponents: true` in `next.config.ts`):

- **Do not** export `export const dynamic = 'force-dynamic'` — Next.js 16 rejects route segment config `dynamic` when `cacheComponents` is active.
- Wrap components calling `draftMode()`, `cookies()`, `headers()`, or uncached `getContentList` / `getContentEntry` fetches inside a `<Suspense>` boundary:

```tsx
import { Suspense } from 'react';
import { draftMode } from 'next/headers';
import { getContentList } from '@mindfiredigital/sdk-nextjs';

async function ArticlesSection() {
  const { isEnabled: isDraft } = await draftMode();
  const { data } = await getContentList('articles', { draft: isDraft });
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>{String(item.data.title)}</li>
      ))}
    </ul>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<p>Loading articles...</p>}>
      <ArticlesSection />
    </Suspense>
  );
}
```

- For dynamic request-time rendering without prerender errors outside static shell routes, call `await connection()` from `next/server` inside the `<Suspense>` subtree.
