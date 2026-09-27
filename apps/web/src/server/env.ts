import 'server-only';
export function getConvexPublicUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!value) return null;
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.pathname !== '/')
    throw new Error('NEXT_PUBLIC_CONVEX_URL must be an origin.');
  return url.origin;
}
