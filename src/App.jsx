import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import AppLayout from '@/components/AppLayout';
import Spinner from '@/components/Spinner';
import StudyModule from '@/pages/StudyModule';
import AliyosModule from '@/pages/AliyosModule';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AdminRoutes from '@/pages/admin/AdminRoutes';

function RequireUser() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <DataProvider>
      <Outlet />
    </DataProvider>
  );
}

function RequireAdmin() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/study" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireUser />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/study" replace />} />
                <Route path="/study/*" element={<StudyModule />} />
                <Route path="/aliyos/*" element={<AliyosModule />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin/*" element={<AdminRoutes />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
