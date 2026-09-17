'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import JsBarcode from 'jsbarcode';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { compressImageUnder200KB } from '@/lib/imageCompressor';

type FilterStatus = 'SEMUA' | 'DIPINJAM' | 'OVERDUE' | 'MENUNGGU_ACC' | 'MENUNGGU_KEMBALI' | 'DIKEMBALIKAN' | 'DITOLAK';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  MENUNGGU_ACC:      { label: 'Menunggu ACC',    badgeClass: 'badge-warning',  icon: 'bx-time' },
  DIPINJAM:          { label: 'Dipinjam',         badgeClass: 'badge-primary',  icon: 'bx-book-open' },
  MENUNGGU_KEMBALI:  { label: 'Menunggu Kembali', badgeClass: 'badge-info',     icon: 'bx-revision' },
  DIKEMBALIKAN:      { label: 'Dikembalikan',     badgeClass: 'badge-success',  icon: 'bx-check-circle' },
  DITOLAK:           { label: 'Ditolak',          badgeClass: 'badge-danger',   icon: 'bx-x-circle' },
};

export const CARD_THEMES = [
  { id: 'gradient-blue',    shortId: 'blue',    name: 'Biru Samudera', color: '#0071e3', gradient: 'linear-gradient(135deg, #0071e3 0%, #1e40af 100%)' },
  { id: 'gradient-dark',    shortId: 'dark',    name: 'Hitam Titanium', color: '#1d1d1f', gradient: 'linear-gradient(135deg, #1d1d1f 0%, #1e293b 50%, #0f172a 100%)' },
  { id: 'gradient-emerald', shortId: 'emerald', name: 'Hijau Emerald', color: '#059669', gradient: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' },
  { id: 'gradient-purple',  shortId: 'purple',  name: 'Ungu Royal',    color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' },
];

export const getCardGradient = (themeKey?: string): string => {
  if (!themeKey) return CARD_THEMES[0].gradient;
  const clean = themeKey.toLowerCase().trim();
  const match = CARD_THEMES.find((t) => t.id === clean || t.shortId === clean || t.id === `gradient-${clean}`);
  return match ? match.gradient : CARD_THEMES[0].gradient;
};

export default function MemberDashboardPage() {
  const { currentUser, currentAnggota, isAdmin, updateCurrentAnggota } = useAuth();
  const { peminjaman, ajukanKembali, config, updateAnggotaProfile } = useData();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('SEMUA');
  const [showCardPrintModal, setShowCardPrintModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const printBarcodeSvgRef = useRef<SVGSVGElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isUploadingPhoto) return; // Single click protection

    setIsUploadingPhoto(true);
    try {
      const result = await compressImageUnder200KB(file, { maxKb: 180, maxWidthOrHeight: 500 });
      if (currentAnggota) {
        await updateAnggotaProfile(currentAnggota.id_anggota, { foto: result.dataUrl });
        updateCurrentAnggota({ foto: result.dataUrl });
      }
      setFeedback('Foto profil berhasil diunggah dan otomatis terpasang pada kartu anggota perpustakaan!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Error uploading photo:', err);
      setFeedback('Gagal memproses gambar. Pastikan file berformat JPG/PNG.');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const memberNo = currentAnggota?.nomor_anggota || `AG-2026${String(currentAnggota?.id_anggota || 1).padStart(4, '0')}`;

  useEffect(() => {
    if (barcodeSvgRef.current) {
      try {
        JsBarcode(barcodeSvgRef.current, memberNo, {
          format: 'CODE128',
          lineColor: '#1d1d1f',
          width: 1.8,
          height: 38,
          displayValue: true,
          fontSize: 11,
          font: 'monospace',
          margin: 2,
        });
      } catch (e) {
        console.warn('Barcode error:', e);
      }
    }
  }, [memberNo]);

  useEffect(() => {
    if (showCardPrintModal && printBarcodeSvgRef.current) {
      try {
        JsBarcode(printBarcodeSvgRef.current, memberNo, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.6,
          height: 36,
          displayValue: true,
          fontSize: 11,
          font: 'monospace',
          margin: 2,
        });
      } catch (e) {
        console.warn('Print barcode error:', e);
      }
    }
  }, [showCardPrintModal, memberNo]);

  if (!currentUser) {
    return (
      <div style={{ maxWidth: '420px', margin: '80px auto', padding: '40px 32px', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: 'var(--warning)' }}>
          <i className="bx bx-lock-alt" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-main)' }}>Akses Terbatas</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          Silakan masuk untuk melihat riwayat dan peminjaman aktif Anda.
        </p>
        <Link href="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
          <i className="bx bx-log-in" /> Masuk Sekarang
        </Link>
      </div>
    );
  }

  // Perhitungan Denda Realtime Mahasiswa (PRD §8.1 & §8.3)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculateLoanFine = (item: (typeof peminjaman)[0]) => {
    let daysLate = 0;
    let fine = 0;
    const isOngoing = item.status === 'DIPINJAM' || item.status === 'MENUNGGU_KEMBALI';
    if (isOngoing && item.tgl_kembali) {
      const due = new Date(item.tgl_kembali);
      due.setHours(0, 0, 0, 0);
      const diffMs = today.getTime() - due.getTime();
      if (diffMs > 0) {
        daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        fine = daysLate * (config.dendaPerHari || 500);
      }
    }
    return { daysLate, fine, isOverdue: daysLate > 0 };
  };

  const myLoans = peminjaman.filter(
    (p) => p.id_anggota === (currentAnggota?.id_anggota || 2)
  );

  const loansWithFineInfo = myLoans.map((item) => ({
    ...item,
    ...calculateLoanFine(item),
  }));

  const overdueLoans = loansWithFineInfo.filter((l) => l.isOverdue);
  const totalDendaBerjalan = loansWithFineInfo.reduce((acc, l) => acc + l.fine, 0);
  const dendaTertunggak = currentAnggota?.denda_tertunggak || 0;
  const grandTotalDenda = totalDendaBerjalan + dendaTertunggak;
  const isHardBlocked = grandTotalDenda > 50000 || currentAnggota?.status_keanggotaan === 'blocked';
  const isSoftBlocked = grandTotalDenda > 0 && !isHardBlocked;

  const filteredLoans = activeFilter === 'SEMUA'
    ? loansWithFineInfo
    : activeFilter === 'OVERDUE'
    ? loansWithFineInfo.filter((p) => p.isOverdue)
    : loansWithFineInfo.filter((p) => p.status === activeFilter);

  const activeLoans   = loansWithFineInfo.filter((p) => p.status === 'DIPINJAM');
  const pendingLoans  = loansWithFineInfo.filter((p) => p.status === 'MENUNGGU_ACC' || p.status === 'MENUNGGU_KEMBALI');
  const returnedLoans = loansWithFineInfo.filter((p) => p.status === 'DIKEMBALIKAN');

  const handleReturnAction = async (idPinjam: number) => {
    await ajukanKembali(idPinjam);
    setFeedback('Permintaan pengembalian telah diajukan ke petugas perpustakaan.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const filterTabs: { key: FilterStatus | 'OVERDUE'; label: string; count: number }[] = [
    { key: 'SEMUA',            label: 'Semua',          count: myLoans.length },
    { key: 'DIPINJAM',         label: 'Dipinjam',        count: activeLoans.length },
    ...(overdueLoans.length > 0 ? [{ key: 'OVERDUE' as const, label: '⚠️ Terlambat (Denda)', count: overdueLoans.length }] : []),
    { key: 'MENUNGGU_ACC',     label: 'Menunggu ACC',    count: myLoans.filter(p => p.status === 'MENUNGGU_ACC').length },
    { key: 'MENUNGGU_KEMBALI', label: 'Menunggu Kembali',count: myLoans.filter(p => p.status === 'MENUNGGU_KEMBALI').length },
    { key: 'DIKEMBALIKAN',     label: 'Dikembalikan',    count: returnedLoans.length },
    { key: 'DITOLAK',          label: 'Ditolak',         count: myLoans.filter(p => p.status === 'DITOLAK').length },
  ];

  return (
    <>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div className="page-header-info">
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)' }}>
            Riwayat &amp; Peminjaman Saya
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--apple-text-secondary)', marginTop: '4px' }}>
            Kartu digital resmi dan pantauan sirkulasi buku PustakaScan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowCardPrintModal(true)}
            className="apple-btn-secondary"
            style={{ padding: '10px 18px', gap: '6px' }}
          >
            <i className="bx bx-id-card" /> Cetak Kartu Fisik
          </button>
          {isHardBlocked ? (
            <button
              type="button"
              disabled
              className="apple-btn-secondary"
              style={{ opacity: 0.7, cursor: 'not-allowed', color: '#ff3b30', borderColor: 'rgba(255,59,48,0.4)', padding: '10px 18px', gap: '6px', background: 'rgba(255,59,48,0.06)' }}
              title="Akun diblokir otomatis oleh sistem karena denda > Rp50.000. Temui Admin Perpustakaan!"
            >
              <i className="bx bxs-lock-alt" /> Akun Diblokir (&gt; Rp50rb)
            </button>
          ) : isSoftBlocked ? (
            <button
              type="button"
              disabled
              className="apple-btn-secondary"
              style={{ opacity: 0.7, cursor: 'not-allowed', color: '#b45309', borderColor: 'rgba(255,149,0,0.4)', padding: '10px 18px', gap: '6px', background: 'rgba(255,149,0,0.06)' }}
              title="Peminjaman baru dicekal sementara karena masih memiliki denda aktif."
            >
              <i className="bx bx-error" /> Pinjam Dicekal (Ada Denda)
            </button>
          ) : (
            <Link href="/katalog" className="apple-btn-primary" style={{ padding: '10px 20px', gap: '6px' }}>
              <i className="bx bx-plus" /> Pinjam Buku Baru
            </Link>
          )}
        </div>
      </div>

      {/* Realtime Fine Notification Banner (PRD §8.3 & §8.4) */}
      {grandTotalDenda > 0 ? (
        <div
          style={{
            background: isHardBlocked ? 'rgba(255, 59, 48, 0.08)' : 'rgba(255, 149, 0, 0.08)',
            border: `1.5px solid ${isHardBlocked ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 149, 0, 0.35)'}`,
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '28px',
            color: 'var(--apple-text-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'slideDown 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: isHardBlocked ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                  color: isHardBlocked ? '#ff3b30' : '#ff9500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  flexShrink: 0,
                }}
              >
                <i className={`bx ${isHardBlocked ? 'bxs-lock' : 'bxs-error-circle'}`} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: isHardBlocked ? '#ff3b30' : '#b25900' }}>
                  {isHardBlocked
                    ? '⛔ AKUN DIBLOKIR OTOMATIS OLEH SISTEM (Denda > Rp 50.000)'
                    : '⚠️ PEMINJAMAN DICEKAL SEMENTARA (Ada Tagihan Denda)'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginTop: '2px', maxWidth: '640px', lineHeight: 1.4 }}>
                  {isHardBlocked
                    ? `Total denda Anda telah mencapai Rp ${grandTotalDenda.toLocaleString('id-ID')} (melebihi batas Rp 50.000). Sistem telah memblokir akun Anda secara otomatis. Anda WAJIB mendatangi Petugas Perpustakaan secara langsung untuk menyelesaikan denda dan membuka blokir.`
                    : `Anda memiliki denda berjalan/tertunggak sebesar Rp ${grandTotalDenda.toLocaleString('id-ID')}. Anda tidak dapat meminjam buku baru sampai denda dilunasi atau buku terlambat dikembalikan ke kasir perpustakaan.`}
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: 'right',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--apple-text-secondary)' }}>
                Total Tagihan Denda
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ff3b30', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Rp {grandTotalDenda.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Breakdown Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '12px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', fontWeight: 600 }}>
              🔴 Denda Berjalan: Rp {totalDendaBerjalan.toLocaleString('id-ID')} ({overdueLoans.length} buku)
            </span>
            {dendaTertunggak > 0 && (
              <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255, 149, 0, 0.1)', color: '#b25900', fontWeight: 600 }}>
                🟠 Denda Tertunggak: Rp {dendaTertunggak.toLocaleString('id-ID')}
              </span>
            )}
            <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(0, 113, 227, 0.08)', color: 'var(--apple-accent)', fontWeight: 500 }}>
              💡 Silakan kembalikan buku ke meja sirkulasi atau lakukan pelunasan denda kepada petugas kasir perpustakaan.
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(52, 199, 89, 0.08)',
            border: '1px solid rgba(52, 199, 89, 0.25)',
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="bx bxs-check-shield" style={{ fontSize: '22px', color: '#34c759' }} />
            <div>
              <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--apple-text-primary)' }}>
                Status Keanggotaan Bersih &amp; Bebas Denda
              </span>
              <span style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginLeft: '8px' }}>
                Seluruh pinjaman tertib dan tepat waktu. Kuota peminjaman Anda: {currentAnggota?.kuota_max || 3} buku.
              </span>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(52, 199, 89, 0.15)', color: '#248a3d' }}>
            AKTIF / BEBAS DENDA ✓
          </span>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '24px', animation: 'slideDown 0.3s ease' }}>
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }} />
          <div>{feedback}</div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="member-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* MAIN CONTENT */}
        <div>
          {/* Apple Wallet Style Digital Pass */}
          <div style={{
            background: getCardGradient(config.kartuColorTheme || 'gradient-blue'),
            borderRadius: '24px',
            padding: '28px',
            color: '#ffffff',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15) inset',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '20px',
            transition: 'background 0.35s ease',
          }}>
            {/* Hidden Photo Upload Input */}
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoUpload}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
            />

            {/* Gloss glow */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Pass Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  color: '#ffffff',
                  overflow: 'hidden',
                }}>
                  {config.logoInstansi ? (
                    <img src={config.logoInstansi} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <i className="bx bx-barcode-reader" />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
                    {config.namaAplikasi || 'PustakaScan'} &bull; {config.namaInstansi || 'Perpustakaan Digital'}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>
                    {config.kartuJudul || 'Kartu Anggota Resmi'}
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 12px',
                background: isAdmin ? 'rgba(0,113,227,0.35)' : 'rgba(52,199,89,0.35)',
                color: '#ffffff',
                borderRadius: '99px',
                border: `1px solid rgba(255,255,255,0.3)`,
                backdropFilter: 'blur(10px)',
              }}>
                {isAdmin ? 'ADMINISTRATOR' : currentAnggota?.tipe_anggota || 'SISWA'}
              </span>
            </div>

            {/* Member Info with Photo Upload */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2, flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={currentAnggota?.foto || '/profile-default.svg'}
                  alt="Foto Profil"
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2.5px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                    flexShrink: 0,
                    background: '#ffffff',
                    display: 'block',
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/profile-default.svg'; }}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  title="Klik untuk upload / ganti foto profil"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#0071e3',
                    border: '2px solid #ffffff',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}
                >
                  <i className={isUploadingPhoto ? 'bx bx-loader-alt bx-spin' : 'bx bx-camera'} />
                </button>
              </div>

              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  {currentAnggota?.nama || currentUser.username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.18)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', fontWeight: 600 }}>
                    {memberNo}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
                    Masa Berlaku: {currentAnggota?.masa_berlaku || '2028-12-31'}
                  </span>
                </div>
                {/* Upload Button */}
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    style={{
                      background: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: isUploadingPhoto ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <i className={isUploadingPhoto ? 'bx bx-loader-alt bx-spin' : 'bx bx-upload'} />
                    {isUploadingPhoto ? 'Mengompres & Menyimpan (< 200KB)...' : 'Upload Foto Profil'}
                  </button>
                </div>
              </div>

              {/* Quick stats capsules */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{activeLoans.length}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: '2px' }}>Aktif</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{myLoans.length}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: '2px' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center', background: grandTotalDenda > 0 ? 'rgba(255,59,48,0.35)' : 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '8px 12px', border: `1px solid ${grandTotalDenda > 0 ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.15)'}` }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: grandTotalDenda > 0 ? '#ffb4b4' : '#ffffff', lineHeight: 1.1 }}>
                    Rp{grandTotalDenda.toLocaleString('id-ID')}
                  </div>
                  <div style={{ fontSize: '10px', color: grandTotalDenda > 0 ? '#ffb4b4' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: '2px' }}>
                    {grandTotalDenda > 0 ? 'Denda' : 'Bersih'}
                  </div>
                </div>
              </div>
            </div>

            {/* REAL CODE 128 BARCODE SVG (PRD §6.3 & §17.2) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <svg ref={barcodeSvgRef} style={{ width: '100%', maxWidth: '300px' }} />
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                Tunjukkan barcode ini ke scanner meja sirkulasi saat meminjam buku.
              </div>
            </div>
          </div>

          {/* Loans Table Card */}
          <div className="apple-card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Filter Tabs */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--apple-border)' }}>
              <div className="apple-segmented-control" style={{ overflowX: 'auto', width: '100%' }}>
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={`apple-segment-btn ${activeFilter === tab.key ? 'active' : ''}`}
                    style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '99px',
                        background: tab.key === 'OVERDUE' ? '#ff3b30' : activeFilter === tab.key ? 'var(--apple-accent)' : 'rgba(0,0,0,0.06)',
                        color: '#ffffff',
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>No. Transaksi</th>
                    <th>Judul Buku</th>
                    <th style={{ width: '105px' }}>Tgl Pinjam</th>
                    <th style={{ width: '105px' }}>Jatuh Tempo</th>
                    <th style={{ width: '145px' }}>Status &amp; Denda</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--apple-text-secondary)' }}>
                        <i className="bx bx-book" style={{ fontSize: '36px', opacity: 0.4, marginBottom: '8px', display: 'block' }} />
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Tidak ada data pinjaman pada kategori ini.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((item) => (
                      <tr key={item.id_pinjam} style={{ background: item.isOverdue ? 'rgba(255, 59, 48, 0.04)' : undefined }}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px' }}>
                          {item.nomor_transaksi || `TRX-${item.id_pinjam}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>
                            {item.details?.[0]?.buku?.judul || 'Buku Perpustakaan'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>
                            Barcode: {item.details?.[0]?.barcode_eksemplar || item.details?.[0]?.isbn}
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{item.tgl_pinjam}</td>
                        <td style={{ fontSize: '12px', fontWeight: 600, color: item.isOverdue ? '#ff3b30' : item.status === 'DIPINJAM' ? 'var(--apple-accent)' : 'inherit' }}>
                          {item.tgl_kembali}
                        </td>
                        <td>
                          {item.isOverdue ? (
                            <div>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 'var(--apple-radius-pill)',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: 'rgba(255, 59, 48, 0.15)',
                                  color: '#ff3b30',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="bx bx-error-circle" /> Telat {item.daysLate} Hari
                              </span>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff3b30', marginTop: '3px' }}>
                                Denda: Rp {item.fine.toLocaleString('id-ID')}
                              </div>
                            </div>
                          ) : item.status === 'DIPINJAM' ? (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 'var(--apple-radius-pill)',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: 'rgba(52, 199, 89, 0.12)',
                                color: '#248a3d',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <i className="bx bx-check-circle" /> Tepat Waktu
                            </span>
                          ) : (
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 'var(--apple-radius-pill)',
                                fontSize: '11px',
                                fontWeight: 600,
                                background:
                                  item.status === 'DIKEMBALIKAN'
                                    ? 'rgba(52, 199, 89, 0.1)'
                                    : 'rgba(255, 149, 0, 0.1)',
                                color:
                                  item.status === 'DIKEMBALIKAN'
                                    ? 'var(--apple-success-text)'
                                    : 'var(--apple-warning-text)',
                              }}
                            >
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.status === 'DIPINJAM' && (
                            <button
                              type="button"
                              onClick={() => handleReturnAction(item.id_pinjam)}
                              className="apple-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '11.5px' }}
                            >
                              Ajukan Kembali
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ASIDE BAR */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Member Profile Card */}
          <div className="apple-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <i className="bx bx-user" style={{ color: 'var(--apple-accent)', fontSize: '18px' }} />
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--apple-text-primary)' }}>Profil &amp; Status Anggota</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--apple-text-secondary)' }}>Nomor Anggota:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{memberNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--apple-text-secondary)' }}>Tipe:</span>
                <span style={{ fontWeight: 600 }}>{currentAnggota?.tipe_anggota || 'Siswa'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--apple-border)', paddingTop: '8px' }}>
                <span style={{ color: 'var(--apple-text-secondary)' }}>Denda Berjalan:</span>
                <span style={{ fontWeight: 700, color: totalDendaBerjalan > 0 ? '#ff3b30' : 'inherit' }}>
                  Rp{totalDendaBerjalan.toLocaleString('id-ID')}
                </span>
              </div>
              {dendaTertunggak > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--apple-text-secondary)' }}>Denda Tertunggak:</span>
                  <span style={{ fontWeight: 700, color: '#ff9500' }}>
                    Rp{dendaTertunggak.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: grandTotalDenda > 0 ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.08)', padding: '6px 10px', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600, color: grandTotalDenda > 0 ? '#ff3b30' : '#248a3d' }}>Total Tagihan:</span>
                <span style={{ fontWeight: 800, color: grandTotalDenda > 0 ? '#ff3b30' : '#248a3d' }}>
                  Rp{grandTotalDenda.toLocaleString('id-ID')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ color: 'var(--apple-text-secondary)' }}>Status Peminjaman:</span>
                <span style={{ fontWeight: 700, color: isHardBlocked ? '#ff3b30' : isSoftBlocked ? '#ff9500' : '#34c759' }}>
                  {isHardBlocked ? '⛔ DIBLOKIR (> Rp 50rb)' : isSoftBlocked ? '⚠️ CEKAL PINJAM (Ada Denda)' : 'BEBAS DENDA ✓'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--apple-text-secondary)' }}>WhatsApp:</span>
                <span>{currentAnggota?.telp || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--apple-text-secondary)' }}>Email:</span>
                <span>{currentAnggota?.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="apple-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowCardPrintModal(true)}
              className="apple-btn-secondary"
              style={{ justifyContent: 'center', width: '100%', padding: '10px', fontSize: '13px' }}
            >
              <i className="bx bx-printer" /> Cetak Kartu Anggota (ID-1)
            </button>
            <Link href="/katalog" className="apple-btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '10px', fontSize: '13px' }}>
              <i className="bx bx-search-alt" /> Jelajahi Katalog OPAC
            </Link>
          </div>
        </aside>
      </div>

      {/* MODAL CETAK KARTU ANGGOTA FISIK KTP ID-1 (85.6 x 54 mm) (PRD §17.2) */}
      {showCardPrintModal && (
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
            if (e.target === e.currentTarget) setShowCardPrintModal(false);
          }}
        >
          <div className="apple-card" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bx bx-id-card" style={{ fontSize: '22px', color: 'var(--apple-accent)' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Cetak Kartu Anggota Fisik</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCardPrintModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="bx bx-x" />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', margin: 0 }}>
                Format ID-1 ISO 7810 (85.6 &times; 54 mm) standar resmi perpustakaan siap cetak &amp; laminating.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', fontWeight: 600 }}>
                  <i className="bx bx-check-shield" style={{ color: '#0071e3' }} /> Desain Resmi Perpustakaan
                </span>
              </div>
            </div>

            {/* Printable ID-1 Card Preview (Front & Back) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {/* Card Front */}
              <div
                style={{
                  width: '320px',
                  height: '202px',
                  margin: '0 auto',
                  borderRadius: '12px',
                  background: getCardGradient(config.kartuColorTheme || 'gradient-blue'),
                  color: '#ffffff',
                  padding: '16px',
                  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.25)',
                  transition: 'background 0.35s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {config.logoInstansi && (
                      <img src={config.logoInstansi} alt="Logo" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    )}
                    <div style={{ fontWeight: 800, fontSize: '12.5px', letterSpacing: '0.04em' }}>
                      {config.namaAplikasi || 'PUSTAKASCAN'}
                    </div>
                  </div>
                  <span style={{ fontSize: '8px', fontWeight: 700, background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.02em', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {config.kartuJudul || 'KARTU PERPUSTAKAAN'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={currentAnggota?.foto || '/profile-default.svg'}
                      alt="Foto"
                      style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1.5px solid #ffffff', background: '#fff', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/profile-default.svg'; }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2 }}>
                      {currentAnggota?.nama || currentUser.username}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '12px', marginTop: '2px', color: '#e0e7ff' }}>
                      {memberNo}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.85 }}>
                      Tipe: {currentAnggota?.tipe_anggota || 'Siswa'} &bull; Berlaku: {currentAnggota?.masa_berlaku || '2028-12-31'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '8.5px', opacity: 0.85, textAlign: 'right' }}>
                  {config.namaInstansi || 'Perpustakaan Terpadu'} &bull; {config.namaAplikasi || 'PustakaScan'}
                </div>
              </div>

              {/* Card Back */}
              <div
                style={{
                  width: '320px',
                  height: '202px',
                  margin: '0 auto',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '16px',
                  boxShadow: 'var(--apple-shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--apple-border)',
                }}
              >
                <div style={{ fontSize: '9px', color: '#64748b', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {config.kartuCatatan || '1. Kartu ini wajib dibawa saat meminjam buku.\n2. Batas pinjam dan denda berlaku sesuai ketentuan resmi.\n3. Kehilangan kartu segera laporkan ke bagian sirkulasi.'}
                </div>

                <div style={{ textAlign: 'center', margin: '4px 0' }}>
                  <svg ref={printBarcodeSvgRef} style={{ maxWidth: '100%', height: '40px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8px', color: '#64748b' }}>
                  <span>pustakascan.id</span>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', width: '70px', height: '14px' }} />
                    <div style={{ marginTop: '2px' }}>Tanda Tangan</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="apple-btn-secondary"
                style={{ gap: '6px', fontSize: '13px' }}
              >
                <i className={isUploadingPhoto ? 'bx bx-loader-alt bx-spin' : 'bx bx-camera'} />
                {isUploadingPhoto ? 'Mengompres...' : 'Ganti Foto Profil'}
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowCardPrintModal(false)} className="apple-btn-secondary">
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="apple-btn-primary"
                  style={{ gap: '6px' }}
                >
                  <i className="bx bx-printer" /> Cetak Kartu Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
