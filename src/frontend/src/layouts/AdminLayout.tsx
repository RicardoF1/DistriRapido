import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';
export function AdminLayout() { return <AppLayout title="Usuarios y roles" navigationLabel="Administración"><Outlet /></AppLayout>; }
