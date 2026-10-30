import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginForm } from '../features/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { accessPath } from '../routes/role-access';
import { SessionCheck } from '../components/SessionCheck';
export function LoginPage() {
  const { session, acceptSession, restoring, restoreError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordChanged] = useState(() => {
    try { return location.state?.passwordChanged === true || sessionStorage.getItem('ecoruta.password.changed.notice') === '1'; }
    catch { return location.state?.passwordChanged === true; }
  });
  useEffect(() => { try { sessionStorage.removeItem('ecoruta.password.changed.notice'); } catch { /* No sensitive data is stored. */ } }, []);
  if (restoring || restoreError) return <SessionCheck />;
  if (session) return <Navigate to={accessPath(session.user.rol.nombre)} replace />;
  return <AuthLayout>
    {passwordChanged && <p role="status">Contraseña actualizada. Tus sesiones anteriores se cerraron. Inicia sesión con la nueva contraseña.</p>}
    <div className="login-intro"><span className="intro-icon" aria-hidden="true">↗</span><div><h2 id="login-title">Acceso al sistema</h2><p>Ingresa con tu cuenta registrada.</p></div></div>
    <LoginForm onSuccess={(response) => { acceptSession(response); navigate(accessPath(response.user.rol.nombre), { replace: true }); }} />
    <p className="access-note">El acceso se asigna según el rol de tu cuenta.</p>
  </AuthLayout>;
}
