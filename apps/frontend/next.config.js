/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle (only the production deps this app
  // actually traces to) into .next/standalone — the Docker image copies just
  // that instead of the full monorepo node_modules.
  output: 'standalone',
};

export default nextConfig;
