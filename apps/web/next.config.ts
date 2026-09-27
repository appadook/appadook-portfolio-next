import type { NextConfig } from 'next';
const convexHost = process.env.NEXT_PUBLIC_CONVEX_URL
  ? new URL(process.env.NEXT_PUBLIC_CONVEX_URL).hostname
  : 'invalid.convex.cloud';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  allowedDevOrigins: ['127.0.0.1'],
  typedRoutes: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: convexHost },
      { protocol: 'https', hostname: convexHost.replace('.cloud', '.site') },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
export default nextConfig;
