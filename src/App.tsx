import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerWebsite } from './components/CustomerWebsite';
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage';
import { AdminProductsPage } from './admin/pages/AdminProductsPage';
import { AdminOrdersPage } from './admin/pages/AdminOrdersPage';
import { AdminCustomersPage } from './admin/pages/AdminCustomersPage';
import { AdminUsersPage } from './admin/pages/AdminUsersPage';
import { AdminCategoriesPage } from './admin/pages/AdminCategoriesPage';
import { AdminSettingsPage } from './admin/pages/AdminSettingsPage';
import { AdminProtectedRoute } from './admin/AdminProtectedRoute';
import { getAdminToken, getAdminUser } from './utils/adminAuth';

const AdminRootRedirect: React.FC = () => {
  const token = getAdminToken();
  const user = getAdminUser();
  if (token && user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/admin/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================================= */}
        {/* 1. CUSTOMER WEBSITE ROUTES (Available at /, /products, etc.)     */}
        {/* Strictly separated from Admin. No Admin links shown anywhere.     */}
        {/* ================================================================= */}
        <Route path="/" element={<CustomerWebsite />} />
        <Route path="/products" element={<CustomerWebsite />} />
        <Route path="/about" element={<CustomerWebsite />} />
        <Route path="/contact" element={<CustomerWebsite />} />
        <Route path="/cart" element={<CustomerWebsite />} />
        <Route path="/login" element={<CustomerWebsite />} />

        {/* ================================================================= */}
        {/* 2. ADMIN AUTHENTICATION ROUTES                                    */}
        {/* Visiting /admin shows Admin Login (or Dashboard if already auth)   */}
        {/* ================================================================= */}
        <Route path="/admin" element={<AdminRootRedirect />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ================================================================= */}
        {/* 3. PROTECTED ADMIN PORTAL ROUTES (Enforces role === 'admin')      */}
        {/* Unauthenticated users are redirected to /admin/login automatically */}
        {/* ================================================================= */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminProtectedRoute>
              <AdminProductsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminProtectedRoute>
              <AdminOrdersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminProtectedRoute>
              <AdminCustomersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUsersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminProtectedRoute>
              <AdminCategoriesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminProtectedRoute>
              <AdminSettingsPage />
            </AdminProtectedRoute>
          }
        />

        {/* Fallback for unknown /admin routes */}
        <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />

        {/* Catch-all for customer storefront */}
        <Route path="*" element={<CustomerWebsite />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
