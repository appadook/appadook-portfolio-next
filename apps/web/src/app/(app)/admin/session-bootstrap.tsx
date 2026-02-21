'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';

const KEEP_ALIVE_INTERVAL_MS = 270_000;
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/signup']);

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

export function AdminSessionBootstrap() {
  const pathname = usePathname();
  const [keepAliveReady, setKeepAliveReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_ADMIN_PATHS.has(normalizePath(pathname))) {
      setKeepAliveReady(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await auth.client.bootstrapSession();
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setKeepAliveReady(true);
          return;
        }

        if (result.error.code !== 'missing_refresh_token') {
          console.error('WAY Auth bootstrap failed:', result.error.message);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('WAY Auth bootstrap threw:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!keepAliveReady) {
      return;
    }

    const stopKeepAlive = auth.client.startSessionKeepAlive({
      intervalMs: KEEP_ALIVE_INTERVAL_MS,
    });

    return () => {
      stopKeepAlive();
    };
  }, [keepAliveReady]);

  return null;
}
