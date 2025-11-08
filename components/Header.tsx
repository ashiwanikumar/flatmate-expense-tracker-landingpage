'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface HeaderProps {
  user: any;
  onMenuToggle?: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between items-center">
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
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden md:inline">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
