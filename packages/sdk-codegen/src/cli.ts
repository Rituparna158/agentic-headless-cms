#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import type { SchemaRecord } from '@repo/types';
import { generateTypes } from './generators/type-generator.js';

interface ProgramOptions {
  url: string;
  token?: string;
  apiKey?: string;
  output: string;
}

// Simple helper to load local .env variables manually so we don't need any external dependencies
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env.development'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../../.env.local'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...values] = trimmed.split('=');
            const val = values
              .join('=')
              .trim()
              .replace(/^['"]|['"]$/g, '');
            const cleanKey = key?.trim();
            if (cleanKey && val && !process.env[cleanKey]) {
              process.env[cleanKey] = val;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

loadEnv();

const program = new Command();

program
  .name('cms-codegen')
  .description('Auto-generate TypeScript types from live schema definitions')
  .option(
    '--url <url>',
    'Base URL of the running CMS instance',
    process.env.CMS_API_URL ||
      process.env.NEXT_PUBLIC_CMS_API_URL ||
      'http://localhost:3000',
  )
  .option(
    '--token <token>',
    'API auth token (Bearer)',
    process.env.CMS_API_TOKEN,
  )
  .option(
    '--apiKey <apiKey>',
    'Database API Key (x-api-key)',
    process.env.CMS_API_KEY,
  )
  .option(
    '--output <output>',
    'Path to write the generated TypeScript file',
    './apps/frontend/types.ts',
  )
  .action(async (options: ProgramOptions) => {
    const { url, token, apiKey, output } = options;
    const baseUrl = url.replace(/\/$/, '');

    if (!token && !apiKey) {
      console.error(
        'Error: You must provide either a user session --token or a database --apiKey.',
      );
      process.exit(1);
    }

    try {
      console.log(`Connecting to CMS at: ${baseUrl}...`);

      const headers: Record<string, string> = {
        'x-app-id': 'HEADLESS_CMS',
        Accept: 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const response = await fetch(`${baseUrl}/api/v1/schemas?pageSize=1000`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch schemas: HTTP ${response.status} ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as {
        success: boolean;
        data?: {
          data?: unknown[];
        };
        message?: string;
      };

      if (
        !payload.success ||
        !payload.data ||
        !Array.isArray(payload.data.data)
      ) {
        throw new Error(
          payload.message ||
            'Invalid API response structure from schemas endpoint',
        );
      }

      const schemas = payload.data.data as SchemaRecord[];
      console.log(`Fetched ${schemas.length} schema definitions.`);

      const generatedCode = generateTypes(schemas);

      const outputPath = path.resolve(output);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, generatedCode, 'utf8');

      console.log(`Successfully generated types file at: ${outputPath}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Codegen failed: ${message}`);
      process.exit(1);
    }
  });

export { program };

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  program.parse(process.argv);
}
