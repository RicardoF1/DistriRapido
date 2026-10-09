import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';
export function OrderLayout() { return <AppLayout title="Pedidos"><Outlet /></AppLayout>; }
