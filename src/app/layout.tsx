import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DataProvider } from '@/lib/dataContext';
import { AuthProvider } from '@/lib/authContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Perpustakaan Polinela - Sistem Informasi Terpadu & Barcode',
  description: 'Sistem Informasi Manajemen Perpustakaan Terpadu Politeknik Negeri Lampung dengan Barcode, Sirkulasi Digital, dan Cloud Database Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased`}>
        <DataProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </DataProvider>
      </body>
    </html>
  );
}
