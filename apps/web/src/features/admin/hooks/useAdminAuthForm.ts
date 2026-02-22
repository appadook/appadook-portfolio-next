'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';

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
      if (mode === 'login') {
        await auth.client.login({ email, password });
      } else {
        await auth.client.signup({ email, password });
      }
      router.refresh();
      router.push(safeNextPath);
    } catch (err) {
      const uiError = auth.errors.toUiError(err);
      setError(uiError.message);
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
