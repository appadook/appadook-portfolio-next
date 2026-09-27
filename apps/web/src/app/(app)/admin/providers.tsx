'use client';
import { useState, type ComponentProps } from 'react';
import {
  ConvexReactClient,
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { Providers } from '@/app/providers';
export function AdminProviders({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string;
}) {
  const [client] = useState(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
  );
  // Adapter 0.12.5 types intersect plugin options incorrectly with Better Auth 1.6.33.
  // The runtime client implements the documented interface; isolate the compatibility cast here.
  return (
    <ConvexBetterAuthProvider
      client={client}
      authClient={
        authClient as unknown as ComponentProps<
          typeof ConvexBetterAuthProvider
        >['authClient']
      }
      initialToken={initialToken}
    >
      <Authenticated>
        <Providers>{children}</Providers>
      </Authenticated>
      <AuthLoading>
        <p role="status" className="p-8">
          Opening your workspace…
        </p>
      </AuthLoading>
      <Unauthenticated>
        <div className="p-8">
          <p>Your session ended. Your saved drafts are safe.</p>
          <Link href="/admin/login" className="text-primary underline">
            Sign in again
          </Link>
        </div>
      </Unauthenticated>
    </ConvexBetterAuthProvider>
  );
}
