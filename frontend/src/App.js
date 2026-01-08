import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/layout/MainLayout';
import CRM from './pages/CRM';
import Inventory from './pages/Inventory';
import Production from './pages/Production';
import Procurement from './pages/Procurement';
import Accounts from './pages/Accounts';
import HRMS from './pages/HRMS';
import Quality from './pages/Quality';
import Settings from './pages/Settings';
import Customization from './pages/Customization';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import DirectorDashboard from './pages/DirectorDashboard';
import Gatepass from './pages/Gatepass';
import PayrollPage from './pages/PayrollPage';


const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/crm/*" element={<CRM />} />
                <Route path="/inventory/*" element={<Inventory />} />
                <Route path="/production/*" element={<Production />} />
                <Route path="/procurement/*" element={<Procurement />} />
                <Route path="/accounts/*" element={<Accounts />} />
                <Route path="/hrms/*" element={<HRMS />} />
                <Route path="/quality/*" element={<Quality />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/customization" element={<Customization />} />
                <Route path="/director" element={<DirectorDashboard />} />
                <Route path="/gatepass" element={<Gatepass />} />
                <Route path="/payroll" element={<PayrollPage />} />
              </Routes>
            </MainLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;