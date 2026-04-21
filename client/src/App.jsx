import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import RegisterPage from './pages/seafarer/RegisterPage';
import LoginPage from './pages/seafarer/LoginPage';
import DashboardPage from './pages/seafarer/DashboardPage';
import NewParcelPage from './pages/seafarer/NewParcelPage';
import PaymentSuccessPage from './pages/seafarer/PaymentSuccessPage';
import PaymentCancelPage from './pages/seafarer/PaymentCancelPage';
import PastPickupsPage from './pages/seafarer/PastPickupsPage';
import StaffLoginPage from './pages/staff/StaffLoginPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import ScanPage from './pages/staff/ScanPage';
import ReportsPage from './pages/staff/ReportsPage';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={user.role === 'staff' ? '/staff/dashboard' : '/dashboard'} />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'staff' ? '/staff/dashboard' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/staff/login" element={user ? <Navigate to="/staff/dashboard" /> : <StaffLoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute role="seafarer"><DashboardPage /></ProtectedRoute>} />
      <Route path="/parcels/new" element={<ProtectedRoute role="seafarer"><NewParcelPage /></ProtectedRoute>} />
      <Route path="/payment/success" element={<ProtectedRoute role="seafarer"><PaymentSuccessPage /></ProtectedRoute>} />
      <Route path="/payment/cancel" element={<ProtectedRoute role="seafarer"><PaymentCancelPage /></ProtectedRoute>} />
      <Route path="/past-pickups" element={<ProtectedRoute role="seafarer"><PastPickupsPage /></ProtectedRoute>} />
      <Route path="/staff/dashboard" element={<ProtectedRoute role="staff"><StaffDashboardPage /></ProtectedRoute>} />
      <Route path="/staff/scan" element={<ProtectedRoute role="staff"><ScanPage /></ProtectedRoute>} />
      <Route path="/staff/reports" element={<ProtectedRoute role="staff"><ReportsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
