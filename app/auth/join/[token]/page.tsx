'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { organizationAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function JoinOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await organizationAPI.acceptInvitation(token, {
        name: formData.name,
        password: formData.password,
      });

      toast.success('Invitation accepted! Your account has been created.');

      // Redirect to login
      setTimeout(() => {
        router.push('/auth/login?invited=true');
      }, 2000);
    } catch (error: any) {
      console.error('Accept invitation error:', error);
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/90 to-indigo-600/90"></div>
        <div className="relative z-10 flex flex-col px-16 py-12 text-white">
          <div className="mb-auto">
            <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
          </div>
          <div className="flex-grow flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4">You're Invited!</h1>
              <p className="text-xl text-blue-100">
                Join your team on Flatmate Expense Tracker
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
                  <h3 className="font-semibold text-lg">Join Your Team</h3>
                  <p className="text-blue-100">Accept the invitation and create your account</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Start Collaborating</h3>
                  <p className="text-blue-100">Manage expenses together with your organization</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Stay Organized</h3>
                  <p className="text-blue-100">Track and split expenses effortlessly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Join Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Accept Invitation</h2>
              <p className="text-gray-600">
                Create your account to join the organization
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Accept & Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-auto pt-8 pb-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-gray-600 hover:text-blue-600">
              Terms of Service
            </Link>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            © {new Date().getFullYear()}{' '}
            <a
              href="https://www.netraga.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              Netraga
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
