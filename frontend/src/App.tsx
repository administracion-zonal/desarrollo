import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Footer from "./components/Footer";
import AdminRoute from "./components/layout/AdminRoute";
import PrivateLayout from "./components/layout/PrivateLayout";
import PublicLayout from "./components/layout/PublicLayout";
import Menu from "./components/Menu";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import AdminSolicitudesVehiculo from "./pages/AdminSolicitudesVehiculo";
import AdminVehiculos from "./pages/AdminVehiculos";
import CambiarPassword from "./pages/CambiarPassword";
import ChecklistWizard from "./pages/ChecklistWizard";
import Dashboard from "./pages/Dashboard";
import DashboardCancha from "./pages/DashboardCancha";
import GestionTH from "./pages/GestionTH";
import Login from "./pages/Login";
import MisReservas from "./pages/MisReservas";
import MisReservasCancha from "./pages/MisReservasCancha";
import MisReservasVehiculos from "./pages/MisReservasVehiculos";
import Perfil from "./pages/Perfil";
import Registro from "./pages/Registro";
import ReservaCanchaForm from "./pages/ReservaCanchaForm";
import ReservaForm from "./pages/ReservaForm";
import ReservaPublica from "./pages/ReservaPublica";
import ReservaVehiculoForm from "./pages/ReservaVehiculoForm";
/* =========================
   PRIVATE ROUTE
========================= */

type Props = Readonly<{
  children: ReactNode;
}>;

function PrivateRoute({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "20px" }}>Cargando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* =========================
   CONTENIDO REAL
========================= */
function AppContent() {
  const { user } = useAuth();

  return (
    <>
      {/* MENU SOLO SI ESTÁ LOGUEADO */}
      {user && <Menu />}

      <Routes>
        {/* =========================
           HOME PÚBLICO
        ========================= */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <ReservaPublica />
            </PublicLayout>
          }
        />

        {/* =========================
           LOGIN
        ========================= */}
        <Route
          path="/login"
          element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          }
        />

        {/* =========================
           REGISTRO
        ========================= */}
        <Route
          path="/registro"
          element={
            <PublicLayout>
              <Registro />
            </PublicLayout>
          }
        />

        {/* =========================
           PERFIL
        ========================= */}

        <Route
          path="/checklist"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <ChecklistWizard />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <Perfil />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/cambiar-password"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <CambiarPassword />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* =========================
           DASHBOARD ADMIN
        ========================= */}
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <PrivateLayout>
                <Dashboard />
              </PrivateLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/dashboard-cancha"
          element={
            <AdminRoute>
              <PrivateLayout>
                <DashboardCancha />
              </PrivateLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/vehiculos"
          element={
            <AdminRoute>
              <PrivateLayout>
                <AdminSolicitudesVehiculo />
              </PrivateLayout>
            </AdminRoute>
          }
        />

        {/* =========================
           MIS RESERVAS
           PRIVADO / ESTUDIANTE / ADMIN
        ========================= */}
        <Route
          path="/mis-reservas"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <MisReservas />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/mis-reservas-cancha"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <MisReservasCancha />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* =========================
           NUEVA RUTA → RESERVAS COWORKING
           ADMIN Y USUARIOS PUEDEN RESERVAR
        ========================= */}
        <Route path="/coworking" element={<ReservaPublica />} />

        <Route
          path="/reservar"
          element={
            <PrivateRoute>
              <ReservaForm />
            </PrivateRoute>
          }
        />

        <Route
          path="/cancha"
          element={
            <PrivateRoute>
              <ReservaCanchaForm />
            </PrivateRoute>
          }
        />

        {/* =========================
              VEHICULOS
            ========================= */}

        <Route
          path="/vehiculos/reservar"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <ReservaVehiculoForm />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* =========================
              TALENTO HUMANO
            ========================= */}

        <Route
          path="/gestion-th"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <GestionTH />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/vehiculos/mis"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <MisReservasVehiculos />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/vehiculos/admin"
          element={
            <AdminRoute>
              <PrivateLayout>
                <AdminVehiculos />
              </PrivateLayout>
            </AdminRoute>
          }
        />

        {/* =========================
           FALLBACK
        ========================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

/* =========================
   APP ROOT
========================= */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <AppContent />
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
