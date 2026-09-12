import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Orders } from './pages/Orders';
import { Shipments } from './pages/Shipments';
import { Suppliers } from './pages/Suppliers';
import { DemandForecasting } from './pages/DemandForecasting';
import { DbmsShowcase } from './pages/DbmsShowcase';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Protected Route Guard
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedLayout>
                <Inventory />
              </ProtectedLayout>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedLayout>
                <Orders />
              </ProtectedLayout>
            }
          />
          <Route
            path="/shipments"
            element={
              <ProtectedLayout>
                <Shipments />
              </ProtectedLayout>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedLayout>
                <Suppliers />
              </ProtectedLayout>
            }
          />
          <Route
            path="/forecasting"
            element={
              <ProtectedLayout>
                <DemandForecasting />
              </ProtectedLayout>
            }
          />
          <Route
            path="/dbms-showcase"
            element={
              <ProtectedLayout>
                <DbmsShowcase />
              </ProtectedLayout>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

