import { createWayAuthNext } from "@way/auth-sdk/next";

function normalizeBaseUrl(rawValue: string, envKey: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${envKey} must be a valid URL.`);
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error(`${envKey} must use http or https.`);
  }

  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(`${envKey} must be an origin only (no path/query/hash).`);
  }

  return parsed.origin;
}

function normalizeOptionalBaseUrl(rawValue: string | undefined, envKey: string): string | null {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  return normalizeBaseUrl(trimmed, envKey);
}

function resolveWayAuthBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const serverBaseUrl = normalizeOptionalBaseUrl(process.env.WAY_AUTH_BASE_URL, "WAY_AUTH_BASE_URL");
  if (serverBaseUrl) {
    return serverBaseUrl;
  }

  const publicBaseUrl = normalizeOptionalBaseUrl(
    process.env.NEXT_PUBLIC_WAY_AUTH_BASE_URL,
    "NEXT_PUBLIC_WAY_AUTH_BASE_URL",
  );
  if (publicBaseUrl) {
    return publicBaseUrl;
  }

  const publicSiteUrl = normalizeOptionalBaseUrl(process.env.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL");
  if (publicSiteUrl) {
    return publicSiteUrl;
  }

  throw new Error(
    "WAY Auth base URL is required. Set WAY_AUTH_BASE_URL (server) and NEXT_PUBLIC_WAY_AUTH_BASE_URL (browser), both to your app origin in proxy mode.",
  );
}

const wayAuthBaseUrl = resolveWayAuthBaseUrl();
const wayAuthUpstreamUrl = normalizeOptionalBaseUrl(process.env.WAY_AUTH_UPSTREAM_URL, "WAY_AUTH_UPSTREAM_URL");

if (!wayAuthBaseUrl) {
  throw new Error(
    "WAY Auth base URL is required. Set WAY_AUTH_BASE_URL (server) and NEXT_PUBLIC_WAY_AUTH_BASE_URL (browser).",
  );
}

if (wayAuthUpstreamUrl && wayAuthBaseUrl === wayAuthUpstreamUrl) {
  throw new Error(
    "Invalid WAY Auth proxy configuration: WAY_AUTH_BASE_URL/NEXT_PUBLIC_WAY_AUTH_BASE_URL must be your app origin, not WAY_AUTH_UPSTREAM_URL.",
  );
}

export const auth = createWayAuthNext({
  baseUrl: wayAuthBaseUrl,
  transportMode: "proxy",
  endpointOriginGuard: "warn",
});

export const wayAuthMiddleware = auth.middleware;
export const wayAuthMatcher = auth.matcher;
