import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AccessPage } from '../pages/AccessPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { UsersPage } from '../pages/UsersPage';
import { UserEditorPage } from '../pages/UserEditorPage';
import { OrderRegistrationPage } from '../pages/OrderRegistrationPage';
import { OrderLayout } from '../layouts/OrderLayout';
export function AppRoutes() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route path="/acceso/:role" element={<AccessPage />} /><Route element={<AdminLayout />}><Route path="/usuarios" element={<UsersPage />} /><Route path="/usuarios/nuevo" element={<UserEditorPage />} /><Route path="/usuarios/:id/editar" element={<UserEditorPage />} /></Route><Route element={<OrderLayout />}><Route path="/pedidos/nuevo" element={<OrderRegistrationPage />} /></Route></Route><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
}
