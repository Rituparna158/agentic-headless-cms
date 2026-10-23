/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@repo/constants',
    '@repo/types',
    '@repo/utils',
    '@repo/validation',
    '@repo/shared-ui',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};
export default nextConfig;
