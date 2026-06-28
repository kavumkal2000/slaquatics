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
        source: '/ops',
        destination: '/ops.html',
        permanent: false
      },
      {
        source: '/ops-login',
        destination: '/ops-login.html',
        permanent: false
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/ops.html',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex' }
        ]
      },
      {
        source: '/ops-login.html',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex' }
        ]
      }
    ];
  }
};

export default nextConfig;
