'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import BarcodeModal from '@/components/BarcodeModal';
import { BarcodeScannerModal } from '@/components/BarcodeScanner';
import { Buku } from '@/types/database';
import { compressImageUnder200KB } from '@/lib/imageCompressor';

export default function AdminBukuPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuth();

  // Role & Permission Guard
  useEffect(() => {
    if (currentUser && currentUser.type !== 'ADM') {
      router.replace('/login');
    }
  }, [currentUser, router]);

  const { buku, katalog, penerbit, pengarang, addBuku, deleteBuku, updateStok } = useData();

  const [search, setSearch] = useState('');
  const [selectedBarcodeBuku, setSelectedBarcodeBuku] = useState<Buku | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'add' | null>(null);
  const [isFetchingIsbn, setIsFetchingIsbn] = useState(false);
  
  // Stock edit state
  const [editingStokBuku, setEditingStokBuku] = useState<{ isbn: string; current: number } | null>(null);
  const [newStokVal, setNewStokVal] = useState<number>(0);

  // Add Book Modal State & Image compression
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCompressingCover, setIsCompressingCover] = useState(false);
  const [coverCompressInfo, setCoverCompressInfo] = useState<{ origKb: number; compKb: number } | null>(null);

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingCover(true);
    try {
      const res = await compressImageUnder200KB(file, { maxKb: 190 });
      setFormData((prev) => ({ ...prev, foto: res.dataUrl }));
      setCoverCompressInfo({ origKb: res.originalSizeKb, compKb: res.compressedSizeKb });
    } catch {
      alert('Gagal memproses dan mengompres foto cover buku.');
    } finally {
      setIsCompressingCover(false);
    }
  };

  const currentYearShort = new Date().getFullYear().toString().slice(-2);
  const initialCopyCode = `PS-${currentYearShort}${Math.floor(10000 + Math.random() * 90000)}`;

  const [formData, setFormData] = useState({
    isbn: '',
    barcode_eksemplar: initialCopyCode,
    judul: '',
    tahun: new Date().getFullYear(),
    ddc: '000',
    lokasi_rak: 'R-A1',
    id_katalog: katalog[0]?.id_katalog || 'KG0',
    id_penerbit: penerbit[0]?.id_penerbit || 'PN01',
    id_pengarang: pengarang[0]?.id_pengarang || 'PG01',
    qty_stok: 5,
    maks_pinjam_per_anggota: 2,
    foto: '',
    sinopsis: '',
  });

  const [selectedKatalogFilter, setSelectedKatalogFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const filteredBuku = buku.filter((b) => {
    const matchSearch =
      b.judul.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase()) ||
      (b.barcode_eksemplar && b.barcode_eksemplar.toLowerCase().includes(search.toLowerCase())) ||
      (b.pengarang?.nama_pengarang && b.pengarang.nama_pengarang.toLowerCase().includes(search.toLowerCase()));
    const matchKatalog = selectedKatalogFilter === 'ALL' || b.id_katalog === selectedKatalogFilter;
    return matchSearch && matchKatalog;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBuku.length / pageSize));
  const paginatedBuku = filteredBuku.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Auto-fetch ISBN metadata from Open Library (PRD §F2)
  const handleFetchIsbn = async () => {
    const rawIsbn = formData.isbn.trim().replace(/[^0-9X]/gi, '');
    if (!rawIsbn) {
      setFeedback('Masukkan nomor ISBN terlebih dahulu untuk menarik metadata.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsFetchingIsbn(true);
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${rawIsbn}&format=json&jscmd=data`);
      const data = await res.json();
      const bookData = data[`ISBN:${rawIsbn}`];

      if (bookData) {
        const title = bookData.title || formData.judul;
        let year = formData.tahun;
        if (bookData.publish_date) {
          const match = bookData.publish_date.match(/\d{4}/);
          if (match) year = parseInt(match[0], 10);
        }
        const coverImg = bookData.cover?.large || bookData.cover?.medium || formData.foto;

        setFormData((prev) => ({
          ...prev,
          judul: title,
          tahun: year,
          foto: coverImg,
        }));
        setFeedback(`Data buku "${title}" berhasil ditarik otomatis dari Open Library!`);
      } else {
        setFeedback('Data ISBN tidak ditemukan di Open Library. Silakan isi data secara manual.');
      }
    } catch {
      setFeedback('Gagal menghubungi layanan Open Library. Silakan lanjutkan pengisian manual.');
    } finally {
      setIsFetchingIsbn(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.isbn.trim() || !formData.judul.trim()) return;

    const matchedKatalog = katalog.find((k) => k.id_katalog === formData.id_katalog);
    const matchedPenerbit = penerbit.find((p) => p.id_penerbit === formData.id_penerbit);
    const matchedPengarang = pengarang.find((p) => p.id_pengarang === formData.id_pengarang);

    const newBook: Buku = {
      ...formData,
      katalog: matchedKatalog,
      penerbit: matchedPenerbit,
      pengarang: matchedPengarang,
      foto: formData.foto || '/default-book-cover.svg',
    };

    await addBuku(newBook);
    setShowAddModal(false);
    setFeedback(`Buku "${newBook.judul}" dengan barcode ${newBook.barcode_eksemplar} berhasil disimpan!`);
    setTimeout(() => setFeedback(null), 4000);

    const nextRandom = Math.floor(10000 + Math.random() * 90000);
    setFormData({
      isbn: '',
      barcode_eksemplar: `PS-${currentYearShort}${nextRandom}`,
      judul: '',
      tahun: new Date().getFullYear(),
      ddc: '000',
      lokasi_rak: 'R-A1',
      id_katalog: katalog[0]?.id_katalog || 'KG0',
      id_penerbit: penerbit[0]?.id_penerbit || 'PN01',
      id_pengarang: pengarang[0]?.id_pengarang || 'PG01',
      qty_stok: 5,
      maks_pinjam_per_anggota: 2,
      foto: '',
      sinopsis: '',
    });
  };

  const handleUpdateStokSubmit = async () => {
    if (editingStokBuku) {
      await updateStok(editingStokBuku.isbn, newStokVal);
      setFeedback(`Stok buku ${editingStokBuku.isbn} berhasil diubah menjadi ${newStokVal} eksemplar.`);
      setTimeout(() => setFeedback(null), 4000);
      setEditingStokBuku(null);
    }
  };

  return (
    <div className="inventory-page" style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px 24px 60px' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-info">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--apple-radius-pill)', background: 'rgba(0, 113, 227, 0.08)', color: 'var(--apple-accent)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--apple-accent)', display: 'inline-block' }} />
            Katalogisasi &amp; Eksemplar PRD §F2 &amp; §F3
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)', margin: 0 }}>
            Manajemen Koleksi &amp; Barcode Buku
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--apple-text-secondary)', marginTop: '4px' }}>
            Total {buku.length} judul koleksi dan ratusan eksemplar ber-barcode siap sirkulasi.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              if (buku.length > 0) setSelectedBarcodeBuku(buku[0]);
            }}
            className="apple-btn-secondary"
            style={{ gap: '6px' }}
          >
            <i className="bx bx-barcode" /> Cetak Label Stiker (A4 3×8)
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="apple-btn-primary"
            style={{ gap: '6px' }}
          >
            <i className="bx bx-plus-circle" /> Tambah Koleksi Baru
          </button>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '24px', animation: 'slideDown 0.3s ease' }}>
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }} />
          <div>{feedback}</div>
        </div>
      )}

      {/* Search Input Bar - Apple Spotlight */}
      <div className="apple-card" style={{ marginBottom: '24px', padding: '10px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <i className="bx bx-search" style={{ fontSize: '20px', color: 'var(--apple-text-tertiary)' }} />
        <input
          type="text"
          placeholder="Cari judul buku, nomor ISBN, barcode eksemplar (PS-...), atau pengarang..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '14px',
            color: 'var(--apple-text-primary)',
            flex: 1,
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: 'var(--apple-text-tertiary)', cursor: 'pointer', fontSize: '18px', padding: '4px' }}
            title="Hapus pencarian"
          >
            <i className="bx bx-x" />
          </button>
        )}
        <button
          type="button"
          className="apple-btn-secondary"
          onClick={() => setScannerTarget('search')}
          style={{ gap: '6px', whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
          title="Scan barcode buku untuk mencari"
        >
          <i className="bx bx-camera" /> Scan Barcode
        </button>
      </div>

      {/* Scalable Category & Page Size Filter Toolbar (PRD §8 Scalability) */}
      <div
        className="apple-card"
        style={{
          marginBottom: '20px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bx bx-category" style={{ fontSize: '16px', color: 'var(--apple-accent)' }} />
              Pilih Kategori Katalog:
            </label>
            <select
              className="apple-select"
              value={selectedKatalogFilter}
              onChange={(e) => {
                setSelectedKatalogFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                minWidth: '240px',
                height: '36px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '10px',
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Semua Kategori Koleksi ({buku.length} Judul)</option>
              {katalog.map((k) => {
                const count = buku.filter((b) => b.id_katalog === k.id_katalog).length;
                return (
                  <option key={k.id_katalog} value={k.id_katalog}>
                    {k.nama} ({count} Judul)
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-text-secondary)' }}>
              Tampilkan:
            </label>
            <select
              className="apple-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                height: '36px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '10px',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              <option value={15}>15 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)' }}>
          Menampilkan <strong>{paginatedBuku.length}</strong> dari <strong>{filteredBuku.length}</strong> buku yang ditemukan
        </div>
      </div>

      {/* Book Table List */}
      <div className="apple-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Cover</th>
                <th style={{ width: '160px' }}>Barcode &amp; ISBN</th>
                <th>Judul Buku</th>
                <th>Pengarang &amp; DDC</th>
                <th>Penerbit</th>
                <th style={{ width: '80px' }}>Tahun</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Stok</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuku.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--apple-text-secondary)' }}>
                    <i className="bx bx-book-open" style={{ fontSize: '36px', opacity: 0.5, marginBottom: '8px', display: 'block' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Belum ada data buku yang sesuai.</div>
                  </td>
                </tr>
              ) : (
                paginatedBuku.map((b) => (
                  <tr key={b.isbn}>
                    <td>
                      <img
                        src={b.foto || '/default-book-cover.svg'}
                        alt={b.judul}
                        style={{
                          width: '50px',
                          height: '68px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid var(--apple-border)',
                          background: '#ffffff',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                        }}
                      />
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: 'var(--apple-accent)' }}>
                          {b.barcode_eksemplar || `PS-${b.isbn.slice(-6)}`}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--apple-text-secondary)' }}>
                          ISBN: {b.isbn}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ color: 'var(--apple-text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                        {b.judul}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', display: 'flex', gap: '8px' }}>
                        <span>Rak: <strong>{b.lokasi_rak || b.id_katalog || 'Umum'}</strong></span>
                        {b.is_reference && (
                          <span style={{ color: 'var(--apple-warning-text)', fontWeight: 600 }}>&bull; Referensi (Baca di Tempat)</span>
                        )}
                      </div>
                    </td>

                    <td style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>
                      <div>{b.pengarang?.nama_pengarang || '-'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>DDC: {b.ddc || '000'}</div>
                    </td>

                    <td style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>
                      {b.penerbit?.nama_penerbit || '-'}
                    </td>

                    <td style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>
                      {b.tahun}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 'var(--apple-radius-pill)',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: (b.qty_stok || 0) > 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                        color: (b.qty_stok || 0) > 0 ? 'var(--apple-success-text)' : 'var(--apple-danger-text)',
                      }}>
                        {b.qty_stok || 0}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedBarcodeBuku(b)}
                          className="apple-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          title="Cetak Label Barcode"
                        >
                          <i className="bx bx-barcode" /> Label
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStokBuku({ isbn: b.isbn, current: b.qty_stok || 0 });
                            setNewStokVal(b.qty_stok || 0);
                          }}
                          className="apple-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          title="Ubah Stok"
                        >
                          <i className="bx bx-edit" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Hapus buku "${b.judul}"?`)) {
                              await deleteBuku(b.isbn);
                              setFeedback(`Buku "${b.judul}" berhasil dihapus.`);
                              setTimeout(() => setFeedback(null), 3000);
                            }
                          }}
                          className="apple-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--apple-danger-text)' }}
                          title="Hapus Buku"
                        >
                          <i className="bx bx-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredBuku.length > pageSize && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--apple-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>
              Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredBuku.length)} - {Math.min(currentPage * pageSize, filteredBuku.length)} dari {filteredBuku.length} buku
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="apple-btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12.5px', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                ← Sebelumnya
              </button>
              <span style={{ fontSize: '13px', fontWeight: 600, padding: '0 8px', color: 'var(--apple-text-primary)' }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="apple-btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12.5px', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edit Stok */}
      {editingStokBuku && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div className="apple-card" style={{ maxWidth: '400px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px', color: 'var(--apple-text-primary)' }}>
              Ubah Stok Eksemplar
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
              ISBN: <code>{editingStokBuku.isbn}</code>
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                Jumlah Eksemplar Fisik Tersedia
              </label>
              <input
                type="number"
                min="0"
                className="apple-search-input"
                style={{ width: '100%' }}
                value={newStokVal}
                onChange={(e) => setNewStokVal(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setEditingStokBuku(null)} className="apple-btn-secondary">
                Batal
              </button>
              <button type="button" onClick={handleUpdateStokSubmit} className="apple-btn-primary">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Buku Baru dengan Auto-Fetch ISBN Open Library (PRD §F2) */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(10px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflowY: 'auto',
        }}>
          <div className="apple-card" style={{ maxWidth: '640px', width: '100%', padding: '28px', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Katalogisasi Buku Baru
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>
                  Scan ISBN untuk auto-fetch judul, pengarang, dan cover secara instan (PRD §F2).
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="apple-btn-secondary"
                style={{ width: '30px', height: '30px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bx bx-x" style={{ fontSize: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveBook}>
              {/* ISBN Bar with Auto-Fetch */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Nomor ISBN-13 / ISBN-10 <span style={{ color: 'var(--apple-danger-fill)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    className="apple-search-input"
                    placeholder="Contoh: 978-623-01-0812-7"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={handleFetchIsbn}
                    disabled={isFetchingIsbn}
                    className="apple-btn-secondary"
                    style={{ gap: '6px', whiteSpace: 'nowrap' }}
                    title="Tarik metadata otomatis dari Open Library API"
                  >
                    <i className={`bx ${isFetchingIsbn ? 'bx-loader-alt bx-spin' : 'bx-cloud-download'}`} />
                    {isFetchingIsbn ? 'Menarik...' : 'Tarik Data ISBN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerTarget('add')}
                    className="apple-btn-secondary"
                    style={{ gap: '4px' }}
                    title="Scan langsung dengan kamera"
                  >
                    <i className="bx bx-camera" />
                  </button>
                </div>
              </div>

              {/* Barcode Eksemplar Generated */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Barcode Eksemplar (Code 128) <span style={{ color: 'var(--apple-danger-fill)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="apple-search-input"
                    value={formData.barcode_eksemplar}
                    onChange={(e) => setFormData({ ...formData, barcode_eksemplar: e.target.value })}
                    style={{ width: '100%', fontFamily: 'monospace', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Nomor Panggil DDC
                  </label>
                  <input
                    type="text"
                    className="apple-search-input"
                    placeholder="Contoh: 899.221 atau 005.1"
                    value={formData.ddc}
                    onChange={(e) => setFormData({ ...formData, ddc: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Judul Buku */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Judul Buku <span style={{ color: 'var(--apple-danger-fill)' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  className="apple-search-input"
                  placeholder="Judul lengkap buku"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Grid Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Pengarang
                  </label>
                  <select
                    className="apple-search-input"
                    style={{ width: '100%' }}
                    value={formData.id_pengarang}
                    onChange={(e) => setFormData({ ...formData, id_pengarang: e.target.value })}
                  >
                    {pengarang.map((p) => (
                      <option key={p.id_pengarang} value={p.id_pengarang}>{p.nama_pengarang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Penerbit
                  </label>
                  <select
                    className="apple-search-input"
                    style={{ width: '100%' }}
                    value={formData.id_penerbit}
                    onChange={(e) => setFormData({ ...formData, id_penerbit: e.target.value })}
                  >
                    {penerbit.map((p) => (
                      <option key={p.id_penerbit} value={p.id_penerbit}>{p.nama_penerbit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Tahun Terbit
                  </label>
                  <input
                    type="number"
                    className="apple-search-input"
                    style={{ width: '100%' }}
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Lokasi Rak
                  </label>
                  <input
                    type="text"
                    className="apple-search-input"
                    placeholder="Contoh: R-A1"
                    value={formData.lokasi_rak}
                    onChange={(e) => setFormData({ ...formData, lokasi_rak: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Jumlah Eksemplar
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="apple-search-input"
                    style={{ width: '100%' }}
                    value={formData.qty_stok}
                    onChange={(e) => setFormData({ ...formData, qty_stok: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              {/* Cover Image Upload (Auto-compressed < 200 KB) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Foto Sampul Buku (Wajib Otomatis Dikompres &lt; 200 KB)
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {formData.foto ? (
                    <img
                      src={formData.foto}
                      alt="Cover Preview"
                      style={{
                        width: '64px',
                        height: '88px',
                        objectFit: 'cover',
                        borderRadius: 'var(--apple-radius-sm)',
                        border: '1px solid var(--apple-border)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '88px',
                        borderRadius: 'var(--apple-radius-sm)',
                        border: '1px dashed var(--apple-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f7',
                        color: 'var(--apple-text-tertiary)',
                        fontSize: '24px',
                        flexShrink: 0,
                      }}
                    >
                      <i className="bx bx-image" />
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      className="apple-search-input"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '13px', background: '#fff' }}
                    />
                    {isCompressingCover && (
                      <div style={{ fontSize: '12px', color: 'var(--apple-accent)', marginTop: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bx bx-loader-alt bx-spin" />
                        <span>Mengompresi gambar cover di bawah 200 KB...</span>
                      </div>
                    )}
                    {coverCompressInfo && !isCompressingCover && (
                      <div style={{ fontSize: '12px', color: 'var(--apple-success-text)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bx bx-check-shield" />
                        <span>Foto cover terkompresi otomatis: {coverCompressInfo.origKb} KB ➔ {coverCompressInfo.compKb} KB (Di bawah 200 KB ✓)</span>
                      </div>
                    )}
                    <input
                      type="text"
                      className="apple-search-input"
                      placeholder="Atau masukkan URL gambar..."
                      value={formData.foto.startsWith('data:') ? '' : formData.foto}
                      onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                      style={{ width: '100%', marginTop: '8px', fontSize: '12.5px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="apple-btn-secondary">
                  Batal
                </button>
                <button type="submit" className="apple-btn-primary">
                  Simpan Buku &amp; Eksemplar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Modal (Single & Sheet A4 3x8) */}
      <BarcodeModal
        buku={selectedBarcodeBuku}
        allBuku={buku}
        onClose={() => setSelectedBarcodeBuku(null)}
      />

      {/* Camera Barcode Scanner Modal */}
      {scannerTarget && (
        <BarcodeScannerModal
          isOpen={true}
          onClose={() => setScannerTarget(null)}
          onScan={(scanned) => {
            if (scannerTarget === 'search') {
              setSearch(scanned);
            } else {
              setFormData((prev) => ({ ...prev, isbn: scanned }));
            }
            setScannerTarget(null);
          }}
        />
      )}
    </div>
  );
}
