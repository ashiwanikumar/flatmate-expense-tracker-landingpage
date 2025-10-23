import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col overflow-hidden">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-10 w-10" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Campaign Manager
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-8 overflow-auto">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-xl md:text-2xl text-gray-600 mb-12">
              Automate your email campaigns with intelligent scheduling and progress tracking
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-12 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Drag & Drop Upload</h3>
                <p className="text-gray-600">
                  Simply drag and drop your CSV or Excel files to get started
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Visual Dashboard</h3>
                <p className="text-gray-600">
                  Track your campaigns with beautiful charts and analytics
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 md:col-span-1">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Auto Scheduling</h3>
                <p className="text-gray-600">
                  Set it and forget it with intelligent campaign automation
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 max-w-md mx-auto">
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
              >
                Get Started
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold border-2 border-purple-600 hover:bg-purple-50 transition-all text-lg"
              >
                Sign Up
              </Link>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-purple-600">1</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2">Upload your email list</h3>
                  <p className="text-sm text-gray-600">Upload CSV</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-purple-600">2</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2">Set your campaign settings</h3>
                  <p className="text-sm text-gray-600">Configure</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2">Create automated campaigns</h3>
                  <p className="text-sm text-gray-600">Schedule</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-purple-600">4</span>
                  </div>
                  <h3 className="text-base font-semibold mb-2">Monitor your progress</h3>
                  <p className="text-sm text-gray-600">Track</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
