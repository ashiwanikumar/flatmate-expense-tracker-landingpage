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

  // Authenticated - show children
  return <>{children}</>;
}
