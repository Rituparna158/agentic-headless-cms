# @repo/sdk-react

The official React hooks and provider for **Agentic Headless CMS**, powered by TanStack React Query.

## Installation

```bash
npm install @repo/sdk-react @repo/sdk-core @tanstack/react-query
# or
pnpm add @repo/sdk-react @repo/sdk-core @tanstack/react-query
```

## Quickstart

Wrap your application tree in `<CmsProvider>`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CmsProvider } from '@repo/sdk-react';
import App from './App';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <CmsProvider
      baseUrl="http://localhost:3000/api/v1"
      apiKey="YOUR_API_KEY"
      appId="HEADLESS_CMS"
    >
      <App />
    </CmsProvider>
  </QueryClientProvider>,
);
```

---

## Published vs. Draft Content

By default, the `useContentList` hook retrieves **only published entries** for public consumers:

```tsx
import { useContentList } from '@repo/sdk-react';

function BlogFeed() {
  // Returns published articles by default
  const { data, isLoading } = useContentList('articles', {
    page: 1,
    pageSize: 10,
  });

  // Filter explicitly by status or nested filter:
  const { data: drafts } = useContentList('articles', {
    status: 'draft', // Requires authorized editor credentials
  });

  return (
    <div>
      {data?.data.map((post) => (
        <h2 key={post.id}>{post.data.title}</h2>
      ))}
    </div>
  );
}
```

---

## Working with Relation Fields

Relation fields in Agentic CMS store the UUID of the related entry:

```tsx
import { useContentEntry } from '@repo/sdk-react';

function ArticleWithAuthor({ articleId }: { articleId: string }) {
  const { data: article } = useContentEntry('articles', articleId);
  const authorId = article?.data?.authorId as string | undefined;

  // Query the related author using their UUID
  const { data: author } = useContentEntry('authors', authorId || '', {
    // Only runs query once authorId is available
  });

  return (
    <article>
      <h1>{article?.data?.title}</h1>
      <p>Written by: {author?.data?.name || 'Loading author...'}</p>
    </article>
  );
}
```
