import { NextResponse } from 'next/server';
import { getAdminSessionFromHeaders } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('GET /api/auth/me failed:', error);
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
