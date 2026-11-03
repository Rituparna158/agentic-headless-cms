/**
 * Centralized environment configuration for the frontend application.
 * All access to process.env in the frontend should go through this file
 * to ensure consistency and easy tracking.
 */
export const env = {
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  API_INTERNAL_URL: process.env.API_INTERNAL_URL ?? 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
} as const;
