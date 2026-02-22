import 'server-only';

function ensureHttpUrl(value: string, envKey: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${envKey} is required.`);
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

  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${envKey} must be an origin only (no path/query/hash).`);
  }

  return parsed.origin;
}

function getOptionalHttpOrigin(value: string | undefined, envKey: string): string | null {
  if (!value) {
    return null;
  }
  return ensureHttpUrl(value, envKey);
}

export function getWayAuthBaseUrlServer(): string {
  const serverValue = process.env.WAY_AUTH_BASE_URL;
  const publicValue = process.env.NEXT_PUBLIC_WAY_AUTH_BASE_URL;
  const resolved = serverValue ?? publicValue;
  return ensureHttpUrl(
    resolved ?? '',
    serverValue != null ? 'WAY_AUTH_BASE_URL' : 'NEXT_PUBLIC_WAY_AUTH_BASE_URL',
  );
}

export function getWayAuthPublicBaseUrl(): string | null {
  return getOptionalHttpOrigin(process.env.NEXT_PUBLIC_WAY_AUTH_BASE_URL, 'NEXT_PUBLIC_WAY_AUTH_BASE_URL');
}

export function getConvexPublicUrl(): string | null {
  return getOptionalHttpOrigin(process.env.NEXT_PUBLIC_CONVEX_URL, 'NEXT_PUBLIC_CONVEX_URL');
}
