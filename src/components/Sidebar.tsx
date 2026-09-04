'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, currentAnggota, isAdmin, isMember, logout } = useAuth();
  const { peminjaman, anggota } = useData();

  const pendingCirculations = peminjaman.filter(
    (p) => p.status === 'MENUNGGU_ACC' || p.status === 'MENUNGGU_KEMBALI'
  ).length;

  const pendingVerifications = anggota.filter(
    (a) => a.status_verifikasi === 'PENDING'
  ).length;

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  return (
    <>
      <div
        className="sidebar-edge-trigger"
        aria-label="Tampilkan sidebar"
      />
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside className={`app-sidebar ${isOpen ? 'show' : ''}`} id="appSidebar">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <i className="bx bxs-book-reader"></i>
            </div>
            <div className="brand-info">
              <h2>Pustaka Polinela</h2>
              <p>Politeknik Negeri Lampung</p>
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
              {/* Admin Navigation */}
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                  <Link href="/admin/dashboard" onClick={onClose}>
                    <i className="bx bx-grid-alt"></i>
                    <span>Dashboard</span>
                  </Link>
                </li>
              </ul>

              <ul className="nav-list">
                <li className="nav-item">
                  <Link href="/admin/buku?view=stock" onClick={onClose}>
                    <i className="bx bx-layer"></i>
                    <span>Kelola Stok</span>
                  </Link>
                </li>
              </ul>

              <ul className="nav-list">
                <li className={`nav-item ${isActive('/admin/sirkulasi') ? 'active' : ''}`}>
                  <Link href="/admin/sirkulasi" onClick={onClose}>
                    <i className="bx bx-check-shield"></i>
                    <span>
                      Panel ACC Pinjam/Kembali
                      {pendingCirculations > 0 && (
                        <span style={{
                          background: '#ef4444',
                          color: '#fff',
                          padding: '1px 7px',
                          borderRadius: '99px',
                          fontSize: '10px',
                          marginLeft: '6px',
                          fontWeight: 700
                        }}>
                          {pendingCirculations}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              </ul>

              <ul className="nav-list">
                <li className={`nav-item ${isActive('/admin/verifikasi') ? 'active' : ''}`}>
                  <Link href="/admin/verifikasi" onClick={onClose}>
                    <i className="bx bx-user-check"></i>
                    <span>
                      Kelola Pengguna
                      {pendingVerifications > 0 && (
                        <span style={{
                          background: '#f59e0b',
                          color: '#000',
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: '99px',
                          fontSize: '10px',
                          marginLeft: '6px'
                        }}>
                          {pendingVerifications}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              </ul>

              <ul className="nav-list">
                <li className={`nav-item ${isActive('/admin/master') ? 'active' : ''}`}>
                  <Link href="/admin/master?section=config" onClick={onClose}>
                    <i className="bx bx-slider-alt"></i>
                    <span>Konfigurasi Denda</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="sidebar-logout-button"
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
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                  <Link href="/" onClick={onClose}>
                    <i className="bx bx-grid-alt"></i>
                    <span>Beranda</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/member/dashboard') ? 'active' : ''}`}>
                  <Link href="/member/dashboard" onClick={onClose}>
                    <i className="bx bx-id-card"></i>
                    <span>Kartu Anggota</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/katalog') ? 'active' : ''}`}>
                  <Link href="/katalog" onClick={onClose}>
                    <i className="bx bx-library"></i>
                    <span>Katalog Buku</span>
                  </Link>
                </li>
              </ul>

              <ul className="nav-list">
                <li className={`nav-item ${isActive('/katalog') ? 'active' : ''}`}>
                  <Link href="/katalog" onClick={onClose}>
                    <i className="bx bx-cart-add"></i>
                    <span>Pinjam Buku Baru</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/member/dashboard') ? 'active' : ''}`}>
                  <Link href="/member/dashboard" onClick={onClose}>
                    <i className="bx bx-refresh"></i>
                    <span>Peminjaman Aktif & Kembali</span>
                  </Link>
                </li>
              </ul>

              <ul className="nav-list">
                <li className="nav-item">
                  <button className="sidebar-logout-button"
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
              <ul className="nav-list">
                <li className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                  <Link href="/" onClick={onClose}>
                    <i className="bx bx-home-alt"></i>
                    <span>Beranda Utama</span>
                  </Link>
                </li>
              </ul>

              <ul className="nav-list">
                <li className={`nav-item ${isActive('/login') ? 'active' : ''}`}>
                  <Link href="/login" onClick={onClose}>
                    <i className="bx bx-log-in-circle"></i>
                    <span>Masuk (Login)</span>
                  </Link>
                </li>
                <li className={`nav-item ${isActive('/register') ? 'active' : ''}`}>
                  <Link href="/register" onClick={onClose}>
                    <i className="bx bx-user-plus"></i>
                    <span>Daftar Anggota</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </div>

        {/* Sidebar User Footer */}
        <div className="sidebar-user">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAnggota?.foto || '/profile-default.svg'}
            alt="Avatar"
            className="user-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/profile-default.svg';
            }}
          />
          <div className="user-meta">
            <div className="name">
              {currentAnggota?.nama || (currentUser ? currentUser.username : 'Tamu / Pengunjung')}
            </div>
            {currentUser ? (
              isAdmin ? (
                <span className="role-badge badge-adm">Administrator</span>
              ) : (
                <span className="role-badge badge-ang">Anggota</span>
              )
            ) : (
              <span className="role-badge badge-guest">Tamu</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
