import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/dataContext';
import { AuthProvider } from '@/lib/authContext';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

export const metadata: Metadata = {
  title: 'Pustaka Polinela | Perpustakaan Politeknik Negeri Lampung',
  description: 'Sistem Informasi Manajemen Perpustakaan Terpadu Politeknik Negeri Lampung dengan Barcode dan Sirkulasi Digital.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        {/* Boxicons CDN for exact matching icons from original PHP */}
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <DataProvider>
          <AuthProvider>
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </AuthProvider>
        </DataProvider>
      </body>
    </html>
  );
}
