'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 60_000;
const MIN_KEEP_ALIVE_INTERVAL_MS = 15_000;

function resolveKeepAliveIntervalMs(): number {
  const raw = process.env.NEXT_PUBLIC_WAY_AUTH_KEEP_ALIVE_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < MIN_KEEP_ALIVE_INTERVAL_MS) {
    return DEFAULT_KEEP_ALIVE_INTERVAL_MS;
  }
  return Math.floor(parsed);
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

export function AdminSessionBootstrap() {
  const pathname = usePathname();
  const hasStartedRef = useRef(false);
  const normalizedPath = normalizePath(pathname);
  const keepAliveIntervalMs = resolveKeepAliveIntervalMs();

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    if (auth.client.isPublicAuthRoute(normalizedPath)) {
      return;
    }

    hasStartedRef.current = true;
    void auth.client.bootstrapSession();

    const stopKeepAlive = auth.client.startSessionKeepAlive({
      intervalMs: keepAliveIntervalMs,
    });

    return () => {
      hasStartedRef.current = false;
      stopKeepAlive();
    };
  }, [keepAliveIntervalMs, normalizedPath]);

  return null;
}
