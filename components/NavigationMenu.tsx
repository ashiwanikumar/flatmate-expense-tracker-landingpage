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
}

export default function NavigationMenu({ currentPath }: NavigationMenuProps) {
  const pathname = usePathname() || currentPath || '';
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const navItems: NavItem[] = [
    {
      label: 'Email Campaign',
      subItems: [
        { label: 'CSV Files', href: '/csv' },
        { label: 'Campaigns', href: '/campaigns' },
        { label: 'Company Accounts', href: '/company-accounts' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Calendar', href: '/calendar' },
      ],
    },
    {
      label: 'CMDB',
      subItems: [
        { label: 'CMDB Infrastructure', href: '/cmdb-infrastructure' },
        { label: 'Architecture', href: '/architecture' },
      ],
    },
    {
      label: 'Audit',
      subItems: [
        { label: 'Activity Logs', href: '/activity-logs' },
      ],
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
    <nav className="bg-white border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-4 sm:space-x-8">
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
                  className={`px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-300 ease-in-out ${
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
                  className={`px-2 sm:px-3 py-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-1 transition-all duration-300 ease-in-out ${
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
  );
}
