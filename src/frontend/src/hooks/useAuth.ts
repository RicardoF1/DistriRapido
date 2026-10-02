import { useContext } from 'react';
import { AuthContext } from '../features/auth/auth-context';
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requiere AuthProvider.');
  return context;
}
