'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPublicLanding = pathname === '/' && !currentUser;

  useEffect(() => {
    const isPublic = pathname === '/' || pathname === '/katalog' || pathname === '/login' || pathname === '/register' || pathname.startsWith('/buku/');
    const isAdminRoute = pathname.startsWith('/admin');
    const isMemberRoute = pathname.startsWith('/member');

    if (isLoading || !isAuthReady) return;
    if (isAdminRoute && currentUser?.type !== 'ADM') router.replace('/login');
    if (isMemberRoute && currentUser?.type !== 'MBR') router.replace('/login');
    if (!isPublic && !isAdminRoute && !isMemberRoute) router.replace('/');
  }, [currentUser, isAuthReady, isLoading, pathname, router]);

  // Close sidebar on route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Keyboard navigation for sidebar: ArrowLeft to open, ArrowRight or Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPublicLanding) return;
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSidebarOpen(true);
      } else if (e.key === 'ArrowRight' || e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    // Auto-reveal sidebar when cursor moves to the left edge (<= 25px from left edge)
    const handleMouseMove = (e: MouseEvent) => {
      if (isPublicLanding) return;
      if (e.clientX <= 25) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [pathname]);

  // Dedicated clean auth screen for Login and Register (no sidebar, no topbar/headbar)
  if (isAuthPage) {
    return (
      <div
        className="auth-fullscreen-container"
        style={{
          minHeight: '100vh',
          background: 'var(--apple-bg-base)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Simple, elegant Top Bar with Logo and Back Button */}
        <header
          style={{
            padding: '16px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'var(--apple-text-primary)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--apple-accent)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
              }}
            >
              <i className="bx bx-barcode-reader" />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>
                PustakaScan
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--apple-text-secondary)' }}>
                Perpustakaan Digital Polinela
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="apple-btn-secondary"
            style={{
              fontSize: '13px',
              padding: '7px 16px',
              minHeight: '34px',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <i className="bx bx-arrow-back" />
            <span>Kembali ke Beranda</span>
          </Link>
        </header>

        {/* Content Centered */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`app-layout ${isPublicLanding ? 'public-landing-layout' : ''} ${sidebarOpen && !isPublicLanding ? 'sidebar-open' : 'sidebar-closed'}`}>
      {!isPublicLanding && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpen={() => setSidebarOpen(true)}
        />
      )}
      <main
        className="app-main"
        style={{
          marginLeft: (!isPublicLanding && sidebarOpen) ? '270px' : '0px',
          width: (!isPublicLanding && sidebarOpen) ? 'calc(100% - 270px)' : '100%',
          transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-container">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
