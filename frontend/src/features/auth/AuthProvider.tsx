import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AuthSession, LoginResponse } from '../../types/auth';
import { AuthContext } from './auth-context';
import { authApi, ApiError } from '../../services/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const acceptSession = useCallback((value: LoginResponse | null) => {
    generation.current++;
    setSession(value ? { user: value.user, expiresAt: Date.now() + value.expiresIn * 1000 } : null);
    setRestoring(false); setRestoreError('');
  }, []);
  const retryRestore = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++generation.current;
    setRestoring(true); setRestoreError('');
    authApi.me(controller.signal).then((identity) => {
      if (controller.signal.aborted || current !== generation.current) return;
      setSession(identity.expiresAt > Date.now() ? { user: identity, expiresAt: identity.expiresAt } : null);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted || current !== generation.current) return;
      setSession(null);
      if (!(cause instanceof ApiError && cause.status === 401)) setRestoreError('No se pudo comprobar la sesión. Reintenta cuando el servidor esté disponible.');
    }).finally(() => {
      if (!controller.signal.aborted && current === generation.current) setRestoring(false);
    });
    return () => controller.abort();
  }, [attempt]);
  const logout = useCallback(async () => {
    generation.current++;
    await authApi.logout();
    setSession(null); setRestoring(false); setRestoreError('');
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => acceptSession(null), Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session, acceptSession]);
  useEffect(() => {
    const recheck = () => {
      if (document.visibilityState === 'visible') retryRestore();
    };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => { window.removeEventListener('focus', recheck); document.removeEventListener('visibilitychange', recheck); };
  }, [retryRestore]);
  return <AuthContext.Provider value={{ session, acceptSession, restoring, restoreError, retryRestore, logout }}>{children}</AuthContext.Provider>;
}
