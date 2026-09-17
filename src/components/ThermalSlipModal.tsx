'use client';

import React, { useRef } from 'react';
import { Peminjaman } from '@/types/database';

interface ThermalSlipModalProps {
  loan: Peminjaman | null;
  mode?: 'pinjam' | 'kembali';
  libraryName?: string;
  libraryAddress?: string;
  officerName?: string;
  onClose: () => void;
}

export default function ThermalSlipModal({
  loan,
  mode = 'pinjam',
  libraryName = 'PUSTAKASCAN DIGITAL',
  libraryAddress = 'Jl. Soekarno-Hatta No. 10, Kampus Terpadu',
  officerName = 'Petugas Sirkulasi',
  onClose,
}: ThermalSlipModalProps) {
  const slipRef = useRef<HTMLDivElement | null>(null);

  if (!loan) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReturn = mode === 'kembali' || loan.status === 'DIKEMBALIKAN';
  const books = loan.details || [];
  const fineAmount = loan.denda_terhitung || 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--apple-radius-xl)',
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          boxShadow: 'var(--apple-shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--apple-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bx bx-receipt" style={{ fontSize: '22px', color: 'var(--apple-accent)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
              {isReturn ? 'Slip Bukti Pengembalian' : 'Slip Bukti Peminjaman'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: 'var(--apple-radius-pill)',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--apple-text-secondary)',
            }}
          >
            <i className="bx bx-x" style={{ fontSize: '18px' }} />
          </button>
        </div>

        {/* Printable Thermal Receipt Box */}
        <div
          id="printableThermalReceipt"
          ref={slipRef}
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: 'var(--apple-radius-md)',
            padding: '20px 16px',
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '12.5px',
            lineHeight: 1.45,
            color: '#0f172a',
            overflowY: 'auto',
            flex: 1,
            userSelect: 'text',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.05em' }}>
              {libraryName.toUpperCase()}
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
              {libraryAddress}
            </div>
            <div style={{ margin: '6px 0', borderBottom: '1px dashed #475569' }} />
            <div style={{ fontWeight: 700, fontSize: '12.5px' }}>
              {isReturn ? 'BUKTI PENGEMBALIAN BUKU' : 'BUKTI PEMINJAMAN BUKU'}
            </div>
          </div>

          <table style={{ width: '100%', fontSize: '11.5px', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ width: '60px', color: '#475569' }}>No.Trx</td>
                <td style={{ fontWeight: 700 }}>: {loan.nomor_transaksi || `TRX-${loan.id_pinjam}`}</td>
              </tr>
              <tr>
                <td style={{ color: '#475569' }}>Waktu</td>
                <td>: {loan.tgl_pinjam} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              <tr>
                <td style={{ color: '#475569' }}>Petugas</td>
                <td>: {officerName}</td>
              </tr>
              <tr>
                <td style={{ color: '#475569' }}>Metode</td>
                <td>: {loan.input_method === 'scan' ? 'SCAN BARCODE' : 'MANUAL ENTRY'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderBottom: '1px dashed #475569', margin: '6px 0' }} />

          <div style={{ fontSize: '11.5px', marginBottom: '8px' }}>
            <div>
              <span style={{ color: '#475569' }}>Peminjam : </span>
              <strong>{loan.anggota?.nama || 'Anggota Perpustakaan'}</strong>
            </div>
            <div>
              <span style={{ color: '#475569' }}>No.Ang   : </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {loan.anggota?.nomor_anggota || `AG-${loan.id_anggota}`}
              </span>
              <span style={{ color: '#64748b', marginLeft: '6px' }}>
                ({loan.anggota?.tipe_anggota || 'Siswa'})
              </span>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed #475569', margin: '6px 0' }} />

          {/* Book Items */}
          <div style={{ marginBottom: '8px' }}>
            {books.map((b, idx) => (
              <div key={idx} style={{ marginBottom: '6px', fontSize: '11.5px' }}>
                <div style={{ fontWeight: 700 }}>
                  {idx + 1}. {b.buku?.judul || 'Buku Perpustakaan'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '11px' }}>
                  <span>Barcode: {b.barcode_eksemplar || b.isbn}</span>
                  <span>Rak: {b.buku?.lokasi_rak || b.buku?.id_katalog || 'Umum'}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderBottom: '1px dashed #475569', margin: '6px 0' }} />

          {/* Circulation Dates & Fine Summary */}
          <table style={{ width: '100%', fontSize: '11.5px', margin: '6px 0' }}>
            <tbody>
              <tr>
                <td style={{ color: '#475569' }}>Total Buku</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{books.length} eksemplar</td>
              </tr>
              {isReturn ? (
                <>
                  <tr>
                    <td style={{ color: '#475569' }}>Tgl Dikembalikan</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{loan.tgl_dikembalikan_aktual || new Date().toISOString().split('T')[0]}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#475569' }}>Kondisi Buku</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{loan.kondisi_kembali || 'Baik'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#475569' }}>Denda Terhitung</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: fineAmount > 0 ? '#b91c1c' : '#15803d' }}>
                      {fineAmount > 0 ? `Rp${fineAmount.toLocaleString('id-ID')}` : 'Rp0 (Tepat Waktu)'}
                    </td>
                  </tr>
                  {fineAmount > 0 && (
                    <tr>
                      <td style={{ color: '#475569' }}>Status Denda</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {loan.status_denda === 'DIBEBASKAN' ? 'DIBEBASKAN' : loan.status_denda === 'LUNAS' ? 'LUNAS DIBAYAR' : 'BELUM DIBAYAR'}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <>
                  <tr>
                    <td style={{ color: '#475569', fontWeight: 700 }}>JATUH TEMPO</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      {loan.tgl_kembali}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#475569' }}>Tarif Telat</td>
                    <td style={{ textAlign: 'right' }}>Rp500 / hari / buku</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <div style={{ borderBottom: '1px dashed #475569', margin: '6px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '10.5px', color: '#475569', marginTop: '10px' }}>
            <div>Simpan slip ini sebagai bukti resmi.</div>
            <div>Cek katalog &amp; pinjaman di pustakascan.id</div>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>*** TERIMA KASIH ***</div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onClose}
            className="apple-btn-secondary"
            style={{ flex: 1, fontSize: '13px' }}
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="apple-btn-primary"
            style={{ flex: 1, fontSize: '13px', gap: '6px' }}
          >
            <i className="bx bx-printer" /> Cetak Slip Thermal
          </button>
        </div>
      </div>
    </div>
  );
}
