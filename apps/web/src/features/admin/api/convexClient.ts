'use client';

import { ConvexReactClient } from 'convex/react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn('NEXT_PUBLIC_CONVEX_URL is missing. Convex data hooks will not work.');
}

export const convex = new ConvexReactClient(
  convexUrl || 'https://placeholder.convex.cloud',
);
