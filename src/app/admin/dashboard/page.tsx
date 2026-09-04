'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';

export default function AdminDashboardPage() {
  const { currentUser, currentAnggota, isAdmin } = useAuth();
  const { buku, anggota, peminjaman, config } = useData();

  const totalBuku = buku.length;
  const totalStok = buku.reduce((acc, b) => acc + (b.qty_stok || 0), 0);
  const activeLoans = peminjaman.filter((p) => p.status === 'DIPINJAM').length;
  const pendingLoans = peminjaman.filter((p) => p.status === 'MENUNGGU_ACC').length;
  const pendingReturns = peminjaman.filter((p) => p.status === 'MENUNGGU_KEMBALI').length;
  const pendingUsers = anggota.filter((a) => a.status_verifikasi === 'PENDING').length;

  return (
    <>
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
    </>
  );
}
