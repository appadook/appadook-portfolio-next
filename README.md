# Portfolio Platform

A public portfolio and owner-only CMS, built as a Bun/Turborepo monorepo.

| Layer          | Technology                                                                            |
| -------------- | ------------------------------------------------------------------------------------- |
| Web            | Next.js 16.3.5 App Router, React 19.3, TypeScript                                     |
| UI             | Tailwind CSS 3, Radix/shadcn components, dnd-kit                                      |
| Data           | Convex 1.46 (database, realtime subscriptions, storage, scheduled jobs)               |
| Authentication | Better Auth 1.6.33 with the Convex Better Auth component 0.12.5; GitHub OAuth         |
| Verification   | Vitest/convex-test, Playwright desktop and mobile, ESLint, TypeScript, GitHub Actions |
| Tooling        | Node 22.12+, Bun 1.3.2, Turborepo                                                     |

Better Auth is deliberately pinned to the Convex adapter's supported 1.6 range. Update the adapter and auth library together. The icon package is pinned because newer minor releases remove existing brand exports.

## Start

```sh
bun install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
bun run dev:convex
# In another terminal:
bun run dev:web
```

Configure the deployment and GitHub OAuth first using [DEPLOYMENT.md](DEPLOYMENT.md). The local frontend can build without live service credentials, but authenticated editing requires a configured Convex deployment. Do not put secrets in `NEXT_PUBLIC_*` variables.

## Project layout

- `apps/web/src/app`: routes, metadata, API handlers, layouts.
- `apps/web/src/features/public`: server-composed portfolio with the original animated sections.
- `apps/web/src/features/admin`: interactive CMS, editor recovery, ordering, uploads, publishing, contact inbox.
- `apps/web/src/server`: server-only auth and cached backend access.
- `packages/backend/convex`: schema, owner authorization, content, publication, storage and contact delivery.
- `packages/backend/tests`: backend authorization and data integrity tests.
- `apps/web/tests`: browser tests and an isolated admin component harness.

See [frontend architecture](apps/web/ARCHITECTURE.md) and [backend notes](packages/backend/README.md).

## Behavior

The public route fetches and caches content on the server, then composes the original portfolio sections. Client boundaries preserve the existing Framer Motion animations, typewriter, parallax, project carousel/modals, technology marquee and automatic Spline background. The original Midnight Luxe CSS and layouts are retained. Server-rendered content has a no-JavaScript visibility fallback. Architecture changes must preserve the existing visual and interaction design.

GitHub account **appadook**, identified by immutable provider ID **168853630**, is the sole admin. The application owns its auth integration, with users, accounts and sessions stored in the Convex Better Auth component. There is no password signup or first-user ownership claim. WAY Auth has been removed.

Editing saves drafts. Preview is authenticated; Publish makes a consistent snapshot public. All public queries read that snapshot. Existing content remains public until the first edit freezes the initial snapshot. Stale writes are rejected with version checks. Unsaved individual editor drafts recover within the same browser tab; explicit discard loads the current saved version. Bulk ordering/technology edits warn before navigation but are not persisted as recovery drafts.

Contact submissions are durably queued in Convex. Optional Resend notifications retry after errors; messages remain available in the owner inbox. Media uploads require owner authorization and validate size, type and header signature. Draft and published media references are protected during cleanup.

## Checks

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun audit
cd apps/web
bunx playwright install chromium
bun run test:e2e
```

Browser tests run against local fixtures, with no production reads/writes or real email delivery. Admin component tests use a separate Vite server and do not test OAuth itself. Live OAuth and delivery smoke tests are documented in the rollout checklist.
