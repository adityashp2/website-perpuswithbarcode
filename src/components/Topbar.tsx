'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const { currentUser, currentAnggota, logout } = useAuth();
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
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      setClockDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
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

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-toggle-btn"
          id="mobileToggle"
          title="Buka Menu"
          onClick={onToggleSidebar}
        >
          <i className="bx bx-menu"></i>
        </button>

        <form onSubmit={handleSearchSubmit} className="topbar-search">
          <i className="bx bx-search search-icon"></i>
          <input
            type="text"
            placeholder="Cari judul buku atau pengarang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <div className="topbar-right">
        {/* Live Real-Time Clock */}
        <div
          className="date-pill"
          id="liveClock"
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 0,
            padding: '6px 14px',
            lineHeight: 1.3,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="bx bx-calendar-event" style={{ fontSize: '14px' }}></i>
            <span id="clockDate" style={{ fontSize: '12px', fontWeight: 600 }}>
              {clockDate || 'Memuat Tanggal...'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
            <i className="bx bx-time" style={{ fontSize: '13px' }}></i>
            <span
              id="clockTime"
              style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--primary)',
                letterSpacing: '0.5px',
              }}
            >
              {clockTime || '--:--:-- WIB'}
            </span>
          </div>
        </div>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/member/dashboard"
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 'var(--radius-full)', gap: '6px' }}
            >
              <i className="bx bx-user"></i>
              <span>{displayName}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin keluar (logout)?')) {
                  logout();
                }
              }}
              className="btn btn-danger btn-sm"
              title="Keluar"
              style={{ borderRadius: 'var(--radius-full)', padding: '6px 10px' }}
            >
              <i className="bx bx-log-out"></i>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/login" className="btn btn-primary btn-sm">
              <i className="bx bx-log-in"></i> Masuk
            </Link>
            <Link href="/register" className="btn btn-secondary btn-sm">
              Daftar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
