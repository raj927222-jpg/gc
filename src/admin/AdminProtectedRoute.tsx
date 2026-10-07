import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { getAdminToken, getAdminUser, verifyAdminSession } from '../utils/adminAuth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      const token = getAdminToken();
      const user = getAdminUser();

      if (!token || !user || user.role !== 'admin') {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsVerifying(false);
        }
        return;
      }

      // Verify token with backend /api/admin/me
      const valid = await verifyAdminSession();
      if (isMounted) {
        setIsAuthenticated(valid);
        setIsVerifying(false);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-[#ECE7DA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-[#D4AF37] uppercase">
            AUTHORIZING SECURE ACCESS...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};
