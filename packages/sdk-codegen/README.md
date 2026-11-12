# @mindfiredigital/sdk-codegen

CLI code generation utility for **Agentic Headless CMS**. Generates TypeScript types directly from live CMS schemas.

## Installation

```bash
npm install -D @mindfiredigital/sdk-codegen
# or run via npx
npx @mindfiredigital/sdk-codegen --help
```

## Usage

Generate TypeScript interfaces from your CMS API schemas:

```bash
npx cms-codegen --url http://localhost:3000 --output ./types/cms.ts
# Also accepts URLs with a trailing /api/v1 suffix (automatically normalized)
npx cms-codegen --url http://localhost:3000/api/v1 --output ./types/cms.ts
```

### Options

- `--url <url>`: Base URL of the CMS API (e.g. `http://localhost:3000` or `http://localhost:3000/api/v1`)
- `--output <path>`: Output path for the generated TypeScript file (e.g. `./src/types/cms.ts`)
- `--token <token>`: (Optional) CMS user session JWT token for schema inspection
- `--apiKey <key>`: (Optional) CMS database API key for schema inspection

### Using Generated Types with SDK Clients

The generator emits entry interfaces, `export type CmsContentMap`, and `MediaAsset`:

```ts
import { getCmsClient } from '@mindfiredigital/sdk-nextjs';
import type { CmsContentMap } from './types/cms';

const client = getCmsClient<CmsContentMap>();
const { data } = await client.content.list('articles');
```

- `media` fields are typed as `string | MediaAsset` (unpopulated REST responses return media asset UUIDs; populated responses return `MediaAsset`).
- `relation` fields are typed as `string | { id: string }` (unpopulated REST responses return the target entry UUID string).
