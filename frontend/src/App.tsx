import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public pages
import { WelcomePage } from './pages/WelcomePage';
import { PatientSignupPage } from './pages/PatientSignupPage';
import { PatientLoginPage } from './pages/PatientLoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

// Patient pages
import { PatientDashboard } from './pages/PatientDashboard';
import { PatientMenu } from './pages/PatientMenu';
import { MyOrders } from './pages/MyOrders';
import { MyFoodHistory } from './pages/MyFoodHistory';
import { MyBills } from './pages/MyBills';
import { PatientPaymentStatus } from './pages/PatientPaymentStatus';
import { PatientProfile } from './pages/PatientProfile';

// Admin pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminOrders } from './pages/AdminOrders';
import { AdminMenu } from './pages/AdminMenu';
import { AdminPatients } from './pages/AdminPatients';
import { AdminFoodRecords } from './pages/AdminFoodRecords';
import { AdminBills } from './pages/AdminBills';
import { AdminPayments } from './pages/AdminPayments';
import { AdminRoomView } from './pages/AdminRoomView';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<WelcomePage />} />
            <Route path="/patient/signup" element={<PatientSignupPage />} />
            <Route path="/patient/login" element={<PatientLoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Patient Routes */}
            <Route element={<ProtectedRoute allowedRole="PATIENT" />}>
              <Route
                path="/patient/dashboard"
                element={<MainLayout><PatientDashboard /></MainLayout>}
              />
              <Route
                path="/patient/menu"
                element={<MainLayout><PatientMenu /></MainLayout>}
              />
              <Route
                path="/patient/orders"
                element={<MainLayout><MyOrders /></MainLayout>}
              />
              <Route
                path="/patient/food-history"
                element={<MainLayout><MyFoodHistory /></MainLayout>}
              />
              <Route
                path="/patient/bills"
                element={<MainLayout><MyBills /></MainLayout>}
              />
              <Route
                path="/patient/payment-status"
                element={<MainLayout><PatientPaymentStatus /></MainLayout>}
              />
              <Route
                path="/patient/profile"
                element={<MainLayout><PatientProfile /></MainLayout>}
              />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
              <Route
                path="/admin/dashboard"
                element={<MainLayout><AdminDashboard /></MainLayout>}
              />
              <Route
                path="/admin/orders"
                element={<MainLayout><AdminOrders /></MainLayout>}
              />
              <Route
                path="/admin/menu"
                element={<MainLayout><AdminMenu /></MainLayout>}
              />
              <Route
                path="/admin/patients"
                element={<MainLayout><AdminPatients /></MainLayout>}
              />
              <Route
                path="/admin/food-records"
                element={<MainLayout><AdminFoodRecords /></MainLayout>}
              />
              <Route
                path="/admin/bills"
                element={<MainLayout><AdminBills /></MainLayout>}
              />
              <Route
                path="/admin/payments"
                element={<MainLayout><AdminPayments /></MainLayout>}
              />
              <Route
                path="/admin/room-view"
                element={<MainLayout><AdminRoomView /></MainLayout>}
              />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
