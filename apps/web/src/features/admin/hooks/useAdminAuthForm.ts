'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';

export type AdminAuthMode = 'login' | 'signup';

export function useAdminAuthForm(mode: AdminAuthMode) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = searchParams.get('next') || '/admin';
  const safeNextPath: Route =
    (nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/admin') as Route;

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

      router.push(safeNextPath);
      router.refresh();
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
