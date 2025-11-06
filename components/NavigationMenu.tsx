'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SubMenuItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  subItems?: SubMenuItem[];
}

interface NavigationMenuProps {
  currentPath?: string;
  isMobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

export default function NavigationMenu({ currentPath, isMobileMenuOpen, onMobileMenuClose }: NavigationMenuProps) {
  const pathname = usePathname() || currentPath || '';
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const navItems: NavItem[] = [
    {
      label: 'Expenses',
      href: '/expenses',
    },
    {
      label: 'Availability',
      href: '/user-availability',
    },
    {
      label: 'Meal Ratings',
      href: '/meal-ratings',
    },
    {
      label: 'Menus',
      href: '/menus',
    },
    {
      label: 'Food Photos',
      href: '/food-photos',
    },
    {
      label: 'Invitations',
      href: '/invitations',
    },
    {
      label: 'Activity Logs',
      href: '/activity-logs',
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = Object.values(dropdownRefs.current).every(
        (ref) => ref && !ref.contains(event.target as Node)
      );
      if (clickedOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isDropdownActive = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some((item) => isActive(item.href));
  };

  return (
    <>
      {/* Desktop Navigation - Hidden on Mobile */}
      <nav className="hidden lg:block bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8">
            {navItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isItemActive = item.href
                ? isActive(item.href)
                : isDropdownActive(item.subItems);

              if (!hasSubItems && item.href) {
                // Simple link without dropdown
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-300 ease-in-out ${
                      isItemActive
                        ? 'text-purple-600 border-purple-600'
                        : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              // Dropdown menu
              return (
                <div
                  key={item.label}
                  className="relative group"
                  ref={(el) => {
                    dropdownRefs.current[item.label] = el;
                  }}
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={`px-3 py-4 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-1 transition-all duration-300 ease-in-out ${
                      isItemActive
                        ? 'text-purple-600 border-purple-600'
                        : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`}
                  >
                    {item.label}
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                        openDropdown === item.label ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {openDropdown === item.label && item.subItems && item.subItems.length > 0 && (
                    <div
                      className="absolute left-0 top-full w-64 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] animate-fadeIn"
                      style={{ marginTop: '0px' }}
                    >
                      <div className="py-2">
                        {item.subItems.map((subItem, index) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`block px-6 py-3 text-base font-medium transition-all duration-200 ease-in-out border-b border-gray-100 last:border-b-0 ${
                              isActive(subItem.href)
                                ? 'bg-purple-50 text-purple-600 font-semibold'
                                : 'text-gray-900 hover:bg-purple-50 hover:text-purple-600 hover:pl-7'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Navigation - Slides from Left */}
      <>
        {/* Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
            onClick={onMobileMenuClose}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img src="/img/logo/netraga_logo.png" alt="Logo" className="h-8 w-8" />
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Menu
              </h2>
            </div>
            <button
              onClick={onMobileMenuClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="overflow-y-auto h-[calc(100%-73px)]">
            <div className="py-4">
              {navItems.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isItemActive = item.href
                  ? isActive(item.href)
                  : isDropdownActive(item.subItems);

                if (!hasSubItems && item.href) {
                  // Simple link
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onMobileMenuClose}
                      className={`flex items-center px-6 py-4 text-base font-medium transition-all duration-200 border-l-4 ${
                        isItemActive
                          ? 'bg-purple-50 text-purple-600 border-purple-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                }

                // Menu item with sub-items (if needed in future)
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`w-full flex items-center justify-between px-6 py-4 text-base font-medium transition-all duration-200 border-l-4 ${
                        isItemActive
                          ? 'bg-purple-50 text-purple-600 border-purple-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <span>{item.label}</span>
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${
                          openDropdown === item.label ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Sub-items */}
                    {openDropdown === item.label && item.subItems && (
                      <div className="bg-gray-50">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onMobileMenuClose}
                            className={`block pl-12 pr-6 py-3 text-sm transition-all duration-200 ${
                              isActive(subItem.href)
                                ? 'text-purple-600 font-semibold bg-purple-50'
                                : 'text-gray-600 hover:text-purple-600 hover:bg-white'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      </>
    </>
  );
}
