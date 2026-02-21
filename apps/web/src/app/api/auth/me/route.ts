import { NextResponse } from 'next/server';
import { getAdminSessionFromHeaders } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSessionFromHeaders('/api/auth/me');

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  return NextResponse.json(
    { user: session.user },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
