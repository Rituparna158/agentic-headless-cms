# @repo/sdk-core

The official core TypeScript/JavaScript client SDK for **Agentic Headless CMS**.

## Installation

```bash
npm install @repo/sdk-core
# or
pnpm add @repo/sdk-core
```

## Quickstart

```typescript
import { createClient } from '@repo/sdk-core';

const client = createClient({
  baseUrl: 'http://localhost:3000/api/v1',
  apiKey: 'YOUR_API_KEY', // or apiToken: 'BEARER_TOKEN'
  appId: 'HEADLESS_CMS',
});
```

---

## Content Querying & Publication Status

### 1. Published Content by Default

For public consumers (storefronts, marketing websites, mobile apps), queries automatically return **only published entries** (`status: 'published'`). Draft entries are never leaked to unauthenticated or consumer clients.

### 2. Filtering by Status

Authorized editors and administrators can query drafts or specific statuses:

```typescript
// Query published entries explicitly
const published = await client.content.list('articles', {
  status: 'published',
});

// Query draft entries (requires authorized editor/admin credentials)
const drafts = await client.content.list('articles', {
  status: 'draft',
});

// Query all entries regardless of status (Admin Dashboard view)
const allEntries = await client.content.list('articles', {
  status: 'all',
});

// Using nested filters
const filtered = await client.content.list('articles', {
  filters: {
    status: { $eq: 'published' },
  },
});
```

---

## Working with Relation Fields

Relation fields store the **UUID(s) of the related target entry** rather than automatically joining full relational objects:

```typescript
// Fetch article
const article = await client.content.findOne('articles', 'article-uuid');

// If article.data.authorId is a relation field containing 'author-uuid':
const authorId = article.data.authorId as string;

// Fetch the related author entry directly:
const author = await client.content.findOne('authors', authorId);
console.log(author.data.name);
```

_(Deep auto-joins via `?populate=_` are planned for the upcoming v2 release).\*
