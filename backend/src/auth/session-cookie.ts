import type { CookieOptions } from 'express';

export const SESSION_COOKIE = 'distrirapido_session_v2';
export const LEGACY_SESSION_COOKIE = 'distrirapido_session';
export function sessionCookieOptions(secure: boolean): CookieOptions {
  return { httpOnly: true, secure, sameSite: 'lax', path: '/' };
}
export function readSessionCookie(header?: string): string | undefined {
  const parts = header?.split(';');
  const entry = parts?.find((part) => part.trim().startsWith(`${SESSION_COOKIE}=`)) ?? parts?.find((part) => part.trim().startsWith(`${LEGACY_SESSION_COOKIE}=`));
  if (!entry) return undefined;
  try { return decodeURIComponent(entry.trim().slice(entry.trim().indexOf('=') + 1)); }
  catch { return undefined; }
}
