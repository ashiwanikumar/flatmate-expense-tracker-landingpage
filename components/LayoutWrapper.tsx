'use client';

import { useState } from 'react';
import Header from './Header';
import NavigationMenu from './NavigationMenu';
import Footer from './Footer';

interface LayoutWrapperProps {
  user: any;
  children: React.ReactNode;
}

export default function LayoutWrapper({ user, children }: LayoutWrapperProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
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
}
