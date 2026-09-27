# @portfolio/backend

Convex stores portfolio drafts, a published snapshot, media registrations and a contact queue. Its Better Auth component stores users, GitHub accounts and revocable sessions.

- `auth.ts`, `auth.config.ts`, `http.ts`, `convex.config.ts`: Better Auth integration and owner allowlist.
- `lib/owner.ts`: active session and immutable GitHub identity authorization.
- `admin.ts`: owner-only draft CRUD, optimistic versions, ordering and validated storage registration.
- `publishing.ts`: private preview, atomic publish, cache invalidation retries, media cleanup.
- `portfolio.ts`: anonymous reads of published content only, including legacy query names.
- `contact.ts`: secret-authenticated ingestion, transactional rate limits, durable email retries and owner inbox.
- `lib/content.ts`, `lib/write.ts`, `lib/validation.ts`: shared content reads, first-write snapshot, validation and version checks.

Run `bun run dev` for a development deployment, `bun run deploy` for production, and `bun run codegen` to regenerate bindings after schema/component changes. These commands connect to Convex; tests do not. Follow [deployment instructions](../../DEPLOYMENT.md) before pushing changes.

`bun run test` uses convex-test and the real Better Auth component with synthetic sessions. `bun run typecheck` checks backend source and seed tooling. Secrets belong in the Convex deployment environment; see `.env.example`.

Seed data is optional and writes private drafts. Validation needs no credentials. Writes require a short-lived Convex JWT from the owner's authenticated Better Auth session (`PORTFOLIO_OWNER_TOKEN`); a deployment key is not a substitute. Do not print or commit the token. Existing-data reset requires explicit `--reset` and is destructive to drafts. See [seed notes](convex/seeds/README.md).
