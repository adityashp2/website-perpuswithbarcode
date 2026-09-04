'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';
import { Buku } from '@/types/database';

function KatalogContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const { buku, katalog, pinjamBuku } = useData();
  const { currentAnggota, isAdmin } = useAuth();
  
  const [search, setSearch] = useState(initialQuery);
  const [selectedKatalog, setSelectedKatalog] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedBarcodeBuku, setSelectedBarcodeBuku] = useState<Buku | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  const filteredBuku = useMemo(() => {
    return buku.filter((b) => {
      const matchSearch =
        search.trim() === '' ||
        b.judul.toLowerCase().includes(search.toLowerCase()) ||
        b.isbn.toLowerCase().includes(search.toLowerCase()) ||
        (b.pengarang?.nama_pengarang && b.pengarang.nama_pengarang.toLowerCase().includes(search.toLowerCase())) ||
        (b.penerbit?.nama_penerbit && b.penerbit.nama_penerbit.toLowerCase().includes(search.toLowerCase()));

      const matchKatalog =
        selectedKatalog === 'ALL' || b.id_katalog === selectedKatalog;

      return matchSearch && matchKatalog;
    });
  }, [buku, search, selectedKatalog]);

  const handlePinjam = async (item: Buku) => {
    const targetAnggotaId = currentAnggota?.id_anggota;
    
    if (!targetAnggotaId) {
      setFeedback({ msg: 'Sesi anggota belum siap. Silakan klik pinjam lagi.', isError: true });
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
    <div className="catalog-page">
      <div className="catalog-hero page-header">
        <div className="page-header-info">
          <span className="catalog-eyebrow"><i className="bx bx-library"></i> Perpustakaan digital</span>
          <h1>Temukan bacaan favoritmu</h1>
          <p>Jelajahi koleksi buku Polinela dan ajukan peminjaman dengan mudah.</p>
        </div>
        <div className="catalog-summary">
          <strong>{filteredBuku.length}</strong>
          <span>judul tersedia</span>
        </div>
      </div>

      <div className="catalog-toolbar">
        <label className="catalog-filter">
          <span>Kategori</span>
          <select
            value={selectedKatalog}
            onChange={(e) => setSelectedKatalog(e.target.value)}
            className="form-control"
          >
            <option value="ALL">Semua Kategori</option>
            {katalog.map((kat) => (
              <option key={kat.id_katalog} value={kat.id_katalog}>
                {kat.nama}
              </option>
            ))}
          </select>
        </label>

        <div className="catalog-toolbar-actions">
          <div className="catalog-view-toggle" role="group" aria-label="Mode tampilan katalog">
            <button type="button" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''} aria-label="Tampilan kartu">
              <i className="bx bx-grid-alt"></i>
            </button>
            <button type="button" onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''} aria-label="Tampilan tabel">
              <i className="bx bx-list-ul"></i>
            </button>
          </div>

          {isAdmin && (
            <Link href="/admin/buku" className="btn btn-primary btn-sm">
              <i className="bx bx-plus"></i> Tambah Buku
            </Link>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`alert ${feedback.isError ? 'alert-danger' : 'alert-success'}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            maxWidth: '440px',
            boxShadow: 'var(--shadow-lg)',
            border: '2px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <i className={`bx ${feedback.isError ? 'bx-error-circle' : 'bx-check-circle'}`} style={{ fontSize: '24px', flexShrink: 0 }}></i>
          <div style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{feedback.msg}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px', display: 'flex' }}
          >
            <i className="bx bx-x" style={{ fontSize: '20px' }}></i>
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="catalog-search card">
        <div>
          <i className="bx bx-search" aria-hidden="true"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Cari judul, ISBN, pengarang, atau penerbit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian"><i className="bx bx-x"></i></button>}
      </div>

      {viewMode === 'table' ? (
        <div className="catalog-table card">
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Cover</th>
                  <th style={{ width: '130px' }}>ISBN</th>
                  <th>Judul Buku</th>
                  <th>Pengarang</th>
                  <th>Penerbit</th>
                  <th style={{ width: '80px' }}>Tahun</th>
                  <th>Kategori</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Ketersediaan</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuku.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <i className="bx bx-book-open" style={{ fontSize: '36px', display: 'block', marginBottom: '8px', color: 'var(--text-light)' }}></i>
                      Tidak ada buku yang sesuai dengan pencarian Anda.
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
                            width: '54px',
                            height: '68px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid var(--card-border)',
                            background: '#f8fafc',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                          }}
                        />
                      </td>

                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: 'var(--primary)' }}>
                          {b.isbn}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '13.5px', display: 'block' }}>
                          {b.judul}
                        </strong>
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
                        <span className={`badge ${b.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                          {b.qty_stok > 0 ? `Tersedia (${b.qty_stok})` : 'Habis'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {isAdmin && (
                            <button
                              onClick={() => setSelectedBarcodeBuku(b)}
                              className="btn btn-secondary btn-sm"
                              title="Cetak Barcode"
                              style={{ padding: '4px 8px' }}
                            >
                              <i className="bx bx-barcode"></i>
                            </button>
                          )}
                          <button
                            onClick={() => void handlePinjam(b)}
                            disabled={b.qty_stok <= 0}
                            className={`btn btn-sm ${b.qty_stok > 0 ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '4px 10px' }}
                          >
                            <i className="bx bx-cart-add"></i> Pinjam
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="catalog-book-grid book-grid">
          {filteredBuku.length === 0 && (
            <div className="catalog-empty card">
              <i className="bx bx-search-alt-2"></i>
              <strong>Buku tidak ditemukan</strong>
              <span>Coba gunakan kata kunci atau kategori yang berbeda.</span>
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
                  {item.katalog?.nama || 'Umum'}
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
                  {isAdmin && (
                    <button
                      onClick={() => setSelectedBarcodeBuku(item)}
                      className="btn btn-secondary btn-sm"
                      title="Cetak Barcode Label"
                    >
                      <i className="bx bx-barcode"></i>
                    </button>
                  )}
                  <button
                    onClick={() => void handlePinjam(item)}
                    disabled={item.qty_stok <= 0}
                    className={`btn btn-sm ${item.qty_stok > 0 ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    <i className="bx bx-cart-add"></i> Pinjam
                  </button>
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
    </div>
  );
}

export default function KatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat katalog buku...</div>}>
      <KatalogContent />
    </Suspense>
  );
}
