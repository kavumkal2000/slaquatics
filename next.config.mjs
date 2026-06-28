import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: repoRoot
  },
  async redirects() {
    return [
      {
        source: '/ops.html',
        destination: '/ops',
        permanent: true
      },
      {
        source: '/ops-login.html',
        destination: '/ops-login',
        permanent: true
      }
    ];
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
