# apps/web Architecture

## Layer Rules

1. `src/app/*`
- Routing, page/layout composition, and route handlers only.
- No feature business logic.

2. `src/features/*`
- Feature-owned UI, hooks, local transport, and domain helpers.
- Feature UI components should not call `fetch()` directly.

3. `src/server/*`
- Server-only authority for auth/session/env/backend access.
- Must not be imported by client components.

4. `src/lib/*`
- Cross-feature shared primitives (HTTP wrapper, utility helpers).
- Keep this small and framework-agnostic where possible.

5. `src/components/ui/*`
- Shared design system primitives only.

## Allowed Import Direction

1. `app` -> `features`, `server`, `lib`, `components/ui`
2. `features` -> `features/<same feature>`, `lib`, `components/ui`
3. `server` -> `server`, `lib`, backend/client SDKs
4. `lib` -> `lib` only (and external packages)

Disallowed:
- `features/*/components` importing `src/server/*`
- UI components importing generated Convex API directly
- `fetch()` calls inside feature component files

## Auth Flow

1. `middleware.ts` applies coarse route gating for `/admin/*`.
2. Server authority is in `src/server/auth/session.ts`.
3. Admin page uses `requireAdminSessionOrRedirect()`.
4. Client auth actions use `auth.client.*` via `src/lib/auth.ts`.

## Data Flow (Hybrid BFF)

1. Public snapshot:
- Server path: `src/server/backend/portfolio.ts`
- BFF: `GET /api/portfolio/snapshot`
- Client wrapper: `src/features/public/api/portfolio.ts`

2. Auth identity:
- BFF: `GET /api/auth/me`
- Client wrapper: `src/features/admin/api/me.ts`

3. Admin realtime CRUD:
- Uses Convex hooks through feature-level adapter modules.
- Full BFF migration for realtime flows is deferred.

## Feature Template

For new features, prefer:

```
src/features/<feature>/
  components/
  hooks/
  api/
  lib/
  index.ts
```

Keep route files thin and feature boundaries strict.
