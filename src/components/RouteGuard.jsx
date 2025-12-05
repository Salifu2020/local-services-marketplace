import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUserRole, canAccessProfessionalFeatures } from '../utils/roles';
import { isCurrentUserAdmin } from '../utils/admin';
import { auth } from '../firebase';

/**
 * Route Guard Component
 * Protects routes based on user roles
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if access is granted
 * @param {string|string[]} props.allowedRoles - Role(s) allowed to access this route ('customer', 'professional', 'admin')
 * @param {string} props.redirectTo - Path to redirect to if access is denied (default: '/')
 */
function RouteGuard({ children, allowedRoles, redirectTo = '/' }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;
      
      // If no user, deny access unless allowedRoles includes 'guest'
      if (!user) {
        setHasAccess(allowedRoles.includes('guest'));
        setLoading(false);
        return;
      }

      // Check admin first (admins can access everything)
      const isAdmin = await isCurrentUserAdmin();
      if (isAdmin) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Get user role
      const role = await getUserRole();
      
      // Normalize allowedRoles to array
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user's role is in allowed roles
      setHasAccess(rolesArray.includes(role));
      setLoading(false);
    };

    checkAccess();
  }, [allowedRoles, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export default RouteGuard;

