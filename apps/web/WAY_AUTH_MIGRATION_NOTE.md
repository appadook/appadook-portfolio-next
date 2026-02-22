# WAY Auth Migration Note

## New Auth Entrypoints

1. `apps/web/src/lib/auth.ts`
- Shared singleton via `createWayAuthNext(...)`.
- Client and server auth API surface.

2. `apps/web/middleware.ts`
- Re-exports SDK middleware and matcher from `src/lib/auth.ts`.

3. `apps/web/src/server/auth/session.ts`
- Server helpers around SDK session resolution for protected routes.

4. `apps/web/src/app/(app)/admin/session-bootstrap.tsx`
- Client bootstrap + keep-alive lifecycle:
  - `auth.client.bootstrapSession()`
  - `auth.client.startSessionKeepAlive({ intervalMs: 270000 })`

## Removed / Obsolete Integration

1. Legacy custom auth wrappers were removed in favor of SDK methods:
- old `src/lib/auth/client.ts`
- old `src/lib/auth/server.ts`
- old `src/lib/auth/config.ts`
- old `src/lib/auth/constants.ts`

2. Duplicate custom middleware logic was replaced with SDK middleware re-export.

## Current Client API Usage

- `auth.client.login(...)`
- `auth.client.signup(...)`
- `auth.client.logout(...)`
- `auth.client.bootstrapSession()`
- `auth.client.startSessionKeepAlive(...)`

## Current Server API Usage

- `auth.server.getSession(request)` (inside `src/server/auth/session.ts`)
- Redirect guard composed by `requireAdminSessionOrRedirect(...)`

## Deployment Env Requirements

Required:
- `NEXT_PUBLIC_WAY_AUTH_BASE_URL=https://way-my-auth-service.vercel.app`
- `WAY_AUTH_BASE_URL=https://way-my-auth-service.vercel.app`

Rules:
- Use origin only (no trailing slash/path/query/hash).
- Keep cross-origin credentials/cookies enabled.

Auth service alignment for cross-site cookie sessions (if applicable):
- `REFRESH_COOKIE_SAME_SITE=none`
- HTTPS required
- `REFRESH_COOKIE_DOMAIN` set for your subdomain strategy
- CORS allowlist must include this app origin
