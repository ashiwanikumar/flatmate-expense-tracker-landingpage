import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flatmate Expense Tracker - Shared Expense Management',
  description: 'Track and manage shared expenses with your flatmates effortlessly',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                marginTop: '50vh',
                transform: 'translateY(-50%)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
