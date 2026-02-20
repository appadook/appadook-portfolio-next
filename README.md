# Portfolio Platform Monorepo

This repository has been migrated to a Turborepo monorepo with:

- Next.js App Router frontend (`apps/web`)
- Convex backend package (`packages/backend`)
- WAY Auth SDK-based admin authentication using the Next adapter (`@way/auth-sdk/next`)

## Repository Structure

- `apps/web`: Public portfolio site and in-app admin CMS UI.
- `packages/backend`: App-agnostic Convex schema and function modules.
- `packages/way-auth-sdk`: Internal workspace copy of `@way/auth-sdk` used by the web app.

## Tech Stack

- Bun (package manager + scripts)
- Turborepo (monorepo task orchestration)
- Next.js 15 App Router + React 18
- Tailwind CSS + shadcn/ui
- Convex (database, realtime sync, mutations, queries)
- `@way/auth-sdk/next` (Next.js-first authentication integration)

## Rendering Model (SSR / CSR / RSC)

- RSC/SSR:
  - Route entry files in `apps/web/src/app/**/page.tsx` are server components by default.
  - Admin route gating (`/admin`) validates auth via `auth.server.getSession(...)` before rendering.
- CSR:
  - Interactive portfolio sections and admin CMS editor are client components.
  - Convex live data subscriptions (`useQuery`) run in client components for realtime updates.
- Middleware auth:
  - `apps/web/middleware.ts` re-exports WAY SDK middleware (`auth.middleware`) for `/admin/*`.

## Environment Variables

Create `.env.local` at repository root:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# WAY Auth
# Client-facing base URL (required by current Next adapter runtime)
NEXT_PUBLIC_WAY_AUTH_BASE_URL=https://way-my-auth-service.vercel.app
# Server/middleware base URL
WAY_AUTH_BASE_URL=https://way-my-auth-service.vercel.app

# Optional: if false, disables fallback content when Convex is empty/unavailable
NEXT_PUBLIC_ENABLE_CONTENT_FALLBACK=true
```

## Local Development

Install deps from repo root:

```bash
bun install
```

Run web + convex (two terminals):

```bash
bun run dev:web
bun run dev:convex
```

Or run all turbo dev tasks:

```bash
bun run dev
```

## Build / Lint / Typecheck

```bash
bun run lint
bun run typecheck
bun run build
```

## Admin Routes

- `/admin/login`
- `/admin/signup`
- `/admin`

Admin auth is powered by generated Next SDK integration:

- `apps/web/src/lib/auth.ts` (single `createWayAuthNext()` surface)
- `apps/web/middleware.ts` (SDK middleware re-export)
