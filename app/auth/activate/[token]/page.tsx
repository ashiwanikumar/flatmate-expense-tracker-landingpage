'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ActivateAccountPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  useEffect(() => {
    if (token) {
      activateAccount();
    }
  }, [token]);

  const activateAccount = async () => {
    try {
      const response = await authAPI.activateAccount(token);

      setStatus('success');
      setMessage(response.data.message);
      setOrganizationName(response.data.data?.organizationName || '');

      toast.success('Account activated successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?activated=true');
      }, 3000);
    } catch (error: any) {
      console.error('Activation error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to activate account. The link may be invalid or expired.');
      toast.error('Activation failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/img/logo/netraga_logo.png" alt="Logo" className="h-16 w-16" />
          </div>

          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activating Your Account</h2>
              <p className="text-gray-600">Please wait while we verify your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activated!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              {organizationName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Organization:</span> {organizationName}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mb-6">
                Redirecting you to login page in 3 seconds...
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activation Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 mb-2">
                  <span className="font-semibold">Need a new activation link?</span>
                </p>
                <p className="text-xs text-yellow-700">
                  Contact support or use the resend activation option on the login page.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/login"
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all text-center"
                >
                  Go to Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all text-center"
                >
                  Sign Up Again
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()}{' '}
            <a
              href="https://www.netraga.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700"
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
