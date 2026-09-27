import 'server-only';
import { cache } from 'react';
import { ConvexError } from 'convex/values';
import { convexSiteUrl } from '@/lib/convex-urls';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';
import { api } from '@portfolio/backend/convex/_generated/api';

// Lazy construction lets static routes build without deployment credentials.
export const getAuthServer = cache(() => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const siteUrl = convexSiteUrl();
  if (!convexUrl || !siteUrl)
    throw new Error('Convex authentication is not configured.');
  return convexBetterAuthNextJs({ convexUrl, convexSiteUrl: siteUrl });
});
export const getAdminSessionFromHeaders = cache(async () => {
  await connection();
  try {
    const user = await getAuthServer().fetchAuthQuery(
      api.auth.currentOwner,
      {},
    );
    return { user };
  } catch (error) {
    // Only an explicit authorization denial means the visitor should sign in.
    // Backend/runtime failures must reach the error boundary, not create a login loop.
    if (error instanceof ConvexError && (error.data === 'Unauthorized' || error.data === 'Forbidden')) return null;
    throw error;
  }
});
export async function requireAdminSessionOrRedirect() {
  const session = await getAdminSessionFromHeaders();
  if (!session) redirect('/admin/login');
  return session;
}
