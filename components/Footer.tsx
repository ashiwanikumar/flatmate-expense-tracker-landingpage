import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-300 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex flex-wrap justify-center gap-6 text-xs">
            <Link
              href="/privacy-policy"
              className="text-gray-300 hover:text-purple-400 transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-gray-300 hover:text-purple-400 transition"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-xs text-center">
            &copy; {new Date().getFullYear()}{' '}
            <a
              href="https://www.netraga.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition"
            >
              Netraga
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
