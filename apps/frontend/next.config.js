/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@repo/constants',
    '@repo/types',
    '@repo/utils',
    '@repo/validation',
  ],
};

export default nextConfig;
