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
```

### Options

- `--url <url>`: The base URL of the CMS API (e.g. `http://localhost:3000`)
- `--output <path>`: The output path for the generated TypeScript file (e.g. `./src/types/cms.ts`)
- `--token <token>`: (Optional) CMS API token for protected schema inspection
