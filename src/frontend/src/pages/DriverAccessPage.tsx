import { useEffect, useState } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../services/api';
import { driverProfileApi, type DriverProfile } from '../services/driver-profile-api';
import { DriverOwnPassword } from '../features/drivers/DriverCredentialsPanel';

export function DriverAccessPage() {
  const { session, acceptSession } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [error, setError] = useState<{ message: string; retry: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null); setError(null);
    driverProfileApi.me(controller.signal).then(value => {
      if (!controller.signal.aborted) setProfile(value);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) { acceptSession(null); return; }
      setError({ message: cause instanceof Error ? cause.message : 'No se pudo comprobar tu identidad de conductor.', retry: !(cause instanceof ApiError && cause.status === 403) });
    });
    return () => controller.abort();
  }, [session, acceptSession, attempt]);

  return <AppLayout title="Mi panel" navigationLabel="Área del conductor">
    <section className="driver-portal" aria-labelledby="driver-panel-title">
      <header className="driver-portal-heading"><p className="driver-portal-eyebrow">EcoRuta Huancayo · Mi espacio</p><h1 id="driver-panel-title">Panel del conductor</h1><p>Tu acceso personal a la operación de entregas.</p></header>
      {error ? <section className="users-panel"><ErrorMessage message={error.message} />{error.retry && <button className="button button-secondary" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>}</section> : !profile ? <p role="status" className="users-panel">Comprobando tu identidad de conductor…</p> : <>
        <div className="driver-identity"><span className="driver-identity-icon" aria-hidden="true">✓</span><div><strong>{profile.nombre_completo}</strong><p>Identidad de conductor verificada</p></div><span className="driver-identity-state">Estado administrativo: {profile.estado}</span></div>
        <div className="driver-panel-grid">
          <DriverOwnPassword />
          <section id="mi-jornada" className="users-panel driver-panel-card driver-day" aria-labelledby="driver-day-title"><h2 id="driver-day-title">Mi jornada</h2><p>Tu ficha administrativa está activa.</p><p className="driver-feature-note">La consulta de tu disponibilidad se habilitará próximamente en este panel.</p></section>
          <section id="mis-rutas" className="users-panel driver-panel-card" aria-labelledby="driver-routes-title"><span className="driver-feature-label">Próximamente</span><h2 id="driver-routes-title">Mis rutas</h2><p>La consulta de rutas estará disponible cuando se implemente el módulo de asignaciones</p><p className="driver-feature-note">Aquí podrás consultar la jornada, el recorrido y el orden de tus paradas.</p></section>
          <section id="mis-entregas" className="users-panel driver-panel-card" aria-labelledby="driver-deliveries-title"><span className="driver-feature-label">Próximamente</span><h2 id="driver-deliveries-title">Mis entregas</h2><p>La consulta y el registro de resultados de tus entregas estarán disponibles próximamente.</p><p className="driver-feature-note">Se mostrarán únicamente entregas pertenecientes a tus rutas asignadas.</p></section>
        </div>
      </>}
    </section>
  </AppLayout>;
}
