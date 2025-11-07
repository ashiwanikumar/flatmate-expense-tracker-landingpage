'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { organizationAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface WorkspaceInfo {
  organization: {
    _id: string;
    name: string;
    description?: string;
  };
  role: string;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
}

export default function JoinWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchWorkspaceInfo();
  }, [token]);

  const fetchWorkspaceInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationAPI.getWorkspaceInfo(token);
      setWorkspaceInfo(response.data.data);
    } catch (err: any) {
      console.error('Error fetching workspace info:', err);
      setError(err.response?.data?.message || 'Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setJoining(true);
      const response = await organizationAPI.joinWorkspace(token, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      const { token: authToken, user } = response.data.data;

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Successfully joined the workspace!');

      setTimeout(() => {
        router.push('/expenses');
      }, 1500);
    } catch (err: any) {
      console.error('Error joining workspace:', err);
      toast.error(err.response?.data?.message || 'Failed to join workspace');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-gray-500">Loading invitation...</div>
      </div>
    );
  }

  if (error || !workspaceInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error || 'This invitation link is no longer valid or has expired.'}</p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-purple-700/90 to-blue-600/90"></div>
        <div className="relative z-10 flex flex-col px-16 py-12 text-white">
          <div className="mb-auto">
            <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
          </div>
          <div className="flex-grow flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4">You're Invited!</h1>
              <p className="text-xl text-purple-100">
                Join your flatmates on the expense tracker
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm mb-6">
              <p className="text-sm text-purple-100 mb-2">Workspace:</p>
              <p className="text-lg font-semibold mb-4">{workspaceInfo.organization.name}</p>
              {workspaceInfo.organization.description && (
                <>
                  <p className="text-sm text-purple-100 mb-2">About:</p>
                  <p className="text-sm mb-4">{workspaceInfo.organization.description}</p>
                </>
              )}
              <p className="text-sm text-purple-100 mb-2">Your Role:</p>
              <p className="text-lg font-semibold capitalize mb-4">{workspaceInfo.role}</p>
              <p className="text-sm text-purple-100 mb-2">Invited by:</p>
              <p className="text-lg font-semibold">{workspaceInfo.invitedBy.name}</p>
              <p className="text-sm text-purple-100">{workspaceInfo.invitedBy.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600">
                Complete your profile to join as a <span className="font-semibold capitalize">{workspaceInfo.role}</span>
              </p>
            </div>

            <form onSubmit={handleJoinWorkspace} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={joining}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
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
    </div>
  );
}
