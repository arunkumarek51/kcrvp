import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Lazy loaded pages
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Activities   = lazy(() => import('./pages/Activities'));
const SubmitActivity = lazy(() => import('./pages/SubmitActivity'));
const Marketplace  = lazy(() => import('./pages/Marketplace'));
const Credits      = lazy(() => import('./pages/Credits'));
const Profile      = lazy(() => import('./pages/Profile'));
const MapView      = lazy(() => import('./pages/MapView'));
const AuditorPanel = lazy(() => import('./pages/AuditorPanel'));
const AdminPanel   = lazy(() => import('./pages/AdminPanel'));
const Leaderboard  = lazy(() => import('./pages/Leaderboard'));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail'));

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/"         element={<Navigate to="/dashboard" replace />} />

      {/* Protected */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"          element={<Dashboard />} />
        <Route path="/activities"         element={<Activities />} />
        <Route path="/activities/submit"  element={<SubmitActivity />} />
        <Route path="/activities/:id"     element={<ActivityDetail />} />
        <Route path="/marketplace"        element={<Marketplace />} />
        <Route path="/credits"            element={<Credits />} />
        <Route path="/map"                element={<MapView />} />
        <Route path="/profile"            element={<Profile />} />
        <Route path="/leaderboard"        element={<Leaderboard />} />
        <Route path="/auditor"            element={<ProtectedRoute roles={['auditor','admin']}><AuditorPanel /></ProtectedRoute>} />
        <Route path="/admin"              element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Sora, sans-serif', fontSize: '0.9rem', borderRadius: '12px' },
            success: { iconTheme: { primary: '#2d9b5a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#e05c3a', secondary: '#fff' } },
            duration: 4000
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
