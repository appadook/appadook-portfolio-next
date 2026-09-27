import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Preserve the web origin for server-rendered token requests as well as the
  // auth route proxy. Convex's edge replaces the standard forwarded headers.
  // Always overwrite client-supplied values with this deployment's origin.
  const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? request.url);
  headers.set('x-better-auth-forwarded-host', origin.host);
  headers.set('x-better-auth-forwarded-proto', origin.protocol.slice(0, -1));
  // Authorization is enforced by the server page and every Convex operation.
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
export const config = { matcher: ['/admin/:path*', '/api/auth/:path*'] };
