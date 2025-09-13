import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout/Layout';

// Lazy load page components
const LandingPage = lazy(() => import('./components/LandingPage'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const ProductsPage = lazy(() => import('./components/Products/ProductsPage'));
const PurchasesPage = lazy(() => import('./components/Purchases/PurchasesPage'));
const PaymentsPage = lazy(() => import('./components/Payments/PaymentsPage'));
const ReportsPage = lazy(() => import('./components/Reports/ReportsPage'));
const BackupPage = lazy(() => import('./components/Backup/BackupPage'));
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage'));

const LoadingFallback: React.FC = () => (
  <div className="w-full h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return admin ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { admin } = useAuth();

  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={admin ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={admin ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/products" element={
            <PrivateRoute>
              <ProductsPage />
            </PrivateRoute>
          } />
          <Route path="/purchases" element={
            <PrivateRoute>
              <PurchasesPage />
            </PrivateRoute>
          } />
          <Route path="/payments" element={
            <PrivateRoute>
              <PaymentsPage />
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <ReportsPage />
            </PrivateRoute>
          } />
          <Route path="/admin-accounts" element={
            <PrivateRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Admin Account Management</h1>
                <p className="text-gray-600">Admin account management functionality will be implemented next.</p>
              </div>
            </PrivateRoute>
          } />
          <Route path="/backup" element={
            <PrivateRoute>
              <BackupPage />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
