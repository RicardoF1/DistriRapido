import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';

export function AvailabilityLayout() {
  return (
    <AppLayout
      title="Disponibilidad operativa"
      navigationLabel="Gestión de disponibilidad"
    >
      <Outlet />
    </AppLayout>
  );
}
