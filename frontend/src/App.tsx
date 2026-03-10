import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import ReservaPublica from "./pages/ReservaPublica";
import ReservaForm from "./pages/ReservaForm";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Perfil from "./pages/Perfil";
import Menu from "./components/Menu";
import MisReservas from "./pages/MisReservas";
import PublicLayout from "./components/layout/PublicLayout";
import PrivateLayout from "./components/layout/PrivateLayout";
import CambiarPassword from "./pages/CambiarPassword";
import AdminRoute from "./components/layout/AdminRoute";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import Footer from "./components/Footer";

/* =========================
   PRIVATE ROUTE
========================= */
function PrivateRoute({ children }: { children: ReactNode }) {
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
        <AppContent />

        {/* FOOTER GLOBAL */}
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
