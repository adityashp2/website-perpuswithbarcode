'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthReady } = useAuth();
  const { isLoading } = useData();
  const isPublicLanding = pathname === '/' && !currentUser;

  React.useEffect(() => {
    const isPublic = pathname === '/' || pathname === '/katalog' || pathname === '/login' || pathname === '/register' || pathname.startsWith('/buku/');
    const isAdminRoute = pathname.startsWith('/admin');
    const isMemberRoute = pathname.startsWith('/member');

    if (isLoading || !isAuthReady) return;
    if (isAdminRoute && currentUser?.type !== 'ADM') router.replace('/login');
    if (isMemberRoute && currentUser?.type !== 'MBR') router.replace('/login');
    if (!isPublic && !isAdminRoute && !isMemberRoute) router.replace('/');
  }, [currentUser, isAuthReady, isLoading, pathname, router]);

  return (
    <div className={`app-layout ${isPublicLanding ? 'public-landing-layout' : ''}`}>
      {!isPublicLanding && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <main className="app-main">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-container">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
