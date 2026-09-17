import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/dataContext';
import { AuthProvider } from '@/lib/authContext';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

export const metadata: Metadata = {
  title: 'PustakaScan — Sistem Sirkulasi Perpustakaan Cepat ala Kasir Indomaret',
  description: 'Website Perpustakaan Profesional dengan Mode Kasir Cepat, Barcode Scanner Keyboard-Wedge, dan Estetika Apple Human Interface Guidelines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <head>
        {/* Boxicons CDN */}
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
