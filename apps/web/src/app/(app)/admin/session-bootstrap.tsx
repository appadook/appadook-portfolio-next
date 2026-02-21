'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (PUBLIC_ADMIN_PATHS.has(normalizePath(pathname))) {
      return;
    }

    void auth.client
      .bootstrapSession()
      .then((result) => {
        if (!result.ok && result.error.code !== 'missing_refresh_token') {
          console.error('WAY Auth bootstrap failed:', result.error.message);
        }
      })
      .catch((error) => {
        console.error('WAY Auth bootstrap threw:', error);
      });
    const stopKeepAlive = auth.client.startSessionKeepAlive({
      intervalMs: KEEP_ALIVE_INTERVAL_MS,
    });

    return () => {
      stopKeepAlive();
    };
  }, [pathname]);

  return null;
}
