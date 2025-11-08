'use client';

import { useState } from 'react';
import Header from './Header';
import NavigationMenu from './NavigationMenu';
import Footer from './Footer';
import ProtectedRoute from './ProtectedRoute';

interface LayoutWrapperProps {
  user: any;
  children: React.ReactNode;
  requireAuth?: boolean; // Optional: set to false for public pages
}

export default function LayoutWrapper({ user, children, requireAuth = true }: LayoutWrapperProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const layoutContent = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onMenuToggle={toggleMobileMenu} />
      <NavigationMenu
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={closeMobileMenu}
      />
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );

  // If authentication is required, wrap with ProtectedRoute
  if (requireAuth) {
    return <ProtectedRoute>{layoutContent}</ProtectedRoute>;
  }

  // Otherwise, return layout without protection
  return layoutContent;
}
