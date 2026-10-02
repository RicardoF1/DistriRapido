import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../features/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { accessPath } from '../routes/role-access';
import { SessionCheck } from '../components/SessionCheck';
export function LoginPage() {
  const { session, acceptSession, restoring, restoreError } = useAuth();
  const navigate = useNavigate();
  if (restoring || restoreError) return <SessionCheck />;
  if (session) return <Navigate to={accessPath(session.user.rol.nombre)} replace />;
  return <AuthLayout>
    <div className="login-intro"><span className="intro-icon" aria-hidden="true">↗</span><div><h2 id="login-title">Acceso al sistema</h2><p>Ingresa con tu cuenta registrada.</p></div></div>
    <LoginForm onSuccess={(response) => { acceptSession(response); navigate(accessPath(response.user.rol.nombre), { replace: true }); }} />
    <p className="access-note">El acceso se asigna según el rol de tu cuenta.</p>
  </AuthLayout>;
}
