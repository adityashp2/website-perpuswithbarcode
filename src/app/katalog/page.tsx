'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';
import { BarcodeScannerModal } from '@/components/BarcodeScanner';
import { Buku } from '@/types/database';

function KatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const { buku, katalog, pinjamBuku, config } = useData();
  const { currentUser, currentAnggota, isAdmin } = useAuth();
  
  const [search, setSearch] = useState(initialQuery);
  const [selectedKatalog, setSelectedKatalog] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedBarcodeBuku, setSelectedBarcodeBuku] = useState<Buku | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; isError: boolean } | null>(null);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  const filteredBuku = useMemo(() => {
    return buku.filter((b) => {
      const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const matchSearch =
        search.trim() === '' ||
        b.judul.toLowerCase().includes(search.toLowerCase()) ||
        b.isbn.toLowerCase().includes(search.toLowerCase()) ||
        (cleanSearch.length >= 4 && b.isbn.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().includes(cleanSearch)) ||
        (b.pengarang?.nama_pengarang && b.pengarang.nama_pengarang.toLowerCase().includes(search.toLowerCase())) ||
        (b.penerbit?.nama_penerbit && b.penerbit.nama_penerbit.toLowerCase().includes(search.toLowerCase()));

      const matchKatalog =
        selectedKatalog === 'ALL' || b.id_katalog === selectedKatalog;

      return matchSearch && matchKatalog;
    });
  }, [buku, search, selectedKatalog]);

  const handlePinjam = async (item: Buku) => {
    if (!currentUser) {
      router.push(`/login?redirect=/katalog`);
      return;
    }

    if (isAdmin) {
      router.push(`/admin/sirkulasi`);
      return;
    }

    const targetAnggotaId = currentAnggota?.id_anggota;
    if (!targetAnggotaId) {
      setFeedback({ msg: 'Profil anggota Anda belum siap atau sedang diverifikasi.', isError: true });
      return;
    }

    if (
      currentAnggota.status_keanggotaan === 'blocked' ||
      (currentAnggota.denda_tertunggak || 0) > (config.ambangDendaBlokir || 50000)
    ) {
      setFeedback({
        msg: `Peminjaman ditolak sistem: Akun Anda memiliki denda tertunggak sebesar Rp ${(currentAnggota.denda_tertunggak || 0).toLocaleString('id-ID')}. Silakan selesaikan denda di Meja Kasir Sirkulasi.`,
        isError: true,
      });
      return;
    }

    const res = await pinjamBuku(targetAnggotaId, item.isbn, 1);
    setFeedback({
      msg: res.success 
        ? `Sukses! Peminjaman buku "${item.judul}" berhasil diajukan & masuk ke antrean ACC Sirkulasi.` 
        : res.message,
      isError: !res.success,
    });

    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <i className="bx bx-library"></i> Perpustakaan Digital Polinela
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)', margin: '4px 0 0' }}>
            Katalog Buku &amp; Referensi
          </h1>
          <p style={{ color: 'var(--apple-text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
            Jelajahi koleksi akademik, cek stok eksemplar fisik, dan ajukan peminjaman buku.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px 14px',
              background: 'rgba(0, 0, 0, 0.04)',
              borderRadius: 'var(--apple-radius-pill)',
              fontSize: '13px',
              color: 'var(--apple-text-secondary)',
              fontWeight: 500,
            }}
          >
            <strong style={{ color: 'var(--apple-text-primary)' }}>{filteredBuku.length}</strong> judul ditemukan
          </div>
          {isAdmin && (
            <Link href="/admin/buku" className="apple-btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>
              <i className="bx bx-plus"></i> Tambah Buku
            </Link>
          )}
        </div>
      </div>

      {/* Apple Floating Toast Feedback */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 99999,
            maxWidth: '440px',
            padding: '12px 18px',
            borderRadius: 'var(--apple-radius-pill)',
            background: feedback.isError ? 'rgba(215, 0, 21, 0.95)' : 'rgba(29, 29, 31, 0.92)',
            color: '#ffffff',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'var(--apple-shadow-xl)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <i className={`bx ${feedback.isError ? 'bx-error-circle' : 'bx-check-circle'}`} style={{ fontSize: '18px', flexShrink: 0 }}></i>
          <div style={{ flex: 1 }}>{feedback.msg}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '2px', display: 'flex', opacity: 0.8 }}
            aria-label="Tutup notifikasi"
          >
            <i className="bx bx-x" style={{ fontSize: '18px' }}></i>
          </button>
        </div>
      )}

      {/* Apple Toolbar: Search & Segmented Controls */}
      <div
        className="apple-card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Spotlight Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
          <i
            className="bx bx-search"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--apple-text-tertiary)',
              fontSize: '16px',
              pointerEvents: 'none',
            }}
          ></i>
          <input
            type="text"
            className="form-control"
            placeholder="Cari judul, ISBN, pengarang, atau penerbit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: '36px',
              paddingRight: search ? '32px' : '14px',
              borderRadius: 'var(--apple-radius-pill)',
              background: 'rgba(0, 0, 0, 0.03)',
              border: '1px solid var(--apple-border-subtle)',
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
                fontSize: '14px',
              }}
              aria-label="Hapus pencarian"
            >
              <i className="bx bx-x-circle"></i>
            </button>
          )}
        </div>

        {/* Toolbar Right: Filter, Camera Scanner, View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Camera Scan Button */}
          <button
            type="button"
            className="apple-btn-secondary"
            onClick={() => setCameraScannerOpen(true)}
            style={{ padding: '6px 12px', fontSize: '13px', minHeight: '34px' }}
            title="Pindai barcode buku fisik dengan kamera"
          >
            <i className="bx bx-camera" style={{ fontSize: '16px' }}></i> Scan Barcode
          </button>

          {/* Category Dropdown */}
          <select
            value={selectedKatalog}
            onChange={(e) => setSelectedKatalog(e.target.value)}
            className="form-control"
            style={{
              width: 'auto',
              minWidth: '160px',
              padding: '6px 14px',
              borderRadius: 'var(--apple-radius-pill)',
              fontSize: '13px',
              background: 'rgba(0, 0, 0, 0.03)',
              cursor: 'pointer',
            }}
            aria-label="Filter kategori buku"
          >
            <option value="ALL">Semua Kategori</option>
            {katalog.map((kat) => (
              <option key={kat.id_katalog} value={kat.id_katalog}>
                {kat.nama}
              </option>
            ))}
          </select>

          {/* Apple Segmented Control for View Mode */}
          <div className="apple-segmented-control" role="group" aria-label="Mode tampilan katalog">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`apple-segment-btn ${viewMode === 'grid' ? 'active' : ''}`}
              aria-label="Tampilan kartu"
            >
              <i className="bx bx-grid-alt" style={{ fontSize: '15px' }}></i> Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`apple-segment-btn ${viewMode === 'table' ? 'active' : ''}`}
              aria-label="Tampilan tabel"
            >
              <i className="bx bx-list-ul" style={{ fontSize: '15px' }}></i> Tabel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Cover</th>
                <th style={{ width: '130px' }}>ISBN</th>
                <th>Judul Buku</th>
                <th>Pengarang</th>
                <th>Penerbit</th>
                <th style={{ width: '80px' }}>Tahun</th>
                <th>Kategori</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Ketersediaan</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuku.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--apple-text-secondary)' }}>
                    <i className="bx bx-book-open" style={{ fontSize: '36px', display: 'block', marginBottom: '8px', color: 'var(--apple-text-tertiary)' }}></i>
                    Tidak ada buku yang sesuai dengan filter atau pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredBuku.map((b) => (
                  <tr key={b.isbn}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.foto || '/default-book-cover.svg'}
                        alt={b.judul}
                        style={{
                          width: '46px',
                          height: '58px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid var(--apple-border)',
                          background: '#f8fafc',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                        }}
                      />
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px', color: 'var(--apple-accent)' }}>
                        {b.isbn}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/buku/${encodeURIComponent(b.isbn)}`}
                        style={{ fontWeight: 600, color: 'var(--apple-text-primary)', textDecoration: 'none', display: 'block' }}
                      >
                        {b.judul}
                      </Link>
                    </td>
                    <td>{b.pengarang?.nama_pengarang || '-'}</td>
                    <td>{b.penerbit?.nama_penerbit || '-'}</td>
                    <td>{b.tahun}</td>
                    <td>
                      <span className="badge badge-info">
                        {b.katalog?.nama || b.id_katalog}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${b.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`}>
                        <i className={b.qty_stok > 0 ? 'bx bx-check' : 'bx bx-x'}></i> {b.qty_stok > 0 ? `Tersedia (${b.qty_stok})` : 'Habis'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {isAdmin && (
                          <button
                            onClick={() => setSelectedBarcodeBuku(b)}
                            className="apple-btn-secondary"
                            title="Cetak Barcode Label"
                            style={{ padding: '4px 8px', minHeight: '30px' }}
                          >
                            <i className="bx bx-barcode"></i>
                          </button>
                        )}
                        {!currentUser ? (
                          <Link
                            href={`/login?redirect=/katalog`}
                            className="apple-btn-secondary"
                            style={{ padding: '4px 10px', minHeight: '30px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="bx bx-log-in-circle"></i> Masuk
                          </Link>
                        ) : isAdmin ? (
                          <Link
                            href={`/admin/sirkulasi`}
                            className="apple-btn-primary"
                            style={{ padding: '4px 10px', minHeight: '30px', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="bx bx-store-alt"></i> Kasir
                          </Link>
                        ) : (
                          <button
                            onClick={() => void handlePinjam(b)}
                            disabled={b.qty_stok <= 0}
                            className="apple-btn-primary"
                            style={{ padding: '4px 12px', minHeight: '30px', fontSize: '12px' }}
                          >
                            <i className="bx bx-cart-add"></i> Pinjam
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px' }}>
          {filteredBuku.length === 0 && (
            <div
              className="apple-card"
              style={{
                gridColumn: '1 / -1',
                padding: '48px',
                textAlign: 'center',
                color: 'var(--apple-text-secondary)',
              }}
            >
              <i className="bx bx-search-alt-2" style={{ fontSize: '40px', color: 'var(--apple-text-tertiary)', marginBottom: '8px', display: 'block' }}></i>
              <strong style={{ fontSize: '16px', color: 'var(--apple-text-primary)', display: 'block' }}>Buku tidak ditemukan</strong>
              <span style={{ fontSize: '13px' }}>Coba gunakan kata kunci lain atau pilih Semua Kategori.</span>
            </div>
          )}
          {filteredBuku.map((item) => (
            <div key={item.isbn} className="book-card">
              <div className="book-cover">
                {item.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.foto}
                    alt={item.judul}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                    }}
                  />
                ) : (
                  <i className="bx bx-book-open" style={{ fontSize: '38px', color: 'var(--apple-text-tertiary)' }}></i>
                )}
                <div className="book-badge-stock">
                  <span className={`badge ${item.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`}>
                    <i className={item.qty_stok > 0 ? 'bx bx-check' : 'bx bx-x'}></i> {item.qty_stok > 0 ? `Stok: ${item.qty_stok}` : 'Habis'}
                  </span>
                </div>
              </div>

              <div className="book-body">
                <div className="book-katalog-tag">
                  {item.katalog?.nama || 'Umum'}
                </div>
                <Link
                  href={`/buku/${encodeURIComponent(item.isbn)}`}
                  className="book-title"
                  title={item.judul}
                  style={{ textDecoration: 'none' }}
                >
                  {item.judul}
                </Link>
                <div className="book-meta">
                  <div>Pengarang: {item.pengarang?.nama_pengarang || '-'}</div>
                  <div>Penerbit: {item.penerbit?.nama_penerbit || '-'} ({item.tahun})</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--apple-text-tertiary)' }}>
                    ISBN: {item.isbn}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--apple-border-subtle)', alignItems: 'center' }}>
                  {isAdmin && (
                    <button
                      onClick={() => setSelectedBarcodeBuku(item)}
                      className="apple-btn-secondary"
                      title="Cetak Barcode Label"
                      style={{ padding: '6px 10px', minHeight: '34px' }}
                    >
                      <i className="bx bx-barcode"></i>
                    </button>
                  )}
                  {!currentUser ? (
                    <Link
                      href={`/login?redirect=/katalog`}
                      className="apple-btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', minHeight: '34px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className="bx bx-log-in-circle"></i> Masuk untuk Pinjam
                    </Link>
                  ) : isAdmin ? (
                    <Link
                      href={`/admin/sirkulasi`}
                      className="apple-btn-primary"
                      style={{ flex: 1, justifyContent: 'center', minHeight: '34px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className="bx bx-store-alt"></i> Buka di Kasir
                    </Link>
                  ) : (
                    <button
                      onClick={() => void handlePinjam(item)}
                      disabled={item.qty_stok <= 0}
                      className="apple-btn-primary"
                      style={{ flex: 1, justifyContent: 'center', minHeight: '34px', fontSize: '13px' }}
                    >
                      <i className="bx bx-cart-add"></i> Pinjam
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBarcodeBuku && (
        <BarcodeModal
          buku={selectedBarcodeBuku}
          onClose={() => setSelectedBarcodeBuku(null)}
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onScan={(scanned) => {
          setSearch(scanned);
          setCameraScannerOpen(false);
        }}
        title="Scan Barcode untuk Cari Buku"
      />
    </div>
  );
}

export default function KatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--apple-text-secondary)' }}>Memuat katalog buku...</div>}>
      <KatalogContent />
    </Suspense>
  );
}

