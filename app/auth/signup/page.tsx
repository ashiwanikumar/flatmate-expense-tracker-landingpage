'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: 'group',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Personal Info, Step 2: Organization Info

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);

      toast.success('Account created! Please check your email to activate your account.');

      // Redirect to a confirmation page or login
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 2000);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validate step 1 fields
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 via-green-700/90 to-teal-600/90"></div>
        <div className="relative z-10 flex flex-col px-16 py-12 text-white">
          <div className="mb-auto">
            <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
          </div>
          <div className="flex-grow flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4">Welcome to Flatmate!</h1>
              <p className="text-xl text-green-100">
                Create your account and start managing expenses with your team
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
                  <h3 className="font-semibold text-lg">Quick Setup</h3>
                  <p className="text-green-100">Get started in minutes with easy account creation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Team Collaboration</h3>
                  <p className="text-green-100">Invite members and manage your organization</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure & Private</h3>
                  <p className="text-green-100">Your data is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 bg-white">
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo for mobile */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-16 w-16" />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">
                Step {step} of 2: {step === 1 ? 'Personal Information' : 'Organization Details'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex gap-2">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-900 mb-2">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      placeholder="+1234567890"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Next →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="organizationName" className="block text-sm font-medium text-gray-900 mb-2">
                      Organization/Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="organizationName"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                      placeholder="Acme Corporation"
                    />
                  </div>

                  <div>
                    <label htmlFor="organizationType" className="block text-sm font-medium text-gray-900 mb-2">
                      Organization Type
                    </label>
                    <select
                      id="organizationType"
                      name="organizationType"
                      value={formData.organizationType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
                    >
                      <option value="company">Company</option>
                      <option value="group">Group</option>
                      <option value="team">Team</option>
                      <option value="family">Family</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-auto pt-8 pb-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/privacy-policy" className="text-gray-600 hover:text-green-600">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-gray-600 hover:text-green-600">
              Terms of Service
            </Link>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
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
