# Convex Seed Data (No Media URLs)

## File

- `portfolio-base-no-media.json`

## What is included

- `siteSettings` (name/tagline)
- `experiences`
- `projects` (all non-URL fields)
- `programmingLanguages`
- `technologies`
- `cloudProviders`
- `certificates` (non-URL fields, `image` is `""` placeholder to satisfy current schema)
- `aboutCategories`
- `aboutItems`

## Relation keys

- `certificates[].providerKey` maps to `cloudProviders[].key`
- `aboutItems[].categoryKey` maps to `aboutCategories[].key`

## Recommended insert order

1. `siteSettings`
2. `cloudProviders`
3. `aboutCategories`
4. `experiences`
5. `projects`
6. `programmingLanguages`
7. `technologies`
8. `certificates` (resolve `providerKey -> providerId`)
9. `aboutItems` (resolve `categoryKey -> categoryId`)

## Authorization and publication

Writing requires `PORTFOLIO_OWNER_TOKEN`, a current Convex JWT from the owner's Better Auth session. Validation is offline and requires no token. Keep tokens out of terminal logs and source control. All writes are drafts; review `/admin/preview` and publish explicitly. `--reset` deletes existing draft content and should never be used as a routine migration.

## Bun seed command

- Validate JSON only:
  - `bun run -F @portfolio/backend seed:portfolio -- --validate-only`
- Seed into empty DB:
  - `bun run -F @portfolio/backend seed:portfolio`
- Replace existing admin content and seed fresh:
  - `bun run -F @portfolio/backend seed:portfolio -- --reset`

Notes:

- The script auto-loads Convex URL from `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL`, then falls back to `.env.local` files in `packages/backend`, repo root, and `apps/web`.
- If records already exist, the script aborts unless you pass `--reset` or `--force`.
