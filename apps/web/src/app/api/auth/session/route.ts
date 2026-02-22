import { NextResponse } from 'next/server';
import { getWayAuthBaseUrlServer } from '@/server/env';

const ACCESS_TOKEN_COOKIE_NAME = 'way_access_token';
const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
const SIGNUP_SECRET_HEADER = 'x-way-signup-secret';

type SessionMode = 'login' | 'signup';

type AuthSuccessPayload = {
  accessToken: string;
  expiresIn?: unknown;
};

type AuthErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
  };
};

function isSessionMode(value: unknown): value is SessionMode {
  return value === 'login' || value === 'signup';
}

function parsePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
}

function readAuthErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as AuthErrorPayload;
  return typeof candidate.error?.message === 'string' ? candidate.error.message : null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      mode?: unknown;
      email?: unknown;
      password?: unknown;
    };

    if (!isSessionMode(payload.mode)) {
      return NextResponse.json({ error: { message: 'Invalid auth mode.' } }, { status: 400 });
    }

    if (typeof payload.email !== 'string' || typeof payload.password !== 'string') {
      return NextResponse.json({ error: { message: 'Email and password are required.' } }, { status: 400 });
    }

    const authBaseUrl = getWayAuthBaseUrlServer();
    const upstreamPath = payload.mode === 'login' ? '/api/v1/login' : '/api/v1/signup';
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (payload.mode === 'signup') {
      const signupSecret = process.env.WAY_AUTH_SIGNUP_SECRET?.trim();
      if (signupSecret) {
        headers.set(SIGNUP_SECRET_HEADER, signupSecret);
      }
    }

    const upstreamResponse = await fetch(`${authBaseUrl}${upstreamPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
      cache: 'no-store',
    });

    const upstreamBody = await upstreamResponse.text();
    let parsedUpstreamBody: unknown = null;
    if (upstreamBody) {
      try {
        parsedUpstreamBody = JSON.parse(upstreamBody) as unknown;
      } catch {
        parsedUpstreamBody = null;
      }
    }

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: {
            message: readAuthErrorMessage(parsedUpstreamBody) ?? 'Authentication failed.',
          },
        },
        {
          status: upstreamResponse.status,
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const authPayload = parsedUpstreamBody as AuthSuccessPayload | null;
    const accessToken = authPayload?.accessToken;
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        {
          error: {
            message: 'Authentication succeeded without access token.',
          },
        },
        {
          status: 502,
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const response = NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );

    const refreshCookie = upstreamResponse.headers.get('set-cookie');
    if (refreshCookie) {
      response.headers.append('set-cookie', refreshCookie);
    }

    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      secure: new URL(request.url).protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: parsePositiveInteger(authPayload?.expiresIn, DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS),
    });

    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('POST /api/auth/session failed:', error);
    }
    return NextResponse.json(
      {
        error: {
          message: 'Unexpected authentication error.',
        },
      },
      { status: 500 },
    );
  }
}
