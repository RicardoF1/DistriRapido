import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { OrderLayout } from '../layouts/OrderLayout';
import { DriversLayout } from '../layouts/DriversLayout';
import { AvailabilityLayout } from '../layouts/AvailabilityLayout';
import { RoutesLayout } from '../layouts/RoutesLayout';
import { lazyPage } from './lazy-page';

// Green IT (área 4): cada página se descarga bajo demanda (code splitting con React.lazy y Suspense).
// Leaflet y los mapas solo se cargan al visitar las páginas que los usan.
const AccessPage = lazyPage(() => import('../pages/AccessPage'), 'AccessPage');
const DriverAccessPage = lazyPage(() => import('../pages/DriverAccessPage'), 'DriverAccessPage');
const UsersPage = lazyPage(() => import('../pages/UsersPage'), 'UsersPage');
const UserEditorPage = lazyPage(() => import('../pages/UserEditorPage'), 'UserEditorPage');
const OrderRegistrationPage = lazyPage(() => import('../pages/OrderRegistrationPage'), 'OrderRegistrationPage');
const OrdersPage = lazyPage(() => import('../pages/OrdersPage'), 'OrdersPage');
const OrderDetailPage = lazyPage(() => import('../pages/OrderDetailPage'), 'OrderDetailPage');
const VehiclesPage = lazyPage(() => import('../pages/VehiclesPage'), 'VehiclesPage');
const DriversPage = lazyPage(() => import('../pages/DriversPage'), 'DriversPage');
const AvailabilityPage = lazyPage(() => import('../pages/AvailabilityPage'), 'AvailabilityPage');
const PlanningPage = lazyPage(() => import('../pages/PlanningPage'), 'PlanningPage');
const RoutesPage = lazyPage(() => import('../pages/RoutesPage'), 'RoutesPage');
const RouteDetailPage = lazyPage(() => import('../pages/RouteDetailPage'), 'RouteDetailPage');
const OperationsPage = lazyPage(() => import('../pages/OperationsPage'), 'OperationsPage');

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/acceso/conductor" element={<DriverAccessPage />} />
        <Route
          path="/acceso/:role"
          element={<AccessPage />}
        />

        <Route element={<AdminLayout />}>
          <Route
            path="/usuarios"
            element={<UsersPage />}
          />
          <Route
            path="/usuarios/nuevo"
            element={<UserEditorPage />}
          />
          <Route
            path="/usuarios/:id/editar"
            element={<UserEditorPage />}
          />
          <Route
            path="/vehiculos"
            element={<VehiclesPage />}
          />
        </Route>

        <Route element={<RoutesLayout />}>
          <Route path="/planificacion" element={<PlanningPage />} />
          <Route path="/rutas" element={<RoutesPage />} />
          <Route path="/rutas/:id" element={<RouteDetailPage />} />
        </Route>
        <Route path="/seguimiento" element={<OperationsPage />} />
        <Route element={<DriversLayout />}>
          <Route
            path="/conductores"
            element={<DriversPage />}
          />
          <Route
            path="/conductores/nuevo"
            element={<DriversPage />}
          />
          <Route
            path="/conductores/:id"
            element={<DriversPage />}
          />
          <Route
            path="/conductores/:id/editar"
            element={<DriversPage />}
          />
        </Route>

        <Route element={<AvailabilityLayout />}>
          <Route
            path="/disponibilidad"
            element={<AvailabilityPage />}
          />
          <Route
            path="/disponibilidad/nuevo"
            element={<AvailabilityPage />}
          />
          <Route
            path="/disponibilidad/:id"
            element={<AvailabilityPage />}
          />
          <Route
            path="/disponibilidad/:id/editar"
            element={<AvailabilityPage />}
          />
        </Route>

        <Route element={<OrderLayout />}>
          <Route
            path="/pedidos"
            element={<OrdersPage />}
          />
          <Route
            path="/pedidos/:id"
            element={<OrderDetailPage />}
          />
          <Route
            path="/pedidos/nuevo"
            element={<OrderRegistrationPage />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}
