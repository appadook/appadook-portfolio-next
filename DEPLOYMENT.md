# Deployment and migration

## Configuration

Use Node 22.12+ and Bun 1.3.2. Copy the example environment files; never commit credentials. This project intentionally shares the Convex deployment `chatty-puma-118` between localhost and the live Vercel site. Use separate GitHub OAuth applications for the two origins; both credential pairs are stored in this shared deployment.

Web hosting (`apps/web`):

| Variable                      | Value                                                  |
| ----------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_CONVEX_URL`      | `https://chatty-puma-118.convex.cloud`                |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `https://chatty-puma-118.convex.site`              |
| `NEXT_PUBLIC_SITE_URL`        | Exact web origin, e.g. `https://portfolio.example.com` |
| `CONTACT_INGEST_SECRET`       | Random secret also configured in Convex                |
| `REVALIDATE_SECRET`           | A distinct random secret also configured in Convex     |

Convex deployment environment (set through the Convex dashboard, not a public frontend variable):

| Variable                                      | Value                                                     |
| --------------------------------------------- | --------------------------------------------------------- |
| `SITE_URL`                                    | Live origin for publication cache invalidation          |
| `BETTER_AUTH_SECRET`                          | At least 32 random bytes, kept stable between deployments |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`   | Local GitHub OAuth application credentials                      |
| `GITHUB_PRODUCTION_CLIENT_ID` / `GITHUB_PRODUCTION_CLIENT_SECRET` | Production GitHub OAuth application credentials |
| `CONTACT_INGEST_SECRET` / `REVALIDATE_SECRET` | Match the web host values                                 |
| `RESEND_API_KEY`                              | Optional, needed for email notifications                  |
| `CONTACT_FROM_EMAIL`                          | Resend-verified sender address                            |
| `CONTACT_TO_EMAIL`                            | Destination inbox                                         |

Create a GitHub OAuth application with homepage equal to your web origin and callback **`https://YOUR_HOST/api/auth/callback/github`**. For local development use `http://localhost:3000/api/auth/callback/github`. The callback is on the web host. Set shared Convex `SITE_URL=https://appadook-portfolio-next.vercel.app` for cache invalidation. Authentication selects its base URL and credentials per request using the exact allowlist in `convex/lib/authOrigins.ts`; it does not use `SITE_URL` to choose the login origin.

Only GitHub provider ID `168853630` (`appadook`) is allowed. There is no initial admin claim or email-based allowlist. Changing the owner requires a reviewed code change in `packages/backend/convex/lib/authComponent.ts`. Do not add a fallback that accepts arbitrary authenticated users. Existing WAY Auth sessions are intentionally not migrated; sign in again with GitHub.

## Rollout

1. Export/backup the existing Convex data using the dashboard and retain the current web deployment. Confirm the target is the shared `chatty-puma-118` deployment before running any deployment command.
2. Configure development credentials and matching web/backend secrets. Run `bun install --frozen-lockfile`, all README checks, and the live smoke tests below against the development deployment.
3. Schedule a brief admin maintenance window. Deploy the secured shared backend first from `packages/backend` with `bun --bun x convex dev --once`. **Do not use `convex deploy` / `bun run deploy`: those select the unused `earnest-sheep-574` deployment.** This registers the auth component and regenerates Convex bindings. Review any generated changes and rerun typecheck. The old admin will stop working against protected mutations; public queries remain compatible.
4. Deploy the web workspace with the configured production environment. On Vercel, use `apps/web` as the root directory with monorepo files available, Bun frozen install, and `bun run build`.
5. Complete the production smoke tests. Remove obsolete WAY Auth environment variables and deactivate the old service only after the new owner session works.

The schema changes are additive. Existing content tables do not need a destructive migration. The first successful content write freezes the old content as the initial public snapshot atomically. Subsequent edits are private drafts until Publish. Do not run the seed reset on existing production data. No backend or web deployment is performed by local tests.

## Live smoke tests

- Sign in as `appadook`; reload `/admin` and `/admin/preview`. Sign out; both must redirect to login. Check an unapproved GitHub account is rejected.
- Revoke the session in the Better Auth component's session table through the Convex dashboard; further private reads/writes must fail. Do not delete the owner account for routine logout testing.
- Edit a harmless field, verify the public snapshot remains unchanged, review Preview, then Publish and confirm public content refreshes. Restore and publish the original field afterward.
- Open the same record in two tabs. Save in one; the other's stale save must fail while preserving its input.
- Upload a small PNG/PDF, verify preview and save, and confirm an invalid file is rejected. Test the mobile editor and keyboard save.
- Submit one contact message. Confirm it appears in the admin inbox and arrives by email when delivery credentials are configured. Without email credentials, it must remain in the inbox with failed delivery and a Retry control.
- Check canonical URL, sitemap, social preview and image host configuration on the actual production domain.

## Recovery and operations

If frontend rollout fails, retain the secured backend and roll forward with a frontend fix. Do not redeploy the old unauthenticated mutation implementation. Restore content from the backup only through a reviewed migration. Publication preserves the live snapshot while draft work continues.

Monitor Convex function errors/scheduled jobs and hosting logs. Publishing logs failed cache invalidation and retries; the public data cache revalidates after 60 seconds (underlying platform cache behavior may serve stale content while refreshing). Email delivery retries up to four attempts and retains failures in the inbox for manual retry.

Contact limits are three messages per client per hour and thirty globally. Vercel's trusted forwarded client IP is hashed with the ingest secret. On other hosts the current route uses a shared bucket; adapt it only to a proxy header the host guarantees cannot be spoofed. Inbox paginates messages and supports delivery-status filters; define a retention policy before storing substantial visitor data. Rate-limit keys and messages currently have no automatic retention cleanup.

Media cleanup removes only tracked uploads older than 24 hours that are referenced by neither saved drafts nor published content. Unsaved recovery drafts are not database references; save media changes promptly. Uploads interrupted before registration may need manual storage cleanup. Header signatures are file-type checks, not malware scanning.

The publication snapshot is a single Convex document; this design fits a personal portfolio, not a large content catalog. Split/paginate it before nearing Convex's document/read limits. Do not cache authenticated data in the public snapshot.

Real OAuth, provider delivery and remote Convex component deployment require configured external services. Local test success is not evidence those credentials or production callbacks are configured correctly.

## Shared-instance operation

Both local and live use **`chatty-puma-118`**. The empty `earnest-sheep-574` deployment is unused. Do not switch Vercel to it.

| Web origin | Shared Convex credential variables | GitHub callback |
| --- | --- | --- |
| `http://localhost:3000` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `http://localhost:3000/api/auth/callback/github` |
| `https://appadook-portfolio-next.vercel.app` | `GITHUB_PRODUCTION_CLIENT_ID`, `GITHUB_PRODUCTION_CLIENT_SECRET` | `https://appadook-portfolio-next.vercel.app/api/auth/callback/github` |

Local `NEXT_PUBLIC_SITE_URL` must be `http://localhost:3000`; Vercel Production uses `https://appadook-portfolio-next.vercel.app`. Both use the same Convex cloud/site endpoints, contact secret and revalidation secret. Keep `BETTER_AUTH_SECRET` stable. The adapter shares auth records while each web origin has its own host-only cookies; production cookies remain Secure. Do not add wildcard hosts or disable origin checks.

Local edits change the shared CMS drafts. Publishing from either site updates the same live snapshot. Backend deployment also affects both sites. Public visuals remain unchanged by auth repairs.

Before the frontend release, deploy the shared backend, check readiness for each origin using `auth:configuration` with its `origin` argument, and run the smoke tests above. The Quality workflow validates code but does not deploy Convex. Vercel Production needs `CONTACT_INGEST_SECRET`, `REVALIDATE_SECRET` and `NEXT_PUBLIC_CONVEX_SITE_URL` alongside its existing public URL variables.

The earlier sign-in failure came from mixing production OAuth settings with local sign-in in a single-origin auth configuration. The shared backend now selects the correct OAuth application for each approved origin. Credential IDs and secrets must still belong to the same registered application. Never paste secrets into chat or commit them.
