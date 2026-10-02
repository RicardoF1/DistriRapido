import { createContext } from 'react';
import type { AuthSession, LoginResponse } from '../../types/auth';
export interface AuthContextValue {
  session: AuthSession | null;
  acceptSession: (session: LoginResponse | null) => void;
  restoring: boolean;
  restoreError: string;
  retryRestore: () => void;
  logout: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
