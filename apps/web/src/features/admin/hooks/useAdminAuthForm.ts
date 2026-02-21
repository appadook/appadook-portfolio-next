'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';

export type AdminAuthMode = 'login' | 'signup';

function toSafeNextPath(nextPath: string): Route {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return '/admin';
  }

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

type SessionAuthResponse = {
  error?: {
    message?: string;
  };
};

async function submitSessionCredentials(mode: AdminAuthMode, email: string, password: string): Promise<void> {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ mode, email, password }),
  });

  const payload = (await response.json().catch(() => null)) as SessionAuthResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Authentication failed. Please try again.');
  }
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
      await submitSessionCredentials(mode, email, password);
      router.refresh();
      router.push(safeNextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
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
