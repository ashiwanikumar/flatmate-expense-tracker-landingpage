'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication immediately
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (!token || !user) {
        // Not authenticated - redirect immediately
        setIsAuthenticated(false);
        // Store the intended destination for redirect after login
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.replace('/auth/login');
        return;
      }

      // Validate token format (basic check)
      try {
        const userData = JSON.parse(user);
        if (!userData || !userData.email) {
          throw new Error('Invalid user data');
        }
        setIsAuthenticated(true);

        // Check if user has organization (organizationRole should not be null)
        if (!userData.organizationRole) {
          setHasOrganization(false);
        } else {
          setHasOrganization(true);
        }
      } catch (error) {
        // Invalid data - clear and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        sessionStorage.setItem('redirectAfterLogin', pathname);
        router.replace('/auth/login');
      }
    };

    checkAuth();

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router, pathname]);

  // Show nothing while checking auth (prevents flash of content)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting (prevents flash of content)
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User authenticated but no organization (removed from organization)
  if (isAuthenticated && hasOrganization === false) {
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/auth/login');
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Removed</h1>
            <p className="text-gray-600 mb-4">
              You have been removed from your organization. Please contact your organization administrator for more information.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Authenticated and has organization - show children
  return <>{children}</>;
}
