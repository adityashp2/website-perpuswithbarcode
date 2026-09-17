'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isbn = decodeURIComponent((params.isbn as string) || '');
  
  const { buku, pinjamBuku, config } = useData();
  const { currentUser, currentAnggota } = useAuth();
  
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

  const targetBook = buku.find((b) => b.isbn === isbn);

  if (!targetBook) {
    return (
      <div className="apple-card" style={{ maxWidth: '480px', margin: '60px auto', padding: '40px', textAlign: 'center' }}>
        <i className="bx bx-book-x" style={{ fontSize: '48px', color: 'var(--apple-text-tertiary)', marginBottom: '12px', display: 'block' }}></i>
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px', color: 'var(--apple-text-primary)' }}>Buku Tidak Ditemukan</h2>
        <p style={{ fontSize: '14px', color: 'var(--apple-text-secondary)', marginBottom: '24px' }}>
          Buku dengan ISBN <code>{isbn}</code> tidak terdaftar di database perpustakaan.
        </p>
        <Link href="/katalog" className="apple-btn-primary">
          <i className="bx bx-arrow-back"></i> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const handleBorrow = async () => {
    const targetAnggotaId = currentAnggota?.id_anggota;
    
    if (!targetAnggotaId) {
      setFeedback({ msg: 'Sesi anggota belum siap. Silakan klik pinjam lagi.', isError: true });
      return;
    }

    const res = await pinjamBuku(targetAnggotaId, targetBook.isbn, 1);
    setFeedback({
      msg: res.success 
        ? `Sukses! Peminjaman buku "${targetBook.judul}" berhasil diajukan & masuk ke antrean ACC Sirkulasi.`
        : res.message,
      isError: !res.success,
    });

    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/katalog');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-info">
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Detail Bibliografi
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)', margin: '4px 0 0' }}>
            Informasi Buku
          </h1>
        </div>
        <div className="page-actions">
          <button type="button" onClick={handleBack} className="apple-btn-secondary">
            <i className="bx bx-chevron-left" style={{ fontSize: '18px' }}></i> Kembali ke Katalog
          </button>
        </div>
      </div>

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

      {/* Apple Books Product Layout */}
      <div className="apple-card" style={{ padding: 'clamp(24px, 4vw, 40px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'start' }}>
          {/* Left Column: Book Cover & Barcode Printing */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.02)',
                padding: '24px',
                borderRadius: 'var(--apple-radius-lg)',
                border: '1px solid var(--apple-border-subtle)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                maxWidth: '280px',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={targetBook.foto || '/default-book-cover.svg'}
                alt={targetBook.judul}
                style={{
                  width: '180px',
                  height: '250px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.12)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                }}
              />
            </div>

            {currentUser?.type === 'ADM' && (
              <button
                onClick={() => setShowBarcodeModal(true)}
                className="apple-btn-secondary"
                style={{ width: '100%', maxWidth: '280px', fontSize: '13px' }}
              >
                <i className="bx bx-barcode"></i> Cetak Label Barcode
              </button>
            )}
          </div>

          {/* Right Column: Metadata, Specs, & Borrow Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-info">
                  {targetBook.katalog?.nama || 'Umum'}
                </span>
                <span className={`badge ${targetBook.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`}>
                  <i className={targetBook.qty_stok > 0 ? 'bx bx-check' : 'bx bx-x'}></i> {targetBook.qty_stok > 0 ? `Tersedia: ${targetBook.qty_stok} Eksemplar` : 'Stok Habis'}
                </span>
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--apple-text-primary)', lineHeight: 1.3, letterSpacing: '-0.02em', margin: 0 }}>
                {targetBook.judul}
              </h2>
            </div>

            {/* Apple Spec Table */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.02)',
                padding: '18px 20px',
                borderRadius: 'var(--apple-radius-md)',
                border: '1px solid var(--apple-border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
                fontSize: '13.5px',
              }}
            >
              <div>
                <span style={{ color: 'var(--apple-text-secondary)', display: 'block', fontSize: '12px', marginBottom: '2px' }}>Pengarang</span>
                <strong style={{ color: 'var(--apple-text-primary)' }}>{targetBook.pengarang?.nama_pengarang || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--apple-text-secondary)', display: 'block', fontSize: '12px', marginBottom: '2px' }}>Penerbit</span>
                <strong style={{ color: 'var(--apple-text-primary)' }}>{targetBook.penerbit?.nama_penerbit || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--apple-text-secondary)', display: 'block', fontSize: '12px', marginBottom: '2px' }}>Tahun Terbit</span>
                <strong style={{ color: 'var(--apple-text-primary)' }}>{targetBook.tahun}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--apple-text-secondary)', display: 'block', fontSize: '12px', marginBottom: '2px' }}>Nomor ISBN</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--apple-accent)' }}>{targetBook.isbn}</strong>
              </div>
            </div>

            {/* Lending Policy Card */}
            <div className="alert alert-info" style={{ fontSize: '13px', margin: 0 }}>
              <i className="bx bx-info-circle" style={{ fontSize: '18px' }}></i>
              <div>
                Batas pinjam maksimal <strong>{config.maxLamaPinjam} hari</strong> &bull; Denda keterlambatan <strong>Rp {config.dendaPerHari?.toLocaleString('id-ID')} / hari</strong>.
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ paddingTop: '8px' }}>
              {!currentUser ? (
                <Link
                  href={`/login?redirect=/buku/${encodeURIComponent(targetBook.isbn)}`}
                  className="apple-btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="bx bx-log-in-circle" style={{ fontSize: '18px' }} /> Masuk untuk Meminjam Buku
                </Link>
              ) : currentUser.type === 'ADM' ? (
                <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/admin/sirkulasi`}
                    className="apple-btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <i className="bx bx-store-alt" style={{ fontSize: '18px' }} /> Buka di Meja Kasir Sirkulasi
                  </Link>
                  <Link
                    href={`/admin/buku`}
                    className="apple-btn-secondary"
                    style={{ padding: '12px 20px', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <i className="bx bx-edit" style={{ fontSize: '18px' }} /> Kelola di Database Buku
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => void handleBorrow()}
                  disabled={targetBook.qty_stok <= 0}
                  className="apple-btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px' }}
                >
                  <i className="bx bx-cart-add" style={{ fontSize: '18px' }}></i> {targetBook.qty_stok > 0 ? 'Ajukan Peminjaman Buku' : 'Stok Sedang Habis'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBarcodeModal && (
        <BarcodeModal
          buku={targetBook}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}
    </div>
  );
}

