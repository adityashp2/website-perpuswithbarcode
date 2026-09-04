'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';

export default function AdminDashboardPage() {
  const { currentUser, currentAnggota } = useAuth();
  const { buku, anggota, peminjaman, config } = useData();

  const totalBuku = buku.length;
  const totalStok = buku.reduce((acc, b) => acc + (b.qty_stok || 0), 0);
  const activeLoans = peminjaman.filter((p) => p.status === 'DIPINJAM').length;
  const pendingLoans = peminjaman.filter((p) => p.status === 'MENUNGGU_ACC').length;
  const pendingReturns = peminjaman.filter((p) => p.status === 'MENUNGGU_KEMBALI').length;
  const pendingUsers = anggota.filter((a) => a.status_verifikasi === 'PENDING').length;
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      value: peminjaman.filter((p) => p.tgl_pinjam?.slice(0, 10) === key).length,
    };
  });
  const chartMax = Math.max(...chartDays.map((day) => day.value), 1);
  const chartPoints = chartDays
    .map((day, index) => `${index * 100 / 6},${100 - (day.value / chartMax) * 82 - 9}`)
    .join(' ');

  return (
    <div className="admin-dashboard-page">
      {pendingUsers > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="bx bxs-id-card" style={{ fontSize: '24px', color: '#f59e0b' }}></i>
            <div>
              <strong>Terdapat {pendingUsers} Pendaftaran Anggota Baru</strong> menunggu verifikasi KTM dan persetujuan (ACC).
            </div>
          </div>
          <Link href="/admin/verifikasi" className="btn btn-warning btn-sm" style={{ fontWeight: 700 }}>
            <i className="bx bx-check-shield"></i> Periksa &amp; ACC Sekarang
          </Link>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-info">
          <h1>Selamat Datang, {currentAnggota?.nama || currentUser?.username || 'Administrator'}</h1>
          <p>Berikut adalah ringkasan data dan aktivitas sistem perpustakaan hari ini.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <Link href="/admin/verifikasi" className="btn btn-secondary">
            <i className="bx bx-user-check"></i> Kelola Pengguna
          </Link>
          <Link href="/admin/buku" className="btn btn-primary">
            <i className="bx bx-plus-circle"></i> Tambah Buku
          </Link>
          <Link href="/admin/sirkulasi" className="btn btn-secondary">
            <i className="bx bx-check-shield"></i> Panel Sirkulasi
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-indigo">
          <div className="stat-data">
            <h3>Total Judul Buku</h3>
            <div className="number">{totalBuku}</div>
          </div>
          <div className="stat-icon"><i className="bx bx-book"></i></div>
        </div>

        <div className="stat-card stat-emerald">
          <div className="stat-data">
            <h3>Total Stok Tersedia</h3>
            <div className="number">{totalStok}</div>
          </div>
          <div className="stat-icon"><i className="bx bx-check-shield"></i></div>
        </div>

        <div className="stat-card stat-sky">
          <div className="stat-data">
            <h3>Peminjaman Aktif</h3>
            <div className="number">{activeLoans}</div>
          </div>
          <div className="stat-icon"><i className="bx bx-time-five"></i></div>
        </div>

        <div className="stat-card stat-amber">
          <div className="stat-data">
            <h3>Tarif Denda per Hari</h3>
            <div className="number" style={{ fontSize: '20px' }}>
              Rp {config.dendaPerHari?.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="stat-icon"><i className="bx bx-coin-stack"></i></div>
        </div>
      </div>

      <div className="admin-analytics-grid">
        <div className="card realtime-chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <i className="bx bx-line-chart"></i>
                <span>Aktivitas Peminjaman</span>
              </div>
              <p className="chart-subtitle">Memantau permohonan pinjam 7 hari terakhir</p>
            </div>
            <span className="live-indicator"><span></span> LIVE</span>
          </div>
          <div className="realtime-chart">
            <svg viewBox="0 0 100 100" role="img" aria-label="Grafik aktivitas peminjaman tujuh hari terakhir" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="chart-area" d={`M 0 100 L ${chartPoints} L 100 100 Z`} />
              <polyline className="chart-line" points={chartPoints} />
              {chartDays.map((day, index) => (
                <circle
                  key={`${day.label}-${index}`}
                  className="chart-dot"
                  cx={index * 100 / 6}
                  cy={100 - (day.value / chartMax) * 82 - 9}
                  r="1.6"
                />
              ))}
            </svg>
            <div className="chart-labels">
              {chartDays.map((day, index) => <span key={`${day.label}-label-${index}`}>{day.label}</span>)}
            </div>
          </div>
        </div>

        <div className="card activity-summary-card">
          <div className="card-header">
            <div className="card-title">
              <i className="bx bx-pulse"></i>
              <span>Status Real-time</span>
            </div>
            <i className="bx bx-refresh chart-refresh-icon"></i>
          </div>
          <div className="activity-summary-list">
            <div><span className="summary-dot dot-indigo"></span><span>Menunggu ACC</span><strong>{pendingLoans}</strong></div>
            <div><span className="summary-dot dot-sky"></span><span>Sedang Dipinjam</span><strong>{activeLoans}</strong></div>
            <div><span className="summary-dot dot-amber"></span><span>Menunggu Kembali</span><strong>{pendingReturns}</strong></div>
            <div><span className="summary-dot dot-emerald"></span><span>Selesai Dikembalikan</span><strong>{peminjaman.filter((p) => p.status === 'DIKEMBALIKAN').length}</strong></div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '28px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bx bx-check-shield"></i>
              <span>Antrean Sirkulasi Buku</span>
            </div>
            <span className="badge badge-warning">{pendingLoans + pendingReturns} Antrean</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Terdapat {pendingLoans} permohonan pinjam baru dan {pendingReturns} permohonan pengembalian buku yang memerlukan validasi petugas.
            </p>
            <Link href="/admin/sirkulasi" className="btn btn-primary btn-sm">
              Buka Panel ACC Sirkulasi &rarr;
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bx bx-barcode"></i>
              <span>Katalog &amp; Cetak Barcode</span>
            </div>
            <span className="badge badge-primary">{totalBuku} Judul</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Kelola judul buku, update kuota stok eksemplar, dan cetak stiker barcode standar siap tempel pada cover buku.
            </p>
            <Link href="/admin/buku" className="btn btn-primary btn-sm">
              Kelola Koleksi Buku &rarr;
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bx bx-user-check"></i>
              <span>Verifikasi Berkas KTM</span>
            </div>
            <span className="badge badge-warning">{pendingUsers} Pending</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Periksa foto Kartu Tanda Mahasiswa yang diunggah anggota baru dan berikan persetujuan atau penolakan.
            </p>
            <Link href="/admin/verifikasi" className="btn btn-primary btn-sm">
              Periksa Berkas KTM &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
