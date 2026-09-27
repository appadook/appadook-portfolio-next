# Frontend architecture

## Rendering and data flow

`app/(public)/page.tsx` is a request-rendered Server Component. It reads a cached published snapshot through `server/backend/portfolio.ts`, then renders `features/public/PortfolioPage.tsx` on the server. The data cache uses a 60-second revalidation interval and the `portfolio` tag. Publish schedules an authenticated call to `/api/revalidate`; retries and time-based revalidation provide recovery when that call fails. Cache errors are thrown, not converted to an empty published site.

The route and `PortfolioPage` composition remain Server Components. Each existing animated section has an explicit client boundary because Framer Motion, filters, carousels and modals require browser state. `PortfolioFrame` accepts server-composed children and preserves the original page entrance and automatic Spline background. Public pages do not load Convex's realtime provider. The original Midnight Luxe CSS, section markup, hover effects, scrolling, technology marquee and modal interactions are retained; RSC migration is not permission to redesign them. A scoped no-JavaScript fallback reveals server-rendered content without changing the normal animated experience.

`/admin` authenticates on the server and fetches the initial bootstrap before rendering. A scoped Better Auth/Convex provider enables realtime updates. `/admin/preview` uses an owner-authorized query and the same server portfolio renderer; it does not read the public cache. Admin routes are dynamic and noindex with private/no-store headers.

## Authorization boundaries

- `/api/auth/[...all]` forwards the Better Auth integration to Convex's HTTP endpoint.
- `server/auth/session.ts` validates the owner for private server rendering.
- `proxy.ts` sets private headers; it is not the authorization boundary.
- Every content mutation, upload operation, draft query, publish operation and inbox operation independently validates the active session and GitHub owner in Convex.
- `lib/auth-client.ts` is the sole browser auth client. There is no custom token store or password flow.

## Admin composition

`AdminDashboard` composes the workspace, section configuration and ordering state. `EntityInspector`, `SettingsInspector`, `MediaFields`, `Ordering`, `TechnologyEditor` and `ContentCards` own focused UI responsibilities. URL parameters hold the current section, record and editor mode. Exactly one inspector is mounted at each breakpoint.

`useEditorDraft` freezes the base document version and keeps individual unsaved forms in sessionStorage. Realtime updates cannot silently replace an active form. A rejected stale save preserves the form; Discard reloads the latest saved document. Record writes use document versions; settings and bulk writes use publication revisions. Cmd/Ctrl+Enter submits the active form.

## Placement

- `app`: thin route composition, HTTP handlers, metadata and layouts.
- `features`: feature UI, hooks, API adapters and helpers. Client UI must never import server-only modules.
- `server`: auth, environment and cached reads; all authority is server-only.
- `lib`: small cross-feature helpers and the browser auth client.
- `components/ui`: shared primitives.

Generated Convex references are typed contracts and may be imported by admin components that use Convex hooks. HTTP transport should stay small and handle failure explicitly. Avoid adding page-wide client boundaries or realtime subscriptions to the public site.

## Verification

Playwright exercises public SSR without JavaScript, the original project modals/mobile carousel, automatic background mounting, marquee animation, contact failures, endpoint protection and private route redirects. Browser tests stub the external Spline custom element to keep remote WebGL work out of deterministic interaction checks. Test Next servers use a separate `.next-test` output directory so they do not stop the owner's localhost dev server. A test-only Vite application mounts the real admin components with local in-memory query/mutation adapters. The harness is outside `src/app`, cannot be deployed as a Next route, and does not bypass production auth. Backend tests separately exercise real Convex functions and the auth component with synthetic sessions.
