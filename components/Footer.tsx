import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-300 z-40">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Copyright */}
          <div className="text-xs flex-shrink-0">
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
