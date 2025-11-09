'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsAuthenticated(true);
        setUserRole(userData.organizationRole || null);
      } catch (error) {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const getDefaultDashboard = () => {
    if (!isAuthenticated) {
      return '/auth/login';
    }
    // Cook users go to menus, others to expenses
    return userRole === 'cook' ? '/menus' : '/expenses';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Animation */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-3 sm:mb-4">
              404
            </h1>
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto mb-4 sm:mb-6">
              <svg className="w-full h-full text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Page Not Found</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-1 sm:mb-2">
              Oops! The page you're looking for doesn't exist.
            </p>
            <p className="text-sm sm:text-base text-gray-500">
              It might have been moved or deleted, or the URL might be incorrect.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium shadow-md min-w-[160px] text-sm sm:text-base"
            >
              ← Go Back
            </button>

            <Link
              href={getDefaultDashboard()}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-medium shadow-md min-w-[160px] text-sm sm:text-base text-center"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-4 sm:pt-6 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Quick Links:</p>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center text-xs sm:text-sm">
              {isAuthenticated ? (
                <>
                  {userRole !== 'cook' && (
                    <>
                      <Link href="/expenses" className="text-purple-600 hover:text-purple-700 font-medium">
                        Expenses
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link href="/organization" className="text-purple-600 hover:text-purple-700 font-medium">
                        Organization
                      </Link>
                      <span className="text-gray-300">|</span>
                    </>
                  )}
                  <Link href="/menus" className="text-purple-600 hover:text-purple-700 font-medium">
                    Menus
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/meal-ratings" className="text-purple-600 hover:text-purple-700 font-medium">
                    Meal Ratings
                  </Link>
                  {userRole !== 'cook' && (
                    <>
                      <span className="text-gray-300">|</span>
                      <Link href="/account" className="text-purple-600 hover:text-purple-700 font-medium">
                        Account
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                    Home
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium">
                    Sign Up
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 sm:py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            {/* Left - Copyright */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <span>
                © {new Date().getFullYear()}{' '}
                <a
                  href="https://www.netraga.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Netraga
                </a>
                . All rights reserved.
              </span>
            </div>

            {/* Center - Tagline */}
            <div className="text-xs sm:text-sm text-gray-400 order-1 sm:order-2">
              We build world-class software products
            </div>

            {/* Right - Links */}
            <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm order-3">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-purple-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
