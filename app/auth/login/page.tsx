'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, organizationAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import NotificationModal from '@/components/NotificationModal';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error' as 'error' | 'success' | 'warning' | 'info',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);

      // Save token first
      localStorage.setItem('token', response.data.token);

      // Fetch organization to get user's organization role
      try {
        const orgResponse = await organizationAPI.getMyOrganization();
        const organization = orgResponse.data.data;
        const currentUserId = response.data.user._id;

        // Find current user in organization members to get their role
        const memberData = organization.members.find((m: any) => m.user._id === currentUserId);
        const organizationRole = memberData?.role || 'member';

        // Add organizationRole to user object
        const userWithOrgRole = {
          ...response.data.user,
          organizationRole
        };

        localStorage.setItem('user', JSON.stringify(userWithOrgRole));
      } catch (orgError) {
        // If organization fetch fails, store user without organizationRole
        console.error('Failed to fetch organization role:', orgError);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      toast.success('Login successful!');

      // Redirect to intended page or default to /expenses
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/expenses';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath);
    } catch (error: any) {
      console.error('Login error:', error);

      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      let title = 'Login Failed';
      let message = errorMessage;

      // Check for specific error types
      if (errorMessage.toLowerCase().includes('user not found') ||
          errorMessage.toLowerCase().includes('invalid credentials')) {
        // Check if it's specifically a "user not found" scenario
        if (error.response?.status === 401) {
          // We can't differentiate between wrong password and user not found from backend
          // as it returns "Invalid credentials" for both for security reasons
          // But we can check the logged message pattern
          title = 'Authentication Error';
          message = 'Invalid email or password. Please check your credentials and try again.';
        }
      } else if (errorMessage.toLowerCase().includes('account') &&
                 errorMessage.toLowerCase().includes('deactivated')) {
        title = 'Account Deactivated';
        message = errorMessage;
      } else if (errorMessage.toLowerCase().includes('blocked')) {
        title = 'Account Blocked';
        message = errorMessage;
      }

      setModalState({
        isOpen: true,
        title,
        message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalState({
      ...modalState,
      isOpen: false,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-purple-700/90 to-blue-600/90"></div>
        <div className="relative z-10 flex flex-col px-16 py-12 text-white">
          <div className="mb-auto">
            <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
          </div>
          <div className="flex-grow flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4">Flatmate Expense Tracker</h1>
              <p className="text-xl text-purple-100">
                Manage shared expenses with your flatmates effortlessly
              </p>
            </div>
            <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Track Expenses</h3>
                <p className="text-purple-100">Add and manage all your shared expenses in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Split Bills Fairly</h3>
                <p className="text-purple-100">Automatically split expenses among flatmates</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Visual Reports</h3>
                <p className="text-purple-100">Track spending patterns with beautiful charts</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
              <p className="text-gray-600">
                Welcome to Flatmate Expense Tracker
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Sign up
                </Link>
              </p>
              <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
                ← Back to home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-auto pt-8 pb-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/privacy-policy" className="text-gray-600 hover:text-purple-600">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-gray-600 hover:text-purple-600">
              Terms of Service
            </Link>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            © {new Date().getFullYear()}{' '}
            <a
              href="https://www.netraga.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700"
            >
              Netraga
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  );
}
