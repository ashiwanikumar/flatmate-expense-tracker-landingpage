'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

interface HeaderProps {
  user: any;
  onMenuToggle?: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      // Call backend logout to clear cookies
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear cookies on client side as well (backup)
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    toast.success('Logged out successfully');

    // Force a full page reload to ensure all state is cleared
    window.location.href = '/';
  };

  return (
    <>
      <header className="bg-white shadow-sm relative">
        <div className="px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between items-center relative">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button - Mobile Only */}
              {onMenuToggle && (
                <button
                  onClick={onMenuToggle}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}

              <Link href="/expenses" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
                <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Flatmate Expense Tracker
                </h1>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <span className="hidden md:inline">Welcome, {user?.name}</span>
                  <span className="md:hidden">Account</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999]" style={{ marginTop: '8px' }}>
                    <Link
                      href="/account/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Account Settings</span>
                      </div>
                    </Link>

                    <Link
                      href="/activity-logs"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Activity Logs</span>
                      </div>
                    </Link>

                    <Link
                      href="/account/change-password"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>Change Password</span>
                      </div>
                    </Link>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
