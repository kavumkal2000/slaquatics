import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ['100.84.72.59'],
  env: {
    NEXT_PUBLIC_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_MEDIA_BASE_URL || process.env.PUBLIC_MEDIA_BASE_URL || 'https://cdn.slaquatics.com'
  },
  turbopack: {
    root: repoRoot
  },
  async redirects() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/ops',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex' }
        ]
      },
      {
        source: '/ops-login',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex' }
        ]
      }
    ];
  }
};

export default nextConfig;
