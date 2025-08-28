import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider, NotificationContainer } from './components/notifications/NotificationSystem';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Layout from './components/Layout';

// Import enhanced pages
import EnhancedDashboard from './pages/EnhancedDashboard';
import RealDataDashboard from './pages/RealDataDashboard';
import EnhancedOrders from './pages/EnhancedOrders';
import EnhancedInventory from './pages/EnhancedInventory';
import EnhancedShipments from './pages/EnhancedShipments';
import Products from './pages/Products';
import Vehicles from './pages/Vehicles';
import AdminDashboard from './pages/AdminDashboard';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Redirect root to dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* Main application routes */}
                <Route path="dashboard" element={<RealDataDashboard />} />
                <Route path="dashboard-old" element={<EnhancedDashboard />} />
                <Route path="orders" element={<EnhancedOrders />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<EnhancedInventory />} />
                <Route path="shipments" element={<EnhancedShipments />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>

              {/* Catch all route - redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            {/* Global Notification Container */}
            <NotificationContainer />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
