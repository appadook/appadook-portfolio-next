import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

type SessionUser = {
  id: string;
  email: string;
};

type SessionResult = {
  user: SessionUser;
};

function getRequestOrigin(requestHeaders: Headers): string {
  const host = requestHeaders.get('host') ?? 'localhost:3000';
  const forwardedProto = requestHeaders.get('x-forwarded-proto');
  const protocol = forwardedProto ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export async function getAdminSessionFromHeaders(pathname = '/admin'): Promise<SessionResult | null> {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get('cookie') ?? '';
  const request = new Request(`${getRequestOrigin(requestHeaders)}${pathname}`, {
    headers: cookie ? { cookie } : undefined,
  });

  const session = await auth.server.getSession(request);
  if (!session) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? 'admin@way.local',
    },
  };
}

export async function requireAdminSessionOrRedirect(pathname = '/admin'): Promise<SessionResult> {
  const session = await getAdminSessionFromHeaders(pathname);
  if (!session) {
    redirect('/admin/login');
  }
  return session;
}
