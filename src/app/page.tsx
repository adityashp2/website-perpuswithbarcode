'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';
import { Buku } from '@/types/database';

export default function HomePage() {
  const { buku, anggota, peminjaman, config } = useData();
  const { currentUser, currentAnggota, isAdmin, isMember, switchRoleQuick } = useAuth();
  const [selectedBarcodeBuku, setSelectedBarcodeBuku] = useState<Buku | null>(null);

  const totalBuku = buku.length;
  const totalStok = buku.reduce((acc, b) => acc + (b.qty_stok || 0), 0);
  const activeLoans = peminjaman.filter((p) => p.status === 'DIPINJAM').length;
  const pendingUsers = anggota.filter((a) => a.status_verifikasi === 'PENDING').length;

  return (
    <>
      {/* Role Notice & Demo Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <i className="bx bx-shield-quarter" style={{ fontSize: '20px', color: 'var(--primary)' }}></i>
          <span>Mode Pengujian:</span>
          <strong>{isAdmin ? 'Administrator' : isMember ? 'Anggota Mahasiswa' : 'Tamu / Belum Login'}</strong>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => switchRoleQuick('ADM')}
            className={`btn btn-sm ${isAdmin ? 'btn-primary' : 'btn-secondary'}`}
          >
            <i className="bx bx-shield-quarter"></i> Masuk Mode Admin
          </button>
          <button
            type="button"
            onClick={() => switchRoleQuick('MBR')}
            className={`btn btn-sm ${isMember ? 'btn-primary' : 'btn-secondary'}`}
          >
            <i className="bx bx-user"></i> Masuk Mode Mahasiswa
          </button>
        </div>
      </div>

      {isAdmin ? (
        /* ================= ADMIN VIEW ================= */
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
              <h1>Selamat Datang, {currentAnggota?.nama || currentUser?.username}</h1>
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
        </>
      ) : isMember ? (
        /* ================= MEMBER VIEW ================= */
        <>
          {currentAnggota?.status_verifikasi === 'PENDING' && (
            <div className="alert alert-warning">
              <i className="bx bx-time-five" style={{ fontSize: '20px' }}></i>
              <div><strong>KTM Anda sedang menunggu verifikasi petugas.</strong> Peminjaman buku akan aktif setelah KTM disetujui.</div>
            </div>
          )}

          <div className="hero-banner">
            <div className="hero-title">Halo, {currentAnggota?.nama || currentUser?.username}</div>
            <div className="hero-desc">
              Selamat datang di portal anggota Perpustakaan Politeknik Negeri Lampung (Polinela). Temukan buku perkuliahan, referensi ilmiah, jurnal, dan literatur favorit Anda dengan mudah.
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/katalog" className="btn btn-primary" style={{ background: '#ffffff', color: 'var(--primary)' }}>
                <i className="bx bx-cart-add"></i> Pinjam Buku Sekarang
              </Link>
              <Link href="/member/dashboard" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
                <i className="bx bx-history"></i> Peminjaman Saya
              </Link>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-indigo">
              <div className="stat-data">
                <h3>Koleksi Buku</h3>
                <div className="number">{totalBuku}</div>
              </div>
              <div className="stat-icon"><i className="bx bx-book"></i></div>
            </div>

            <div className="stat-card stat-emerald">
              <div className="stat-data">
                <h3>Eksemplar Siap Pinjam</h3>
                <div className="number">{totalStok}</div>
              </div>
              <div className="stat-icon"><i className="bx bx-layer"></i></div>
            </div>

            <div className="stat-card stat-sky">
              <div className="stat-data">
                <h3>Maks Pinjam per Akun</h3>
                <div className="number">{config.maxLamaPinjam} Hari</div>
              </div>
              <div className="stat-icon"><i className="bx bx-calendar"></i></div>
            </div>
          </div>
        </>
      ) : (
        /* ================= GUEST / PUBLIC VIEW ================= */
        <>
          <div className="hero-banner">
            <div className="hero-title">Perpustakaan Digital Politeknik Negeri Lampung</div>
            <div className="hero-desc">
              Pusat sumber informasi, literasi sains, dan teknologi terapan Politeknik Negeri Lampung (Polinela). Akses koleksi buku akademik, karya ilmiah, dan literatur berkualitas kapan saja.
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/katalog" className="btn btn-primary" style={{ background: '#ffffff', color: 'var(--primary)' }}>
                <i className="bx bx-library"></i> Jelajahi Koleksi Buku
              </Link>
              <Link href="/login" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
                <i className="bx bx-log-in"></i> Masuk Anggota
              </Link>
              <Link href="/register" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
                <i className="bx bx-user-plus"></i> Daftar Anggota Baru
              </Link>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-indigo">
              <div className="stat-data">
                <h3>Koleksi Buku</h3>
                <div className="number">{totalBuku}</div>
              </div>
              <div className="stat-icon"><i className="bx bx-book"></i></div>
            </div>

            <div className="stat-card stat-emerald">
              <div className="stat-data">
                <h3>Total Eksemplar</h3>
                <div className="number">{totalStok}</div>
              </div>
              <div className="stat-icon"><i className="bx bx-check-shield"></i></div>
            </div>

            <div className="stat-card stat-sky">
              <div className="stat-data">
                <h3>Layanan Barcode</h3>
                <div className="number">Aktif</div>
              </div>
              <div className="stat-icon"><i className="bx bx-barcode"></i></div>
            </div>

            <div className="stat-card stat-amber">
              <div className="stat-data">
                <h3>Denda per Hari</h3>
                <div className="number" style={{ fontSize: '20px' }}>
                  Rp {config.dendaPerHari?.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="stat-icon"><i className="bx bx-coin-stack"></i></div>
            </div>
          </div>
        </>
      )}

      {/* Koleksi Buku Terbaru */}
      <div style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Koleksi Buku Unggulan
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Daftar buku teks dan literatur akademik terpopuler
            </p>
          </div>
          <Link href="/katalog" className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <span>Lihat Semua Koleksi</span>
            <i className="bx bx-chevron-right"></i>
          </Link>
        </div>

        <div className="book-grid">
          {buku.slice(0, 4).map((item) => (
            <div key={item.isbn} className="book-card">
              <div className="book-cover">
                {item.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.foto}
                    alt={item.judul}
                    style={{ maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <i className="bx bx-book-open"></i>
                )}
                <div className="book-badge-stock">
                  <span className={`badge ${item.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`}>
                    Stok: {item.qty_stok}
                  </span>
                </div>
              </div>

              <div className="book-body">
                <div className="book-katalog-tag">
                  {item.katalog?.nama || 'Katalog Umum'}
                </div>
                <div className="book-title" title={item.judul}>
                  {item.judul}
                </div>
                <div className="book-meta">
                  <span>Pengarang: {item.pengarang?.nama_pengarang || '-'}</span>
                  <span>Penerbit: {item.penerbit?.nama_penerbit || '-'}</span>
                  <span className="book-isbn">ISBN: {item.isbn}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--card-border)' }}>
                  <button
                    onClick={() => setSelectedBarcodeBuku(item)}
                    className="btn btn-secondary btn-sm"
                    title="Cetak Barcode Label"
                  >
                    <i className="bx bx-barcode"></i>
                  </button>
                  <Link
                    href={`/buku/${encodeURIComponent(item.isbn)}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Detail &amp; Pinjam
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBarcodeBuku && (
        <BarcodeModal
          buku={selectedBarcodeBuku}
          onClose={() => setSelectedBarcodeBuku(null)}
        />
      )}
    </>
  );
}
