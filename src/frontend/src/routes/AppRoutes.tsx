import { DriversLayout } from '../layouts/DriversLayout';
import { DriversPage } from '../pages/DriversPage';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AccessPage } from '../pages/AccessPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { UsersPage } from '../pages/UsersPage';
import { UserEditorPage } from '../pages/UserEditorPage';
import { OrderRegistrationPage } from '../pages/OrderRegistrationPage';
import { OrderLayout } from '../layouts/OrderLayout';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
export function AppRoutes() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route path="/acceso/:role" element={<AccessPage />} /><Route element={<AdminLayout />}><Route path="/usuarios" element={<UsersPage />} /><Route path="/usuarios/nuevo" element={<UserEditorPage />} /><Route path="/usuarios/:id/editar" element={<UserEditorPage />} /></Route><Route element={<DriversLayout />}> <Route path="/conductores" element={<DriversPage />} /><Route path="/conductores/nuevo" element={<DriversPage />} /><Route path="/conductores/:id" element={<DriversPage />} /><Route path="/conductores/:id/editar" element={<DriversPage />} /></Route><Route element={<OrderLayout />}><Route path="/pedidos" element={<OrdersPage />} /><Route path="/pedidos/:id" element={<OrderDetailPage />} /><Route path="/pedidos/nuevo" element={<OrderRegistrationPage />} /></Route></Route><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
}
