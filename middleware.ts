import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/', // Home page
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/activate',
  '/privacy-policy',
  '/terms-of-service',
  '/join', // Public join pages
  '/invitations', // Invitations page (may have mixed access)
];

// Define routes that should redirect to /expenses if already logged in
// (users who are logged in should not access these auth pages)
const authOnlyRoutes = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/img') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });

  // Get token from cookies or check localStorage (client-side will handle localStorage)
  const token = request.cookies.get('token')?.value;

  // If user is on an auth page and has a token, redirect to /expenses
  if (authOnlyRoutes.some((route) => pathname.startsWith(route)) && token) {
    return NextResponse.redirect(new URL('/expenses', request.url));
  }

  // If user is accessing a protected route without token
  if (!isPublicRoute && !token) {
    // Store the intended destination
    const loginUrl = new URL('/auth/login', request.url);
    // The ProtectedRoute component will handle this on client side
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
