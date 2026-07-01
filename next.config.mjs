import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));

const privateNoIndexHeaders = [
  { key: 'Cache-Control', value: 'no-store' },
  { key: 'X-Robots-Tag', value: 'noindex' }
];

const cmsSecurityHeaders = [
  ...privateNoIndexHeaders,
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.slaquatics.com; media-src 'self' blob: https://cdn.slaquatics.com; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' }
];

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
    return [];
  },
  async headers() {
    return [
      {
        source: '/ops',
        headers: privateNoIndexHeaders
      },
      {
        source: '/ops-login',
        headers: privateNoIndexHeaders
      },
      {
        source: '/cms',
        headers: cmsSecurityHeaders
      },
      {
        source: '/cms/:path*',
        headers: cmsSecurityHeaders
      },
      {
        source: '/cms-login',
        headers: cmsSecurityHeaders
      },
      {
        source: '/api/cms/:path*',
        headers: cmsSecurityHeaders
      }
    ];
  }
};

export default nextConfig;
