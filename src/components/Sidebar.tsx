'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpen }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, currentAnggota, isAdmin, isMember, logout } = useAuth();
  const { peminjaman, anggota, config } = useData();

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = peminjaman.filter(
    (p) => p.status === 'DIPINJAM' && p.tgl_kembali && p.tgl_kembali < todayStr
  ).length;

  const pendingCirculations = peminjaman.filter(
    (p) => p.status === 'MENUNGGU_ACC' || p.status === 'MENUNGGU_KEMBALI'
  ).length;

  const pendingVerifications = anggota.filter(
    (a) => a.status_verifikasi === 'PENDING'
  ).length;

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  return (
    <>
      {/* Left Edge Hover Trigger */}
      <div
        className="sidebar-edge-trigger"
        aria-label="Tampilkan sidebar (Panah Kiri)"
        title="Geser kursor ke kiri atau tekan Panah Kiri [←] untuk buka menu"
        onClick={onOpen}
        onMouseEnter={onOpen}
      />
      {/* Backdrop Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside
        className={`app-sidebar ${isOpen ? 'show' : ''}`}
        id="appSidebar"
        onMouseEnter={() => {
          if (onOpen) onOpen();
        }}
        onMouseLeave={() => {
          onClose();
        }}
      >
        {/* Brand Header: PustakaScan */}
        <div className="sidebar-brand">
          <div className="brand-wrapper">
            <div className="brand-icon" style={{ background: 'var(--apple-accent)', color: '#ffffff', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {config.logoInstansi ? (
                <img src={config.logoInstansi} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <i className="bx bx-barcode-reader" style={{ fontSize: '22px' }}></i>
              )}
            </div>
            <div className="brand-info">
              <h2 style={{ letterSpacing: '-0.02em', fontWeight: 800 }}>{config.namaAplikasi || 'PustakaScan'}</h2>
              <p style={{ fontSize: '11px', color: 'var(--apple-text-secondary)' }}>{config.namaInstansi || 'Perpustakaan Digital'}</p>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} title="Tutup Menu">
            <i className="bx bx-x"></i>
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="sidebar-scroll">
          {isAdmin ? (
            <>
              {/* Pantauan & Kasir Utama */}
              <div className="nav-section-title">Pantauan &amp; Kasir Utama</div>
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                  <Link
                    href={overdueCount > 0 ? '/admin/dashboard?view=monitor&tab=OVERDUE' : '/admin/dashboard'}
                    onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <i className="bx bx-grid-alt"></i>
                    <span style={{ flex: 1, fontWeight: 700 }}>Dashboard Pantauan</span>
                    {overdueCount > 0 ? (
                      <span
                        style={{
                          background: isActive('/admin/dashboard') ? '#ffffff' : 'var(--apple-danger-fill)',
                          color: isActive('/admin/dashboard') ? 'var(--apple-accent)' : '#fff',
                          padding: '2px 8px',
                          borderRadius: 'var(--apple-radius-pill)',
                          fontSize: '11px',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                        title={`${overdueCount} Buku Telat. Klik untuk buka daftar peminjam terlambat.`}
                      >
                        {overdueCount} Telat
                      </span>
                    ) : null}
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/admin/sirkulasi') ? 'active' : ''}`}>
                  <Link
                    href={pendingCirculations > 0 ? '/admin/sirkulasi?tab=riwayat&sub=pending' : '/admin/sirkulasi'}
                    onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <i className="bx bx-store-alt"></i>
                    <span style={{ flex: 1, fontWeight: 600 }}>Mode Kasir</span>
                    {pendingCirculations > 0 && (
                      <span
                        style={{
                          background: isActive('/admin/sirkulasi') ? '#ffffff' : 'var(--apple-warning-fill)',
                          color: isActive('/admin/sirkulasi') ? 'var(--apple-accent)' : '#fff',
                          padding: '2px 8px',
                          borderRadius: 'var(--apple-radius-pill)',
                          fontSize: '11px',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                        title={`${pendingCirculations} Pengajuan Sirkulasi Online. Klik untuk buka antrean.`}
                      >
                        {pendingCirculations}
                      </span>
                    )}
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/admin/scanner-test') ? 'active' : ''}`}>
                  <Link href="/admin/scanner-test" onClick={onClose}>
                    <i className="bx bx-barcode"></i>
                    <span>Diagnostik Scanner</span>
                  </Link>
                </li>
              </ul>

              <div className="nav-section-title">Koleksi &amp; Master Data</div>
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/admin/buku') ? 'active' : ''}`}>
                  <Link href="/admin/buku" onClick={onClose}>
                    <i className="bx bx-book-bookmark"></i>
                    <span>Koleksi &amp; Barcode</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/admin/verifikasi') ? 'active' : ''}`}>
                  <Link href="/admin/verifikasi" onClick={onClose} style={{ display: 'flex', alignItems: 'center' }}>
                    <i className="bx bx-user-check"></i>
                    <span style={{ flex: 1 }}>Verifikasi Anggota</span>
                    {pendingVerifications > 0 && (
                      <span
                        style={{
                          background: 'var(--apple-warning-fill)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 'var(--apple-radius-pill)',
                          fontSize: '11px',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        {pendingVerifications}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>

              <div className="nav-section-title">Pengaturan Sistem</div>
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/admin/master') ? 'active' : ''}`}>
                  <Link href="/admin/master?section=config" onClick={onClose}>
                    <i className="bx bx-slider-alt"></i>
                    <span>Aturan Denda &amp; Pinjam</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <button
                    className="sidebar-logout-button"
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin keluar (logout)?')) {
                        logout();
                        onClose();
                      }
                    }} 
                  >
                    <i className="bx bx-log-out"></i>
                    <span>Keluar (Logout)</span>
                  </button>
                </li>
              </ul>
            </>
          ) : isMember ? (
            <>
              {/* Member Navigation */}
              <div className="nav-section-title">Aktivitas Saya</div>
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                  <Link href="/" onClick={onClose}>
                    <i className="bx bx-grid-alt"></i>
                    <span>Beranda Utama</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/member/dashboard') ? 'active' : ''}`}>
                  <Link href="/member/dashboard" onClick={onClose}>
                    <i className="bx bx-id-card"></i>
                    <span>Kartu Anggota Digital</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/katalog') ? 'active' : ''}`}>
                  <Link href="/katalog" onClick={onClose}>
                    <i className="bx bx-library"></i>
                    <span>Katalog Koleksi (OPAC)</span>
                  </Link>
                </li>
              </ul>

              <div className="nav-section-title">Akun</div>
              <ul className="nav-list">
                <li className="nav-item">
                  <button
                    className="sidebar-logout-button"
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin keluar (logout)?')) {
                        logout();
                        onClose();
                      }
                    }} 
                  >
                    <i className="bx bx-log-out"></i>
                    <span>Keluar (Logout)</span>
                  </button>
                </li>
              </ul>
            </>
          ) : (
            <>
              {/* Public / Guest Navigation */}
              <div className="nav-section-title">Layanan Publik</div>
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                  <Link href="/" onClick={onClose}>
                    <i className="bx bx-home-alt"></i>
                    <span>Beranda Utama</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/katalog') ? 'active' : ''}`}>
                  <Link href="/katalog" onClick={onClose}>
                    <i className="bx bx-search-alt"></i>
                    <span>Katalog Terbuka (OPAC)</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/login') ? 'active' : ''}`}>
                  <Link href="/login" onClick={onClose}>
                    <i className="bx bx-log-in-circle"></i>
                    <span>Masuk (Petugas / Anggota)</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/register') ? 'active' : ''}`}>
                  <Link href="/register" onClick={onClose}>
                    <i className="bx bx-user-plus"></i>
                    <span>Pendaftaran Anggota</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
