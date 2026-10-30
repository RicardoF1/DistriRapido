import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';
export function RoutesLayout() { return <AppLayout title="Rutas" navigationLabel="Planificación y consulta de rutas"><Outlet /></AppLayout>; }
