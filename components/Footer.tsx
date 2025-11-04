import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-0">
          {/* Left side - Copyright - Centered on mobile */}
          <div className="text-xs flex-shrink-0 text-center sm:text-left">
            &copy; {new Date().getFullYear()}{' '}
            <a
              href="https://www.netraga.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
            >
              Netraga
            </a>
            . All rights reserved.
          </div>

          {/* Middle - Tagline */}
          <div className="text-xs text-center hidden md:block flex-1 px-8">
            We build world-class software products
          </div>

          {/* Right side - Links - Hidden on mobile */}
          <div className="hidden sm:flex gap-6 text-xs flex-shrink-0">
            <Link
              href="/privacy-policy"
              className="text-gray-300 hover:text-purple-400 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-gray-300 hover:text-purple-400 transition-colors duration-200"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
