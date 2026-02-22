import type { NextConfig } from "next";

const authUpstreamUrl = (process.env.WAY_AUTH_UPSTREAM_URL || 'https://way-my-auth-service.vercel.app').replace(
  /\/+$/,
  '',
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.convex.site',
      },
    ],
  },
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/way-auth-configuration',
        destination: `${authUpstreamUrl}/.well-known/way-auth-configuration`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${authUpstreamUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
