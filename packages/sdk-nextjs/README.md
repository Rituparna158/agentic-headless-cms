# @repo/sdk-nextjs

The official Next.js App Router SDK for **Agentic Headless CMS**, designed for React Server Components, Server Actions, and Draft Mode preview.

## Installation

```bash
npm install @repo/sdk-nextjs @repo/sdk-core
# or
pnpm add @repo/sdk-nextjs @repo/sdk-core
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
import { getContentList, getContentEntry } from '@repo/sdk-nextjs';

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
import { getContentEntry } from '@repo/sdk-nextjs';

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
import { getContentEntry } from '@repo/sdk-nextjs';

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
