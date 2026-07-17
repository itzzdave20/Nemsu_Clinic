import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consultations from './pages/Consultations';
import Inventory from './pages/Inventory';
import Symptoms from './pages/Symptoms';
import Announcements from './pages/Announcements';
import Clinical from './pages/Clinical';
import Notifications from './pages/Notifications';
import Portal from './pages/Portal';
import Reports from './pages/Reports';

function homeFor(role) {
  return role === 'patient' ? '/portal' : '/dashboard';
}

function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={homeFor(user?.role)} replace />;
  }
  return children;
}

function GuestOnly({ children }) {
  const { token, user } = useAuthStore();
  if (token) return <Navigate to={homeFor(user?.role)} replace />;
  return children;
}

export default function App() {
  const { token, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to={homeFor(user?.role)} /> : <Landing />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
        <Route path="/reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
        <Route path="/portal" element={<ProtectedRoute roles={['patient']}><Portal /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute roles={['admin','doctor','nurse']}><Dashboard /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute roles={['admin','doctor','nurse']}><Patients /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/consultations" element={<ProtectedRoute roles={['admin','doctor']}><Consultations /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute roles={['admin','doctor','nurse']}><Inventory /></ProtectedRoute>} />
        <Route path="/clinical" element={<ProtectedRoute><Clinical /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['admin','doctor','nurse']}><Reports /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/symptoms" element={<ProtectedRoute><Symptoms /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
