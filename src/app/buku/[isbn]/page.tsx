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
      <div className="card" style={{ maxWidth: '500px', margin: '60px auto', padding: '36px', textAlign: 'center' }}>
        <i className="bx bx-book-x" style={{ fontSize: '48px', color: 'var(--text-light)', marginBottom: '12px', display: 'block' }}></i>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Buku Tidak Ditemukan</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Buku dengan ISBN <code>{isbn}</code> tidak ditemukan di database perpustakaan.
        </p>
        <Link href="/katalog" className="btn btn-primary">
          <i className="bx bx-arrow-back"></i> Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const handleBorrow = async () => {
    if (!currentUser) {
      setFeedback({
        msg: 'Silakan masuk (login) terlebih dahulu untuk meminjam buku ini!',
        isError: true,
      });
      return;
    }

    if (!currentAnggota) {
      setFeedback({
        msg: 'Akun Anda bukan akun anggota perpustakaan yang aktif.',
        isError: true,
      });
      return;
    }

    const res = await pinjamBuku(currentAnggota.id_anggota, targetBook.isbn, 1);
    setFeedback({
      msg: res.message,
      isError: !res.success,
    });
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Detail Informasi Buku</h1>
          <p>Informasi bibliografi dan ketersediaan stok buku fisik di perpustakaan.</p>
        </div>
        <div className="page-actions">
          <button onClick={() => router.back()} className="btn btn-secondary">
            <i className="bx bx-arrow-back"></i> Kembali
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.isError ? 'alert-danger' : 'alert-success'}`}>
          <i className={`bx ${feedback.isError ? 'bx-error-circle' : 'bx-check-circle'}`} style={{ fontSize: '20px' }}></i>
          <div>{feedback.msg}</div>
        </div>
      )}

      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Cover & Barcode Action */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--card-border)', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={targetBook.foto || '/default-book-cover.svg'}
                alt={targetBook.judul}
                style={{ width: '180px', height: '240px', objectFit: 'contain', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                }}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <button onClick={() => setShowBarcodeModal(true)} className="btn btn-secondary btn-sm" style={{ width: '100%', maxWidth: '210px', margin: 'auto', justifyContent: 'center' }}>
                <i className="bx bx-barcode"></i> Cetak Label Barcode
              </button>
            </div>
          </div>

          {/* Details */}
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span className="badge badge-info" style={{ marginRight: '8px' }}>
                {targetBook.katalog?.nama || 'Umum'}
              </span>
              <span className={`badge ${targetBook.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`}>
                {targetBook.qty_stok > 0 ? `Tersedia: ${targetBook.qty_stok} Eksemplar` : 'Stok Habis'}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: '16px' }}>
              {targetBook.judul}
            </h2>

            <div style={{ background: 'var(--bg-main)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', marginBottom: '20px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Pengarang</span>
                <strong>{targetBook.pengarang?.nama_pengarang || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Penerbit</span>
                <strong>{targetBook.penerbit?.nama_penerbit || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Tahun Terbit</span>
                <strong>{targetBook.tahun}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Nomor ISBN</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{targetBook.isbn}</strong>
              </div>
            </div>

            <div className="alert alert-info" style={{ fontSize: '12.5px', padding: '12px 16px' }}>
              <i className="bx bx-info-circle" style={{ fontSize: '20px' }}></i>
              <div>
                Maksimal peminjaman: <strong>{config.maxLamaPinjam} hari</strong> &bull; Denda keterlambatan: <strong>Rp {config.dendaPerHari?.toLocaleString('id-ID')} / hari</strong>.
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleBorrow}
                disabled={targetBook.qty_stok <= 0}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '14px' }}
              >
                <i className="bx bx-cart-add"></i> {targetBook.qty_stok > 0 ? 'Ajukan Peminjaman Buku' : 'Stok Sedang Habis'}
              </button>
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
    </>
  );
}
