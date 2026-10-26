# @repo/sdk-node

The official Node.js server-side SDK for **Agentic Headless CMS**, featuring filesystem media streaming, administrative management, and script automation.

## Installation

```bash
npm install @repo/sdk-node @repo/sdk-core
# or
pnpm add @repo/sdk-node @repo/sdk-core
```

## Quickstart

Configure environment variables or pass options to `createNodeClient`:

```typescript
import { createNodeClient } from '@repo/sdk-node';

// Automatically resolves CMS_API_URL and CMS_API_TOKEN from process.env
const client = createNodeClient();

// Or with explicit options:
const client = createNodeClient({
  baseUrl: 'http://localhost:3000/api/v1',
  apiToken: 'YOUR_API_TOKEN',
  appId: 'HEADLESS_CMS',
});
```

---

## Content Querying & Publication Status

### 1. Published Content by Default

Public consumer queries return **only published entries** (`status: 'published'`):

```typescript
const published = await client.content.list('articles', {
  page: 1,
  pageSize: 10,
});
```

### 2. Querying Drafts & All Statuses

Backend workers and automation scripts can query drafts or all statuses:

```typescript
// Query draft entries
const drafts = await client.content.list('articles', {
  status: 'draft',
});

// Query all entries regardless of status
const allEntries = await client.content.list('articles', {
  status: 'all',
});
```

---

## Filesystem Media Upload

Upload files directly from the local filesystem path:

```typescript
const asset = await client.media.uploadFromPath('./images/hero.png', {
  altText: 'Hero banner',
});

console.log(`Uploaded asset: ${asset.url}`);
```

---

## Working with Relation Fields

Relation fields store the **UUID of the related entry**:

```typescript
// Fetch article
const article = await client.content.findOne('articles', 'article-uuid');
const authorId = article.data.authorId as string;

// Resolve target author
const author = await client.content.findOne('authors', authorId);
console.log(author.data.name);
```
