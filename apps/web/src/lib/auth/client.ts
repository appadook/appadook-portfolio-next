'use client';

import { createWayAuthClient, getWayAuthErrorMessage } from '@way/auth-sdk';
import { WAY_AUTH_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { getWayAuthBaseUrl } from '@/lib/auth/config';

const wayAuthClient = createWayAuthClient({
  baseUrl: getWayAuthBaseUrl(),
  credentials: 'include',
});

function syncAccessTokenCookie(token: string | null) {
  if (typeof document === 'undefined') {
    return;
  }

  if (!token) {
    document.cookie = `${WAY_AUTH_ACCESS_TOKEN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${WAY_AUTH_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
}

async function syncCookieFromStore() {
  const token = await wayAuthClient.getAccessToken();
  syncAccessTokenCookie(token);
  return token;
}

function normalizeError(error: unknown): Error {
  const message = getWayAuthErrorMessage(error);
  return new Error(message);
}

export async function login(email: string, password: string) {
  try {
    const response = await wayAuthClient.login({ email, password });
    syncAccessTokenCookie(response.accessToken);
    return { user: response.user };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function signup(email: string, password: string) {
  try {
    const response = await wayAuthClient.signup({ email, password });
    syncAccessTokenCookie(response.accessToken);
    return { user: response.user };
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function bootstrapSession() {
  try {
    await wayAuthClient.refresh();
    await syncCookieFromStore();
    const me = await wayAuthClient.me();
    return { user: me.user };
  } catch {
    syncAccessTokenCookie(null);
    return null;
  }
}

export async function logout() {
  try {
    await wayAuthClient.logout();
  } finally {
    await wayAuthClient.clearAccessToken();
    syncAccessTokenCookie(null);
  }
}

export async function getSession() {
  return bootstrapSession();
}

export async function getAccessToken() {
  const token = await wayAuthClient.getAccessToken();
  return token;
}
