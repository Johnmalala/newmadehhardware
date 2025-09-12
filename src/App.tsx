import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ProductsPage from './components/Products/ProductsPage';
import PurchasesPage from './components/Purchases/PurchasesPage';
import PaymentsPage from './components/Payments/PaymentsPage';
import ReportsPage from './components/Reports/ReportsPage';

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
      <Routes>
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
            <div className="p-6">
              <h1 className="text-2xl font-bold">Backup & Restore</h1>
              <p className="text-gray-600">Backup and restore functionality will be implemented next.</p>
            </div>
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold">System Settings</h1>
              <p className="text-gray-600">System settings functionality will be implemented next.</p>
            </div>
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
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
