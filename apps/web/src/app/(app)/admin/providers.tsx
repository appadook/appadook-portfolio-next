'use client';

import { ConvexProvider } from 'convex/react';
import { convex } from '@/features/admin/api/convexClient';

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
