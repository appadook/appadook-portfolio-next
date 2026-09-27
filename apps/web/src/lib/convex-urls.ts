// Cloud deployments have a deterministic HTTP endpoint. Explicit values still
// support custom/local Convex hosts and take precedence.
export function convexSiteUrl() {
  if (process.env.NEXT_PUBLIC_CONVEX_SITE_URL)
    return process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const cloud = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!cloud) return undefined;
  const url = new URL(cloud);
  if (url.hostname.endsWith('.convex.cloud')) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, '.convex.site');
    return url.origin;
  }
  return undefined;
}
