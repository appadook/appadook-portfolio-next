// One shared CMS deployment, two explicitly approved web origins.
export const LOCAL_ORIGIN = "http://localhost:3000";
export const PRODUCTION_ORIGIN = "https://appadook-portfolio-next.vercel.app";

export function authEnvironment(origin: string) {
  if (origin === LOCAL_ORIGIN)
    return {
      origin,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  if (origin === PRODUCTION_ORIGIN)
    return {
      origin,
      clientId: process.env.GITHUB_PRODUCTION_CLIENT_ID,
      clientSecret: process.env.GITHUB_PRODUCTION_CLIENT_SECRET,
    };
  return null;
}

export function requestAuthOrigin(request: Request): string | null {
  // registerRoutes restores the original Next.js forwarded headers first.
  // Next.js also supplies these for server-rendered session/token requests.
  const host = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto");
  if (host) {
    const origin = `${proto}://${host}`;
    if (authEnvironment(origin)) return origin;
    // Convex's own edge may forward its HTTP host for public JWKS requests.
    if (origin !== process.env.CONVEX_SITE_URL) return null;
  }
  const origin = new URL(request.url).origin;
  if (authEnvironment(origin)) return origin;
  if (origin === process.env.CONVEX_SITE_URL) return PRODUCTION_ORIGIN;
  return null;
}
