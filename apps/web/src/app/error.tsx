'use client';
import { useEffect } from 'react';
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page failed', { digest: error.digest });
  }, [error]);
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-6">
      <h1 className="font-display text-4xl">Temporarily unavailable</h1>
      <p className="text-muted-foreground">
        The page could not load. Please try again, or contact me by email.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-5 py-3 text-primary-foreground"
      >
        Try again
      </button>
      <a
        className="text-primary underline"
        href="mailto:kurtik.appadoo.2002@outlook.com"
      >
        Email Kurtik
      </a>
    </main>
  );
}
