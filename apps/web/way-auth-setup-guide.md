# WAY Auth Next.js Setup

## Fastest Next.js setup

1. Install SDK:

```bash
bun add @way/auth-sdk
```

2. Run setup:

```bash
bunx way-auth-setup --framework next --minimal
```

3. Ensure this env key exists in `.env.local`:

```bash
WAY_AUTH_BASE_URL="https://way-my-auth-service.vercel.app"
```

No additional WAY Auth env vars are required for baseline Next.js integration.

## What was generated

1. `src/lib/auth.ts`
- Creates `createWayAuthNext()` singleton.
- Exports middleware and matcher bindings.

2. `middleware.ts`
- Re-exports SDK middleware and matcher.

3. `.env.local`
- Merged/updated with `WAY_AUTH_BASE_URL`.

## Runtime mental model

1. Middleware checks protected admin routes.
2. Client methods (`auth.client.*`) manage login/signup/logout/bootstrap.
3. Server helpers (`auth.server.*`) validate session from access-token cookie.
4. SDK resolves issuer/audience/JWKS/endpoints using discovery at:
- `/.well-known/way-auth-configuration`

## Usage snippets

### Client login

```ts
import { auth } from "@/lib/auth";

await auth.client.login({ email: "demo@example.com", password: "password" });
```

### Client bootstrap

```ts
const result = await auth.client.bootstrapSession();
if (!result.ok) {
  console.log(result.error.message);
}
```

### Server session

```ts
import { auth } from "@/lib/auth";

const session = await auth.server.getSession(request);
```

## Troubleshooting

1. Redirect loops on admin routes:
- Confirm `middleware.ts` exports SDK middleware.
- Confirm access token cookie is not blocked by browser policy.

2. Discovery/config errors:
- Verify `https://way-my-auth-service.vercel.app/.well-known/way-auth-configuration` is reachable.

3. Session returns null server-side:
- User may be logged out, token expired, or cookie not present.

## Migration notes (from custom wrappers)

1. Delete custom auth config/constants/client/server wrapper files.
2. Replace middleware logic with generated `middleware.ts`.
3. Replace direct client wrapper calls with `auth.client.*`.
4. Replace server wrapper calls with `auth.server.getSession/requireSession`.
