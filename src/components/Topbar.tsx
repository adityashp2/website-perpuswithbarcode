'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, currentAnggota, logout } = useAuth();
  const { config } = useData();
  const [search, setSearch] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [clockTime, setClockTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setClockTime(`${hours}:${minutes}:${seconds} WIB`);

      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      setClockDate(`${now.getDate()} ${months[now.getMonth()]}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/katalog?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push('/katalog');
    }
  };

  const displayName = currentAnggota?.nama
    ? currentAnggota.nama.split(' ')[0]
    : currentUser
    ? currentUser.username
    : '';

  const isPublicLanding = pathname === '/' && !currentUser;

  return (
    <header className="app-topbar" style={isPublicLanding ? { display: 'flex', justifyContent: 'center', padding: '6px 20px' } : undefined}>
      <div
        style={isPublicLanding ? {
          maxWidth: '1200px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        } : {
          display: 'contents',
        }}
      >
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {isPublicLanding ? (
          <>
            <Link
              href="#home"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                color: 'var(--apple-text-primary)',
                marginRight: '12px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0071e3 0%, #1e40af 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 4px 10px rgba(0, 113, 227, 0.25)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {config?.logoInstansi ? (
                  <img src={config.logoInstansi} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <i className="bx bx-barcode-reader" />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  {config?.namaAplikasi || 'Pustaka Polinela'}
                </strong>
                <span style={{ fontSize: '10.5px', color: 'var(--apple-text-secondary)', fontWeight: 500 }}>
                  {config?.namaInstansi || 'Perpustakaan Digital'}
                </span>
              </div>
            </Link>

            <nav className="landing-header-nav" style={{ display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }} aria-label="Navigasi landing page">
              <a href="#home" className="landing-nav-link" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-text-primary)', padding: '5px 9px', borderRadius: '8px', textDecoration: 'none' }}>
                Home
              </a>
              <a href="#tentang" className="landing-nav-link" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--apple-text-secondary)', padding: '5px 9px', borderRadius: '8px', textDecoration: 'none' }}>
                Tentang
              </a>
              <a href="#keunggulan" className="landing-nav-link" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--apple-text-secondary)', padding: '5px 9px', borderRadius: '8px', textDecoration: 'none' }}>
                Keunggulan
              </a>
              <a href="#koleksi-buku" className="landing-nav-link" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--apple-text-secondary)', padding: '5px 9px', borderRadius: '8px', textDecoration: 'none' }}>
                Koleksi Buku
              </a>
              <a href="#faq" className="landing-nav-link" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--apple-text-secondary)', padding: '5px 9px', borderRadius: '8px', textDecoration: 'none' }}>
                FAQ
              </a>
              <a href="#pendaftaran" className="landing-nav-link" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--apple-text-secondary)', padding: '5px 9px', borderRadius: '8px', textDecoration: 'none' }}>
                Pendaftaran
              </a>
              <a href="#kontak" className="landing-nav-link" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--apple-text-secondary)', padding: '5px 9px', borderRadius: '8px', textDecoration: 'none' }}>
                Kontak
              </a>
            </nav>
          </>
        ) : (
          <>
            <button
              type="button"
              className="apple-btn-secondary"
              id="mobileToggle"
              title="Buka / Tutup Sidebar"
              onClick={onToggleSidebar}
              style={{
                padding: '6px 10px',
                minHeight: '34px',
                borderRadius: 'var(--apple-radius-sm)',
                border: '1px solid var(--apple-border)',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              <i className="bx bx-sidebar" style={{ fontSize: '18px', color: 'var(--apple-text-secondary)' }}></i>
            </button>

            {!currentUser ? (
              <nav className="apple-segmented-control" aria-label="Navigasi utama">
                <Link href="/" className="apple-segment-btn">
                  <i className="bx bx-home-alt" style={{ fontSize: '15px' }}></i> Beranda
                </Link>
                <Link href="/katalog" className="apple-segment-btn">
                  <i className="bx bx-library" style={{ fontSize: '15px' }}></i> Katalog
                </Link>
              </nav>
            ) : null}
          </>
        )}
      </div>

      <div className="topbar-right">
        {/* Spotlight-style Search Input */}
        <form onSubmit={handleSearchSubmit} className="topbar-search" style={{ maxWidth: '300px' }}>
          <i
            className="bx bx-search search-icon"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--apple-text-tertiary)',
              fontSize: '15px',
              pointerEvents: 'none'
            }}
          ></i>
          <input
            type="text"
            placeholder="Cari buku, ISBN, penulis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 32px 7px 34px',
              background: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid transparent',
              borderRadius: 'var(--apple-radius-pill)',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--apple-text-primary)',
              outline: 'none',
              transition: 'all 0.18s ease'
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--apple-text-tertiary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                fontSize: '14px'
              }}
              title="Hapus pencarian"
            >
              <i className="bx bx-x-circle"></i>
            </button>
          )}
        </form>

        {/* macOS Menu Bar Style Live Clock */}
        <div
          id="liveClock"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(0, 0, 0, 0.03)',
            borderRadius: 'var(--apple-radius-pill)',
            fontSize: '12px',
            color: 'var(--apple-text-secondary)',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
          title="Waktu Lokal Saat Ini"
        >
          <i className="bx bx-time-five" style={{ fontSize: '13px', color: 'var(--apple-text-tertiary)' }}></i>
          <span>{clockDate}</span>
          <span style={{ color: 'var(--apple-border)' }}>|</span>
          <span style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>
            {clockTime || '--:-- WIB'}
          </span>
        </div>

        {/* User / Authentication Actions */}
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link
              href={currentUser.type === 'ADM' ? '/admin/dashboard' : '/member/dashboard'}
              className="apple-btn-secondary"
              style={{
                padding: '5px 12px',
                minHeight: '32px',
                fontSize: '12.5px',
                fontWeight: 500,
                gap: '6px'
              }}
            >
              <i className="bx bx-user" style={{ fontSize: '14px' }}></i>
              <span>{displayName}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin keluar (logout)?')) {
                  logout();
                }
              }}
              className="apple-btn-secondary"
              title="Keluar (Logout)"
              style={{
                padding: '6px 9px',
                minHeight: '32px',
                color: 'var(--apple-danger-text)',
                cursor: 'pointer'
              }}
            >
              <i className="bx bx-log-out" style={{ fontSize: '16px' }}></i>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link href="/login" className="apple-btn-primary" style={{ padding: '6px 14px', minHeight: '32px', fontSize: '13px' }}>
              Masuk
            </Link>
            <Link href="/register" className="apple-btn-secondary" style={{ padding: '6px 14px', minHeight: '32px', fontSize: '13px' }}>
              Daftar
            </Link>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}

