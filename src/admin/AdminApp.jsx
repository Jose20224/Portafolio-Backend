import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';
import AdminLayout from './AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminProfile from './pages/AdminProfile';
import AdminProjects from './pages/AdminProjects';
import AdminCatalogs from './pages/AdminCatalogs';
import AdminMessages from './pages/AdminMessages';
import AdminMedia from './pages/AdminMedia';
import { Loading } from './AdminUI';

function ProtectedAdminLayout() {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#0a0f17]"><Loading label="Comprobando sesión…" /></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <AdminLayout />;
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="perfil" element={<AdminProfile />} />
        <Route path="proyectos" element={<AdminProjects />} />
        <Route path="categorias" element={<AdminCatalogs type="categories" />} />
        <Route path="habilidades" element={<AdminCatalogs type="skills" />} />
        <Route path="redes" element={<AdminCatalogs type="social" />} />
        <Route path="mensajes" element={<AdminMessages />} />
        <Route path="medios" element={<AdminMedia />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default function AdminApp() {
  return <AdminAuthProvider><AdminRoutes /></AdminAuthProvider>;
}
