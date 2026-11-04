/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@mindfiredigital/constants',
    '@mindfiredigital/types',
    '@mindfiredigital/utils',
    '@mindfiredigital/validation',
    '@mindfiredigital/shared-ui',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
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
