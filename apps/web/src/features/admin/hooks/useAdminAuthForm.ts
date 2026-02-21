'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';

export type AdminAuthMode = 'login' | 'signup';

function toSafeNextPath(nextPath: string): Route {
  try {
    const resolved = new URL(nextPath, window.location.href);
    const isHttpProtocol = resolved.protocol === 'http:' || resolved.protocol === 'https:';
    if (!isHttpProtocol || resolved.origin !== window.location.origin) {
      return '/admin';
    }

    return `${resolved.pathname}${resolved.search}${resolved.hash}` as Route;
  } catch {
    return '/admin';
  }
}

function ensureAccessTokenCookie(token: string, expiresIn?: number) {
  const maxAge = typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0 ? Math.floor(expiresIn) : 900;
  const secureAttribute = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `way_access_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureAttribute}`;
}

export function useAdminAuthForm(mode: AdminAuthMode) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = searchParams.get('next') || '/admin';
  const safeNextPath = toSafeNextPath(nextPath);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result =
        mode === 'login'
          ? await auth.client.login({ email, password })
          : await auth.client.signup({ email, password });

      if (!result.accessToken || typeof result.accessToken !== 'string') {
        throw new Error('Authentication succeeded without an access token.');
      }

      ensureAccessTokenCookie(result.accessToken, result.expiresIn);
      if (!document.cookie.includes('way_access_token=')) {
        throw new Error('Unable to persist admin session cookie in browser.');
      }

      router.refresh();
      router.push(safeNextPath);
    } catch (err) {
      setError(auth.errors.toUiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    password,
    error,
    isSubmitting,
    isLogin: mode === 'login',
    setEmail,
    setPassword,
    submit,
  };
}
