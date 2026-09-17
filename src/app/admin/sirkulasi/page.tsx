'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { Peminjaman, Anggota, Buku } from '@/types/database';
import { 
  attachKeyboardWedgeListener, 
  resolveBarcodeType, 
  BarcodeResolution, 
  cleanBarcode 
} from '@/lib/scannerEngine';
import { 
  playItemScanBeep, 
  playMemberScanBeep, 
  playScanErrorSound, 
  playTransactionSuccessSound,
  isAudioMuted,
  toggleAudioMute
} from '@/lib/audioFeedback';
import ThermalSlipModal from '@/components/ThermalSlipModal';
import { BarcodeScannerModal } from '@/components/BarcodeScanner';

interface CartItem {
  buku: Buku;
  barcode: string;
  addedAt: string;
}

export default function AdminSirkulasiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isAdmin } = useAuth();
  const { 
    peminjaman, 
    buku, 
    anggota, 
    config, 
    accPinjam, 
    tolakPinjam, 
    accKembali,
    createCirculationLoanBatch,
    processCirculationReturn,
    renewLoan,
    payMemberFine,
    waiveMemberFine,
    findAnggotaByCode,
    findBukuByCode,
    resetToDemoData,
  } = useData();

  // Mode kasir vs riwayat
  const [viewMode, setViewMode] = useState<'kasir' | 'riwayat'>('kasir');
  const [circulationMode, setCirculationMode] = useState<'pinjam' | 'kembali'>('pinjam');

  // Mode Kasir - Pinjam State
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanInputVal, setScanInputVal] = useState('');
  const [hardError, setHardError] = useState<string | null>(null);
  const [flashScreen, setFlashScreen] = useState<'green' | 'red' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Return Flow State (Mode Kembali)
  const [returnBarcodeVal, setReturnBarcodeVal] = useState('');
  const [returnSelectedLoan, setReturnSelectedLoan] = useState<Peminjaman | null>(null);
  const [returnCondition, setReturnCondition] = useState<'Baik' | 'Rusak' | 'Hilang'>('Baik');
  const [returnWaiveFine, setReturnWaiveFine] = useState(false);

  // Thermal Slip Modal State
  const [slipModalData, setSlipModalData] = useState<{ loan: Peminjaman; mode: 'pinjam' | 'kembali' } | null>(null);
  const [lastProcessedLoan, setLastProcessedLoan] = useState<Peminjaman | null>(null);

  // Modals for shortcuts F3 (Cari manual), F4 (Perpanjang), F5 (Bayar denda), & Panduan Alur
  const [showManualSearchModal, setShowManualSearchModal] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [finePayAmount, setFinePayAmount] = useState<number>(0);
  const [fineWaiveReason, setFineWaiveReason] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Online ACC tab filter state (for Riwayat view)
  const [accTab, setAccTab] = useState<'pending' | 'dipinjam' | 'kembali' | 'selesai'>('pending');
  const scanInputRef = useRef<HTMLInputElement | null>(null);

  // Role & Permission Guard
  useEffect(() => {
    if (currentUser && currentUser.type !== 'ADM') {
      router.replace('/login');
    }
  }, [currentUser, router]);

  // Sync tab with searchParams (e.g. from sidebar notification)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subParam = searchParams.get('sub');
    if (tabParam === 'riwayat') {
      setViewMode('riwayat');
      if (subParam === 'pending') setAccTab('pending');
    }
  }, [searchParams]);

  useEffect(() => {
    setSoundMuted(isAudioMuted());
  }, []);

  // Autofocus input scan periodically or after actions
  useEffect(() => {
    if (viewMode === 'kasir') {
      scanInputRef.current?.focus();
    }
  }, [viewMode, circulationMode, selectedAnggota, cart.length]);

  // Flash screen helper (PRD §9.1: error full screen red flash, success green border)
  const triggerFlash = (type: 'green' | 'red') => {
    setFlashScreen(type);
    setTimeout(() => setFlashScreen(null), type === 'red' ? 800 : 300);
  };

  const showHardError = (msg: string) => {
    setHardError(msg);
    triggerFlash('red');
    playScanErrorSound();
    setTimeout(() => {
      setHardError(null);
    }, 4500);
  };

  // Sound Mute toggle
  const handleToggleSound = () => {
    const next = toggleAudioMute();
    setSoundMuted(next);
  };

  // =========================================================================
  // Process Single Scanned Code (Called by Scanner Gun or Manual Input)
  // =========================================================================
  const handleProcessBarcode = useCallback((rawCode: string) => {
    const clean = cleanBarcode(rawCode);
    if (!clean) return;

    // Debounce rapid identical scans (prevents hardware wedge + form submit double triggering)
    const now = Date.now();
    if (lastScanRef.current.code.toLowerCase() === clean.toLowerCase() && (now - lastScanRef.current.time) < 400) {
      return;
    }
    lastScanRef.current = { code: clean, time: now };

    setHardError(null);

    // MODE KEMBALI (F2): Scan buku langsung mencari transaksi aktif
    if (circulationMode === 'kembali') {
      const activeLoan = peminjaman.find(
        (p) =>
          (p.status === 'DIPINJAM' || p.status === 'MENUNGGU_KEMBALI') &&
          p.details?.some((d) => {
            const cleanTarget = clean.toLowerCase();
            return (
              d.barcode_eksemplar?.toLowerCase() === cleanTarget ||
              d.isbn.toLowerCase() === cleanTarget
            );
          })
      );

      if (activeLoan) {
        setReturnSelectedLoan(activeLoan);
        setReturnBarcodeVal(clean);
        playItemScanBeep();
      } else {
        showHardError(`Buku dengan barcode "${clean}" tidak tercatat sedang dipinjam.`);
      }
      return;
    }

    // MODE PINJAM (F1): Disambiguasi cerdas sesuai PRD §6.3
    const resolution: BarcodeResolution = resolveBarcodeType(clean);

    // Kasus 1: Barcode Anggota (Prefix AG-, MBR-, atau terdaftar sebagai anggota)
    const matchedAnggota = findAnggotaByCode(clean);

    if (resolution.type === 'member' || matchedAnggota) {
      const targetMbr = matchedAnggota || findAnggotaByCode(clean);
      if (!targetMbr) {
        showHardError(`Kartu Anggota "${clean}" tidak terdaftar dalam sistem perpustakaan.`);
        return;
      }

      if (targetMbr.status_keanggotaan === 'blocked') {
        showHardError(`Keanggotaan ${targetMbr.nama} DIBLOKIR! Tidak dapat melakukan peminjaman.`);
        return;
      }

      if (targetMbr.status_keanggotaan === 'expired') {
        showHardError(`Kartu anggota ${targetMbr.nama} sudah kadaluarsa sejak ${targetMbr.masa_berlaku || 'tempo lalu'}.`);
        return;
      }

      // Check fine threshold (PRD §12.2)
      const unpaidFines = targetMbr.denda_tertunggak || 0;
      const fineThreshold = config.ambangDendaBlokir || 10000;
      if (unpaidFines >= fineThreshold) {
        showHardError(`Anggota memiliki denda tertunggak Rp${unpaidFines.toLocaleString('id-ID')} (Ambang batas Rp${fineThreshold.toLocaleString('id-ID')}). SELESAI dinonaktifkan.`);
      }

      // If switching member while cart is filled
      if (selectedAnggota && selectedAnggota.id_anggota !== targetMbr.id_anggota && cart.length > 0) {
        if (!confirm(`Ganti anggota ke ${targetMbr.nama}? Keranjang aktif (${cart.length} buku) akan dikosongkan.`)) {
          return;
        }
        setCart([]);
      }

      setSelectedAnggota(targetMbr);
      playMemberScanBeep();
      triggerFlash('green');
      return;
    }

    // Kasus 2: Barcode Buku (Prefix PS-, ISBN, atau kode eksemplar)
    if (!selectedAnggota) {
      const detectedBook = findBukuByCode(clean);
      if (detectedBook) {
        showHardError(`Buku "${detectedBook.judul}" (${clean}) terdeteksi! Pindai KARTU ANGGOTA (Prefix AG-) terlebih dahulu untuk memulai transaksi.`);
      } else {
        showHardError(`Kode "${clean}" tidak dikenali sebagai kartu anggota. Pindai KARTU ANGGOTA terlebih dahulu.`);
      }
      return;
    }

    const matchedBook = findBukuByCode(clean);
    if (!matchedBook) {
      showHardError(`Barcode buku "${clean}" tidak terdaftar dalam katalog perpustakaan. (Tekan F3 untuk cari manual)`);
      return;
    }

    // Validasi buku (PRD §12.3)
    if (matchedBook.is_reference) {
      showHardError(`Buku "${matchedBook.judul}" adalah KOLEKSI REFERENSI (hanya baca di tempat, tidak boleh dipinjam keluar).`);
      return;
    }

    if (matchedBook.kondisi === 'Rusak Berat') {
      showHardError(`Buku "${matchedBook.judul}" dalam kondisi RUSAK BERAT.`);
      return;
    }

    if (matchedBook.qty_stok <= 0) {
      showHardError(`Stok eksemplar buku "${matchedBook.judul}" sedang HABIS di rak.`);
      return;
    }

    // Cek apakah buku sudah ada di keranjang saat ini
    const isAlreadyInCart = cart.some(
      (item) => item.buku.isbn === matchedBook.isbn || item.barcode === clean
    );
    if (isAlreadyInCart) {
      showHardError(`Buku "${matchedBook.judul}" sudah ada di keranjang transaksi saat ini.`);
      return;
    }

    // Cek kuota anggota
    const activeMemberLoans = peminjaman.filter(
      (p) => p.id_anggota === selectedAnggota.id_anggota && (p.status === 'DIPINJAM' || p.status === 'MENUNGGU_ACC')
    );
    const quotaMax = selectedAnggota.kuota_max || (selectedAnggota.tipe_anggota === 'Guru' ? 5 : selectedAnggota.tipe_anggota === 'Umum' ? 2 : 3);
    const activeLoanCount = activeMemberLoans.reduce((acc, p) => acc + (p.details?.length || 1), 0);

    if (activeLoanCount + cart.length + 1 > quotaMax) {
      showHardError(`Peminjaman melebihi batas kuota anggota! Maksimal ${quotaMax} buku (Saat ini aktif: ${activeLoanCount}, keranjang: ${cart.length}).`);
      return;
    }

    // Cek apakah eksemplar ini sedang dipinjam orang lain
    const isLoanedOut = peminjaman.some(
      (p) =>
        p.status === 'DIPINJAM' &&
        p.details?.some(
          (d) =>
            (d.barcode_eksemplar && d.barcode_eksemplar.toLowerCase() === clean.toLowerCase()) ||
            (!d.barcode_eksemplar && d.isbn === matchedBook.isbn)
        )
    );
    if (isLoanedOut) {
      showHardError(`Buku "${matchedBook.judul}" (${clean}) sedang tercatat dipinjam anggota lain!`);
      return;
    }

    // Lolos semua validasi: masukkan buku ke keranjang seketika!
    const newCartItem: CartItem = {
      buku: matchedBook,
      barcode: clean,
      addedAt: new Date().toLocaleTimeString('id-ID'),
    };

    setCart((prev) => [...prev, newCartItem]);
    playItemScanBeep();
    triggerFlash('green');
  }, [circulationMode, peminjaman, selectedAnggota, findAnggotaByCode, findBukuByCode, config, cart]);

  // =========================================================================
  // Global Keyboard Listener (Hardware Wedge + Shortcuts F1-F5, Enter, Esc, Delete)
  // =========================================================================
  useEffect(() => {
    // 1. Hardware Scanner Wedge Listener
    const detachScanner = attachKeyboardWedgeListener((scannedText) => {
      setScanInputVal('');
      handleProcessBarcode(scannedText);
    });

    // 2. Function Keys & Shortcut Handlers (PRD §3.3)
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ignore when typing inside input except specific shortcuts
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === 'F1') {
        e.preventDefault();
        setCirculationMode('pinjam');
        setFeedback('Beralih ke Mode Pinjam (F1)');
        setTimeout(() => setFeedback(null), 2500);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCirculationMode('kembali');
        setFeedback('Beralih ke Mode Kembali (F2)');
        setTimeout(() => setFeedback(null), 2500);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setShowManualSearchModal(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowRenewModal(true);
      } else if (e.key === 'F5') {
        e.preventDefault();
        setShowFineModal(true);
      } else if (e.key === 'Escape') {
        if (showManualSearchModal || showRenewModal || showFineModal || slipModalData) {
          setShowManualSearchModal(false);
          setShowRenewModal(false);
          setShowFineModal(false);
          setSlipModalData(null);
        } else if (cart.length > 0) {
          if (confirm('Reset transaksi kasir? Seluruh buku dalam keranjang akan dikosongkan.')) {
            setCart([]);
            setSelectedAnggota(null);
            setHardError(null);
          }
        } else {
          setSelectedAnggota(null);
          setReturnSelectedLoan(null);
          setHardError(null);
        }
      } else if (e.key === 'Delete' && !isInput) {
        // Delete last item from cart
        if (cart.length > 0) {
          e.preventDefault();
          setCart((prev) => prev.slice(0, -1));
          setFeedback('Item terakhir dihapus dari keranjang.');
          setTimeout(() => setFeedback(null), 2000);
        }
      } else if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        // Reprints last receipt
        if (lastProcessedLoan) {
          e.preventDefault();
          setSlipModalData({ loan: lastProcessedLoan, mode: 'pinjam' });
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      detachScanner();
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, [handleProcessBarcode, cart.length, showManualSearchModal, showRenewModal, showFineModal, slipModalData, lastProcessedLoan]);

  // Submit scan bar form manually
  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInputVal.trim()) return;
    const v = scanInputVal.trim();
    setScanInputVal('');
    handleProcessBarcode(v);
  };

  // Selesaikan Transaksi Pinjam (Enter)
  const handleFinishLoanTransaction = async () => {
    if (!selectedAnggota) {
      showHardError('Tidak ada anggota yang dipilih. Silakan scan kartu anggota terlebih dahulu.');
      return;
    }
    if (cart.length === 0) {
      showHardError('Keranjang belanja buku masih kosong. Scan minimal 1 barcode buku.');
      return;
    }

    const booksPayload = cart.map((c) => ({
      isbn: c.buku.isbn,
      barcode: c.barcode,
      qty: 1,
    }));

    const res = await createCirculationLoanBatch({
      idAnggota: selectedAnggota.id_anggota,
      books: booksPayload,
      inputMethod: 'scan',
    });

    if (res.success && res.loan) {
      playTransactionSuccessSound();
      setLastProcessedLoan(res.loan);
      setSlipModalData({ loan: res.loan, mode: 'pinjam' });
      // Reset form siap untuk transaksi berikutnya
      setCart([]);
      setSelectedAnggota(null);
      setFeedback(`Transaksi ${res.transactionId} sukses diproses!`);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      showHardError(res.message || 'Gagal memproses transaksi.');
    }
  };

  // Selesaikan Pengembalian Buku (Mode Kembali)
  const handleFinishReturnTransaction = async () => {
    if (!returnSelectedLoan) {
      showHardError('Pilih atau scan barcode buku yang sedang dipinjam terlebih dahulu.');
      return;
    }

    const targetBarcode = returnBarcodeVal || returnSelectedLoan.details?.[0]?.barcode_eksemplar || returnSelectedLoan.details?.[0]?.isbn || '';
    const res = await processCirculationReturn({
      barcodeOrIsbn: targetBarcode,
      kondisi: returnCondition,
      waiveFine: returnWaiveFine,
    });

    if (res.success && res.returnedLoan) {
      playTransactionSuccessSound();
      setLastProcessedLoan(res.returnedLoan);
      setSlipModalData({ loan: res.returnedLoan, mode: 'kembali' });
      setReturnSelectedLoan(null);
      setReturnBarcodeVal('');
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 4500);
    } else {
      showHardError(res.message || 'Gagal memproses pengembalian buku.');
    }
  };

  // Remove single item from cart
  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations for Member Panel
  const memberActiveLoans = selectedAnggota
    ? peminjaman.filter(
        (p) => p.id_anggota === selectedAnggota.id_anggota && (p.status === 'DIPINJAM' || p.status === 'MENUNGGU_ACC')
      )
    : [];
  const memberActiveCount = memberActiveLoans.reduce((acc, p) => acc + (p.details?.length || 1), 0);
  const memberMaxQuota = selectedAnggota?.kuota_max || (selectedAnggota?.tipe_anggota === 'Guru' ? 5 : selectedAnggota?.tipe_anggota === 'Umum' ? 2 : 3);
  const remainingQuota = Math.max(0, memberMaxQuota - memberActiveCount - cart.length);
  const hasUnpaidFine = (selectedAnggota?.denda_tertunggak || 0) > 0;
  const isFineBlocked = (selectedAnggota?.denda_tertunggak || 0) >= (config.ambangDendaBlokir || 10000);

  // Return calculation for selected loan in return mode
  const getReturnFineCalculation = (targetLoan: Peminjaman | null) => {
    if (!targetLoan) return { daysLate: 0, fine: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(targetLoan.tgl_kembali);
    due.setHours(0, 0, 0, 0);
    const diff = today.getTime() - due.getTime();
    const daysLate = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    let fine = daysLate * (config.dendaPerHari || 500);
    if (returnCondition === 'Rusak') fine += 15000;
    if (returnCondition === 'Hilang') fine += 75000;
    return { daysLate, fine: returnWaiveFine ? 0 : fine };
  };
  const returnFineCalc = getReturnFineCalculation(returnSelectedLoan);

  // Filter for Online Riwayat ACC view
  const pendingList = peminjaman.filter((p) => p.status === 'MENUNGGU_ACC' || p.status === 'PENDING');
  const dipinjamList = peminjaman.filter((p) => p.status === 'DIPINJAM');
  const kembaliList = peminjaman.filter((p) => p.status === 'MENUNGGU_KEMBALI' || p.status === 'KEMBALI');
  const selesaiList = peminjaman.filter((p) => p.status === 'DIKEMBALIKAN' || p.status === 'SELESAI' || p.status === 'DITOLAK');

  return (
    <div 
      className="pustakascan-circulation-page"
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '20px 24px 60px',
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      {/* HARD ERROR OVERLAY (PRD §3.1 & §9.1: Full screen banner on rejection) */}
      {hardError && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            width: '90%',
            maxWidth: '680px',
            background: 'var(--apple-danger-fill)',
            color: '#ffffff',
            borderRadius: 'var(--apple-radius-lg)',
            padding: '18px 24px',
            boxShadow: '0 20px 40px rgba(255, 59, 48, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
            }}
          >
            <i className="bx bx-error" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TRANSAKSI DITOLAK
            </div>
            <div style={{ fontSize: '14px', marginTop: '2px', fontWeight: 500, lineHeight: 1.4 }}>
              {hardError}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setHardError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <i className="bx bx-x" />
          </button>
        </div>
      )}

      {/* SUCCESS NOTIFICATION */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            width: '90%',
            maxWidth: '560px',
            background: 'var(--apple-success-fill)',
            color: '#ffffff',
            borderRadius: 'var(--apple-radius-pill)',
            padding: '12px 24px',
            boxShadow: '0 10px 25px rgba(52, 199, 89, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: 600,
            fontSize: '14px',
            animation: 'slideDown 0.25s ease',
          }}
        >
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }} />
          <span>{feedback}</span>
        </div>
      )}

      {/* TOP BAR: BRANDING + APPLE SEGMENTED CONTROL + ACTIONS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--apple-border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#34c759',
                display: 'inline-block',
                boxShadow: '0 0 8px rgba(52, 199, 89, 0.6)',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PustakaScan &bull; Kasir Sirkulasi Cepat
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)', margin: '4px 0 0' }}>
            Mode Kasir Sirkulasi
          </h1>
        </div>

        {/* Apple Segmented Control: Mode Kasir vs Riwayat/Online */}
        <div className="apple-segmented-control">
          <button
            type="button"
            className={`apple-segment-btn ${viewMode === 'kasir' ? 'active' : ''}`}
            onClick={() => setViewMode('kasir')}
          >
            <i className="bx bx-barcode" />
            <span>⚡ Mode Kasir Cepat</span>
          </button>
          <button
            type="button"
            className={`apple-segment-btn ${viewMode === 'riwayat' ? 'active' : ''}`}
            onClick={() => setViewMode('riwayat')}
          >
            <i className="bx bx-list-check" />
            <span>📋 Riwayat &amp; Pengajuan ACC</span>
            {pendingList.length > 0 && (
              <span
                style={{
                  background: 'var(--apple-danger-fill)',
                  color: '#fff',
                  borderRadius: 'var(--apple-radius-pill)',
                  padding: '1px 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {pendingList.length}
              </span>
            )}
          </button>
        </div>

        {/* Global Hardware & Tool Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="apple-btn-secondary"
            style={{ fontSize: '13px', padding: '6px 14px', minHeight: '34px', color: 'var(--apple-accent)', borderColor: 'rgba(0,113,227,0.3)', background: 'rgba(0,113,227,0.06)' }}
            title="Lihat Panduan Alur Kasir Sirkulasi"
          >
            <i className="bx bx-help-circle" style={{ fontSize: '17px' }} />
            <span>📖 Panduan Alur</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            className="apple-btn-secondary"
            style={{ fontSize: '13px', padding: '6px 12px', minHeight: '34px' }}
            title="Nyalakan/Matikan Suara Beep Kasir"
          >
            <i className={`bx ${soundMuted ? 'bx-volume-mute' : 'bx-volume-full'}`} />
            {soundMuted ? 'Suara Hening' : 'Suara Aktif'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset seluruh data transaksi demo ke kondisi awal yang bersih?')) {
                resetToDemoData();
                setCart([]);
                setSelectedAnggota(null);
                setReturnSelectedLoan(null);
                setFeedback('Data demo perpustakaan telah di-reset ke kondisi awal!');
                setTimeout(() => setFeedback(null), 3000);
              }
            }}
            className="apple-btn-secondary"
            style={{ fontSize: '13px', padding: '6px 12px', minHeight: '34px' }}
            title="Reset data transaksi demo ke kondisi awal"
          >
            <i className="bx bx-reset" /> Reset Demo
          </button>

          <Link
            href="/admin/scanner-test"
            className="apple-btn-secondary"
            style={{ fontSize: '13px', padding: '6px 12px', minHeight: '34px' }}
            title="Diagnostik & Tes Scanner"
          >
            <i className="bx bx-wrench" /> Tes Scanner
          </Link>

          {lastProcessedLoan && (
            <button
              type="button"
              onClick={() => setSlipModalData({ loan: lastProcessedLoan, mode: 'pinjam' })}
              className="apple-btn-secondary"
              style={{ fontSize: '13px', padding: '6px 12px', minHeight: '34px' }}
              title="Cetak ulang slip transaksi terakhir (Ctrl+P)"
            >
              <i className="bx bx-printer" /> Cetak Slip Terakhir
            </button>
          )}
        </div>
      </div>

      {/* PENDING CIRCULATION NOTIFICATION BANNER (Direct response to sidebar notification) */}
      {pendingList.length > 0 && viewMode === 'kasir' && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            padding: '12px 18px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              <i className="bx bx-bell" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e' }}>
                Antrean Sirkulasi Online: Ada {pendingList.length} Pengajuan Menunggu Konfirmasi Petugas
              </div>
              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                Anggota telah mengajukan permohonan peminjaman/pengembalian melalui katalog web.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setViewMode('riwayat');
              setAccTab('pending');
            }}
            className="apple-btn-primary"
            style={{
              background: '#d97706',
              borderColor: '#d97706',
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            Buka Antrean ACC ({pendingList.length}) &rarr;
          </button>
        </div>
      )}

      {viewMode === 'kasir' ? (
        <>
          {/* Circulation Mode Switcher (F1 Pinjam / F2 Kembali) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div className="apple-segmented-control" style={{ padding: '4px' }}>
              <button
                type="button"
                className={`apple-segment-btn ${circulationMode === 'pinjam' ? 'active' : ''}`}
                onClick={() => setCirculationMode('pinjam')}
                style={{ padding: '8px 20px', fontSize: '14px', fontWeight: 600 }}
              >
                <i className="bx bx-log-in-circle" />
                <span>PINJAM BUKU</span>
                <span style={{ fontSize: '11px', opacity: 0.7, fontFamily: 'monospace' }}>[F1]</span>
              </button>
              <button
                type="button"
                className={`apple-segment-btn ${circulationMode === 'kembali' ? 'active' : ''}`}
                onClick={() => setCirculationMode('kembali')}
                style={{ padding: '8px 20px', fontSize: '14px', fontWeight: 600 }}
              >
                <i className="bx bx-log-out-circle" />
                <span>KEMBALI BUKU</span>
                <span style={{ fontSize: '11px', opacity: 0.7, fontFamily: 'monospace' }}>[F2]</span>
              </button>
            </div>

            {/* Quick action buttons corresponding to PRD §3.3 shortcuts */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowManualSearchModal(true)}
                className="apple-btn-secondary"
                style={{ fontSize: '13px', padding: '6px 14px', minHeight: '34px' }}
              >
                <i className="bx bx-search" /> Cari Manual <span style={{ opacity: 0.6, fontFamily: 'monospace' }}>[F3]</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRenewModal(true)}
                className="apple-btn-secondary"
                style={{ fontSize: '13px', padding: '6px 14px', minHeight: '34px' }}
              >
                <i className="bx bx-refresh" /> Perpanjang <span style={{ opacity: 0.6, fontFamily: 'monospace' }}>[F4]</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFineModal(true)}
                className="apple-btn-secondary"
                style={{ fontSize: '13px', padding: '6px 14px', minHeight: '34px' }}
              >
                <i className="bx bx-wallet" /> Bayar Denda <span style={{ opacity: 0.6, fontFamily: 'monospace' }}>[F5]</span>
              </button>
            </div>
          </div>

          {/* 3-STEP PROGRESS STEPPER ALUR SIRKULASI (PRD §3.1 & Kasir Cepat) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: !selectedAnggota ? 'rgba(0, 113, 227, 0.1)' : 'rgba(52, 199, 89, 0.08)',
                border: `1.5px solid ${!selectedAnggota ? 'var(--apple-accent)' : 'rgba(52, 199, 89, 0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: !selectedAnggota ? 'var(--apple-accent)' : '#34c759',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {selectedAnggota ? '✓' : '1'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: !selectedAnggota ? 'var(--apple-accent)' : '#248a3d', letterSpacing: '0.04em' }}>
                  {selectedAnggota ? 'LANGKAH 1 SELESAI' : 'LANGKAH 1 (AKTIF)'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--apple-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedAnggota ? selectedAnggota.nama : 'Scan / Pilih Anggota'}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: selectedAnggota && cart.length === 0 ? 'rgba(0, 113, 227, 0.1)' : cart.length > 0 ? 'rgba(52, 199, 89, 0.08)' : 'rgba(0,0,0,0.03)',
                border: `1.5px solid ${selectedAnggota && cart.length === 0 ? 'var(--apple-accent)' : cart.length > 0 ? 'rgba(52, 199, 89, 0.35)' : 'var(--apple-border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: !selectedAnggota ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: cart.length > 0 ? '#34c759' : selectedAnggota ? 'var(--apple-accent)' : 'rgba(0,0,0,0.15)',
                  color: selectedAnggota || cart.length > 0 ? '#fff' : 'var(--apple-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                {cart.length > 0 ? '✓' : '2'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: cart.length > 0 ? '#248a3d' : selectedAnggota ? 'var(--apple-accent)' : 'var(--apple-text-secondary)', letterSpacing: '0.04em' }}>
                  {cart.length > 0 ? `${cart.length} BUKU DI KERANJANG` : selectedAnggota ? 'LANGKAH 2 (AKTIF)' : 'LANGKAH 2'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--apple-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cart.length > 0 ? `${cart.length} Buku Siap Pinjam` : 'Scan Barcode Buku (PS-...)'}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: cart.length > 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(0,0,0,0.03)',
                border: `1.5px solid ${cart.length > 0 ? '#34c759' : 'var(--apple-border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                opacity: cart.length === 0 ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: cart.length > 0 ? '#34c759' : 'rgba(0,0,0,0.15)',
                  color: cart.length > 0 ? '#fff' : 'var(--apple-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  flexShrink: 0,
                }}
              >
                3
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700, color: cart.length > 0 ? '#248a3d' : 'var(--apple-text-secondary)', letterSpacing: '0.04em' }}>
                  {cart.length > 0 ? 'LANGKAH 3 (SIAP SELESAI)' : 'LANGKAH 3'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>
                  Tekan Enter &amp; Cetak Struk 🧾
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE SCANNER INPUT BAR (Always active, auto-focused) */}
          <div
            className="apple-card"
            style={{
              marginBottom: '16px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              border: flashScreen === 'green' ? '2px solid #34c759' : flashScreen === 'red' ? '2px solid #ff3b30' : '1px solid var(--apple-border)',
              background: flashScreen === 'red' ? 'rgba(255, 59, 48, 0.06)' : 'var(--apple-bg-surface)',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Status indicator pulse */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--apple-radius-pill)',
                background: 'rgba(52, 199, 89, 0.12)',
                color: 'var(--apple-success-text)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#34c759',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              SIAP SCAN
            </div>

            <form onSubmit={handleManualScanSubmit} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '8px' }}>
              <i className="bx bx-barcode-reader" style={{ fontSize: '24px', color: 'var(--apple-text-secondary)' }} />
              <input
                ref={scanInputRef}
                type="text"
                value={scanInputVal}
                onChange={(e) => setScanInputVal(e.target.value)}
                placeholder={
                  circulationMode === 'pinjam'
                    ? !selectedAnggota
                      ? 'Langkah 1: Scan KARTU ANGGOTA (Prefix AG-) atau ketik nomor...'
                      : 'Langkah 2: Scan BARCODE BUKU (Prefix PS-) atau ISBN...'
                    : 'Scan BARCODE BUKU yang akan dikembalikan (Prefix PS- atau ISBN)...'
                }
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: 'var(--apple-text-primary)',
                  fontFamily: 'monospace',
                }}
              />
              {scanInputVal && (
                <button
                  type="submit"
                  className="apple-btn-primary"
                  style={{ fontSize: '13px', padding: '6px 16px', minHeight: '34px' }}
                >
                  Enter
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="apple-btn-primary"
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  padding: '10px 22px',
                  minHeight: '46px',
                  gap: '8px',
                  flexShrink: 0,
                  borderRadius: '12px',
                  background: 'var(--apple-accent)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(0, 113, 227, 0.28)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Buka Kamera Barcode Scanner Laptop / Webcam"
              >
                <i className="bx bx-barcode-reader" style={{ fontSize: '22px' }} />
                <span>Scan Barcode</span>
              </button>
            </form>
          </div>

          {/* INTERACTIVE STEP-BY-STEP GUIDANCE & 1-CLICK SIMULATOR (Tanpa Scanner Fisik) */}
          <div
            className="apple-card"
            style={{
              marginBottom: '24px',
              padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.04) 0%, rgba(52, 199, 89, 0.04) 100%)',
              border: '1px solid rgba(0, 113, 227, 0.15)',
              borderRadius: '16px',
            }}
          >
            {circulationMode === 'pinjam' ? (
              <>
                {!selectedAnggota ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--apple-accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                        1
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--apple-text-primary)' }}>
                        Langkah 1: Belum punya scanner fisik? Klik salah satu kartu anggota demo di bawah ini:
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('AG-20260184')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff', borderColor: 'var(--apple-accent)', color: 'var(--apple-accent)', fontWeight: 600 }}
                        title="Klik untuk memilih siswa Muhammad Aditya Saputra"
                      >
                        <span>👤</span> AG-20260184 (Aditya - Siswa Bebas Denda)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('AG-20260001')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff' }}
                        title="Klik untuk memilih Guru Administrator Utama"
                      >
                        <span>👤</span> AG-20260001 (Admin - Guru, Kuota 5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('AG-20260205')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff', borderColor: '#ff9500', color: '#b25900' }}
                        title="Klik untuk memilih Siti Rahmawati yang memiliki denda"
                      >
                        <span>⚠️</span> AG-20260205 (Siti - Ada Denda Rp2.500)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('AG-20260099')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff' }}
                        title="Klik untuk memilih Hendra Wijaya"
                      >
                        <span>👤</span> AG-20260099 (Hendra - Anggota Umum)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#34c759', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                          ✓
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>
                          Anggota Aktif: {selectedAnggota.nama} ({selectedAnggota.nomor_anggota})
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>
                          • Sisa Kuota: <strong>{remainingQuota} buku</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnggota(null);
                          setCart([]);
                        }}
                        style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '2px 6px' }}
                      >
                        ✖ Ganti Anggota
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--apple-accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                        2
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--apple-text-primary)' }}>
                        Langkah 2: Klik buku koleksi di bawah untuk memasukkan ke keranjang kasir:
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: cart.length > 0 ? '12px' : '0' }}>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('PS-2600001')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff', borderColor: 'var(--apple-accent)' }}
                      >
                        <span>📖</span> + Belajar Web Modern (PS-2600001)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('PS-2600002')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff', borderColor: 'var(--apple-accent)' }}
                      >
                        <span>📖</span> + Clean Code (PS-2600002)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('PS-2600003')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff' }}
                      >
                        <span>📖</span> + Microservices Go (PS-2600003)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('PS-2600042')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff' }}
                      >
                        <span>📖</span> + Laskar Pelangi (PS-2600042)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessBarcode('PS-2600081')}
                        className="apple-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff' }}
                      >
                        <span>📖</span> + Bumi Manusia (PS-2600081)
                      </button>
                    </div>

                    {/* Step 3 CTA Button if Cart has items */}
                    {cart.length > 0 && (
                      <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#34c759', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                            3
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-text-primary)' }}>
                            {cart.length} buku siap dipinjam. Klik tombol hijau untuk mencetak struk kasir thermal:
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleFinishLoanTransaction}
                          className="apple-btn-primary"
                          style={{ background: '#34c759', padding: '8px 20px', fontSize: '13px', fontWeight: 700, gap: '6px' }}
                        >
                          <i className="bx bx-receipt" style={{ fontSize: '18px' }} />
                          <span>PROSES PINJAM &amp; CETAK STRUK (Enter / F12) ➔</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--apple-accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    🔄
                  </span>
                  <strong style={{ fontSize: '13px', color: 'var(--apple-text-primary)' }}>
                    Alur Pengembalian: Scan barcode buku yang dikembalikan, atau klik transaksi aktif di bawah untuk pengembalian otomatis:
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleProcessBarcode('PS-2600099')}
                    className="apple-btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff', borderColor: '#ff9500', color: '#b25900' }}
                    title="Buku Siti yang terlambat (akan menghitung denda otomatis)"
                  >
                    <span>⚠️</span> Kembalikan Buku Siti: PS-2600099 (Terlambat)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcessBarcode('PS-2600002')}
                    className="apple-btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff', borderColor: '#ff9500', color: '#b25900' }}
                    title="Buku Clean Code Aditya yang terlambat"
                  >
                    <span>⚠️</span> Kembalikan Buku Aditya: Clean Code (PS-2600002 - Terlambat)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcessBarcode('PS-2600001')}
                    className="apple-btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', background: '#ffffff', borderColor: '#34c759', color: '#248a3d' }}
                    title="Buku Web Modern Aditya yang tepat waktu"
                  >
                    <span>✓</span> Kembalikan Buku Aditya: Web Modern (PS-2600001 - Tepat Waktu)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3-COLUMN LAYOUT MODE KASIR (PRD §9) */}
          {circulationMode === 'pinjam' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '300px minmax(0, 1fr) 280px',
                gap: '20px',
                alignItems: 'start',
              }}
              className="cashier-three-column-grid"
            >
              {/* KOLOM 1: IDENTITAS ANGGOTA (PRD §9) */}
              <div className="apple-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--apple-accent)' }}>
                      PANEL 1 &bull; IDENTITAS ANGGOTA
                    </span>
                    <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                      Langkah 1: Identifikasi Peminjam
                    </div>
                  </div>
                  {selectedAnggota && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnggota(null);
                        setCart([]);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        color: 'var(--apple-danger-text)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Lepas [Esc]
                    </button>
                  )}
                </div>

                {selectedAnggota ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: '50%',
                          margin: '0 auto 12px',
                          overflow: 'hidden',
                          border: '3px solid #ffffff',
                          boxShadow: 'var(--apple-shadow-md)',
                          background: 'rgba(0,0,0,0.05)',
                        }}
                      >
                        <img
                          src={selectedAnggota.foto || '/profile-default.svg'}
                          alt={selectedAnggota.nama}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Nama Anggota 32px bold (PRD §9.1) */}
                      <h2
                        style={{
                          fontSize: '24px',
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          color: 'var(--apple-text-primary)',
                          margin: '0 0 4px',
                          lineHeight: 1.2,
                        }}
                      >
                        {selectedAnggota.nama}
                      </h2>

                      <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', color: 'var(--apple-text-secondary)' }}>
                        {selectedAnggota.nomor_anggota || `AG-${selectedAnggota.id_anggota}`}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--apple-radius-pill)',
                            background: 'rgba(0, 113, 227, 0.1)',
                            color: 'var(--apple-accent)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {selectedAnggota.tipe_anggota || 'Siswa'}
                        </span>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--apple-radius-pill)',
                            background: selectedAnggota.status_keanggotaan === 'active' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                            color: selectedAnggota.status_keanggotaan === 'active' ? 'var(--apple-success-text)' : 'var(--apple-danger-text)',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {selectedAnggota.status_keanggotaan === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--apple-border)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--apple-text-secondary)' }}>Sisa Kuota:</span>
                        <span style={{ fontWeight: 700, color: remainingQuota > 0 ? 'var(--apple-success-text)' : 'var(--apple-danger-text)' }}>
                          {remainingQuota} / {memberMaxQuota} buku
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--apple-text-secondary)' }}>Denda Tertunggak:</span>
                        <span style={{ fontWeight: 700, color: hasUnpaidFine ? 'var(--apple-danger-text)' : 'var(--apple-text-primary)' }}>
                          Rp{(selectedAnggota.denda_tertunggak || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--apple-text-secondary)' }}>Masa Berlaku:</span>
                        <span style={{ fontWeight: 500, color: 'var(--apple-text-primary)' }}>
                          {selectedAnggota.masa_berlaku || 'Aktif'}
                        </span>
                      </div>
                    </div>

                    {isFineBlocked && (
                      <div
                        style={{
                          marginTop: '14px',
                          padding: '10px 12px',
                          borderRadius: 'var(--apple-radius-sm)',
                          background: 'rgba(255, 59, 48, 0.1)',
                          border: '1px solid rgba(255, 59, 48, 0.25)',
                          color: 'var(--apple-danger-text)',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ Denda &ge; ambang batas! Lunasi denda terlebih dahulu (F5).
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px 8px', color: 'var(--apple-text-tertiary)' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        fontSize: '32px',
                      }}
                    >
                      <i className="bx bx-user" />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--apple-text-primary)' }}>
                      Belum Ada Anggota
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      Scan kartu anggota fisik (Prefix <code>AG-</code>) atau klik salah satu kartu demo di bawah.
                    </div>

                    {/* Quick Member Pick Demo */}
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {anggota.slice(0, 3).map((a) => (
                        <button
                          key={a.id_anggota}
                          type="button"
                          onClick={() => {
                            setSelectedAnggota(a);
                            playMemberScanBeep();
                          }}
                          className="apple-btn-secondary"
                          style={{
                            justifyContent: 'flex-start',
                            padding: '8px 12px',
                            fontSize: '12px',
                            minHeight: 'auto',
                          }}
                        >
                          <i className="bx bx-id-card" />
                          <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{a.nama}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--apple-text-tertiary)' }}>
                              {a.nomor_anggota || `AG-${a.id_anggota}`} &bull; {a.tipe_anggota || 'Siswa'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KOLOM 2: KERANJANG SCAN BUKU (PRD §9) */}
              <div className="apple-card" style={{ padding: '24px', minHeight: '440px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--apple-accent)' }}>
                      PANEL 2 &bull; KERANJANG TRANSAKSI SCAN ({cart.length} ITEM)
                    </span>
                    <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                      Langkah 2: Scan / Masukkan Barcode Buku
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--apple-danger-text)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Kosongkan Keranjang
                    </button>
                  )}
                </div>

                {/* Items List */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--apple-text-tertiary)' }}>
                      <i className="bx bx-barcode-reader" style={{ fontSize: '48px', marginBottom: '8px', display: 'block', opacity: 0.4 }} />
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--apple-text-primary)' }}>
                        Keranjang Belanja Masih Kosong
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        Tembakkan scanner pada barcode buku (<code>PS-...</code>) secara beruntun.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {cart.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            minHeight: '56px', // Tinggi baris >= 56px (PRD §9.1)
                            borderRadius: 'var(--apple-radius-md)',
                            background: 'rgba(0,0,0,0.02)',
                            border: '1px solid var(--apple-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--apple-accent)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '13px',
                              }}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              {/* Judul buku 20px (PRD §9.1) */}
                              <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--apple-text-primary)', lineHeight: 1.3 }}>
                                {item.buku.judul}
                              </div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                                <span style={{ fontFamily: 'monospace' }}>Barcode: {item.barcode}</span>
                                <span>Rak: {item.buku.lokasi_rak || item.buku.id_katalog || 'Umum'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--apple-text-tertiary)' }}>{item.addedAt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--apple-danger-text)',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: 'var(--apple-radius-sm)',
                              }}
                              title="Hapus baris ini"
                            >
                              <i className="bx bx-trash" style={{ fontSize: '18px' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BIG SELESAI BUTTON (PRD §9) */}
                <button
                  type="button"
                  onClick={handleFinishLoanTransaction}
                  disabled={!selectedAnggota || cart.length === 0 || isFineBlocked}
                  className="apple-btn-primary"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: 700,
                    borderRadius: 'var(--apple-radius-md)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: 'var(--apple-shadow-lg)',
                  }}
                >
                  <span>SELESAI TRANSAKSI</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '15px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                    ↵ Enter
                  </span>
                </button>
              </div>

              {/* KOLOM 3: STATUS & RINGKASAN (PRD §9) */}
              <div className="apple-card" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--apple-accent)' }}>
                    PANEL 3 &bull; STATUS &amp; STRUK KASIR
                  </span>
                  <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                    Langkah 3: Konfirmasi Tanggal &amp; Cetak Struk
                  </div>
                </div>

                {/* Counter Item Jumbo 48px (PRD §9.1) */}
                <div style={{ marginBottom: '24px', textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--apple-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginBottom: '4px' }}>
                    Total Buku Ter-scan
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--apple-accent)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                    {cart.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--apple-text-tertiary)', marginTop: '4px' }}>
                    eksemplar dalam antrean
                  </div>
                </div>

                {/* Tanggal & Due Date */}
                <div style={{ marginBottom: '20px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--apple-text-secondary)' }}>Tgl Pinjam:</span>
                    <span style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>
                      {new Date().toISOString().split('T')[0]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--apple-text-secondary)' }}>Estimasi Tempo:</span>
                    <span style={{ fontWeight: 700, color: 'var(--apple-accent)' }}>
                      {(() => {
                        const d = new Date();
                        const dur = selectedAnggota?.tipe_anggota === 'Guru' ? 14 : config.maxLamaPinjam || 7;
                        d.setDate(d.getDate() + dur);
                        return d.toISOString().split('T')[0];
                      })()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--apple-text-secondary)' }}>Status Jaringan:</span>
                    <span style={{ fontWeight: 600, color: 'var(--apple-success-text)' }}>🟢 Online</span>
                  </div>
                </div>

                {/* Keyboard Shortcut Cheat Sheet (PRD §3.3) */}
                <div style={{ borderTop: '1px solid var(--apple-border)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--apple-text-secondary)', marginBottom: '10px' }}>
                    Tombol Pintasan (Shortcut)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-text-secondary)' }}>Mode Pinjam:</span>
                      <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontFamily: 'monospace' }}>F1</kbd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-text-secondary)' }}>Mode Kembali:</span>
                      <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontFamily: 'monospace' }}>F2</kbd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-text-secondary)' }}>Cari Manual:</span>
                      <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontFamily: 'monospace' }}>F3</kbd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-text-secondary)' }}>Perpanjang:</span>
                      <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontFamily: 'monospace' }}>F4</kbd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-text-secondary)' }}>Bayar Denda:</span>
                      <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontFamily: 'monospace' }}>F5</kbd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-text-secondary)' }}>Hapus Baris:</span>
                      <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontFamily: 'monospace' }}>Delete</kbd>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--apple-text-secondary)' }}>Reset Transaksi:</span>
                      <kbd style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', fontFamily: 'monospace' }}>Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MODE KASIR PENGEMBALIAN BUKU (F2) */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                gap: '20px',
                alignItems: 'start',
              }}
            >
              {/* Return Active Scan Panel */}
              <div className="apple-card" style={{ padding: '24px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', display: 'block', marginBottom: '16px' }}>
                  PEMERIKSAAN PENGEMBALIAN BUKU
                </span>

                {returnSelectedLoan ? (
                  <div>
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--apple-radius-md)',
                        background: 'rgba(0, 113, 227, 0.04)',
                        border: '1px solid rgba(0, 113, 227, 0.15)',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--apple-accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        TRANSAKSI DITEMUKAN &bull; {returnSelectedLoan.nomor_transaksi || `TRX-${returnSelectedLoan.id_pinjam}`}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--apple-text-primary)', marginBottom: '6px' }}>
                        {returnSelectedLoan.details?.[0]?.buku?.judul || 'Buku Perpustakaan'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--apple-text-secondary)' }}>
                        <span>Peminjam: <strong>{returnSelectedLoan.anggota?.nama || 'Anggota'}</strong></span>
                        <span>Tgl Pinjam: {returnSelectedLoan.tgl_pinjam}</span>
                        <span>Jatuh Tempo: <strong>{returnSelectedLoan.tgl_kembali}</strong></span>
                      </div>
                    </div>

                    {/* Return Conditions & Fine */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px' }}>
                          Kondisi Buku Saat Kembali:
                        </label>
                        <select
                          value={returnCondition}
                          onChange={(e) => setReturnCondition(e.target.value as 'Baik' | 'Rusak' | 'Hilang')}
                          className="apple-search-input"
                          style={{ width: '100%', padding: '8px 12px' }}
                        >
                          <option value="Baik">Baik (Normal)</option>
                          <option value="Rusak">Rusak (+Rp15.000)</option>
                          <option value="Hilang">Hilang (+Rp75.000)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px' }}>
                          Kebijakan Denda:
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 0', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={returnWaiveFine}
                            onChange={(e) => setReturnWaiveFine(e.target.checked)}
                          />
                          <span>Bebaskan Denda (Kebijakan Kepala)</span>
                        </label>
                      </div>
                    </div>

                    {/* Fine Calculation Banner */}
                    <div
                      style={{
                        padding: '16px 20px',
                        borderRadius: 'var(--apple-radius-md)',
                        background: returnFineCalc.fine > 0 ? 'rgba(255, 59, 48, 0.08)' : 'rgba(52, 199, 89, 0.08)',
                        border: returnFineCalc.fine > 0 ? '1px solid rgba(255, 59, 48, 0.25)' : '1px solid rgba(52, 199, 89, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: returnFineCalc.fine > 0 ? 'var(--apple-danger-text)' : 'var(--apple-success-text)' }}>
                          {returnFineCalc.daysLate > 0 ? `TERLAMBAT ${returnFineCalc.daysLate} HARI` : 'PENGEMBALIAN TEPAT WAKTU'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                          {returnCondition !== 'Baik' ? `Termasuk biaya penggantian kondisi (${returnCondition})` : 'Sesuai tarif denda harian'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: returnFineCalc.fine > 0 ? 'var(--apple-danger-text)' : 'var(--apple-success-text)' }}>
                          Rp{returnFineCalc.fine.toLocaleString('id-ID')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>
                          {returnWaiveFine ? '(Dibebaskan)' : 'Wajib diselesaikan'}
                        </div>
                      </div>
                    </div>

                    {/* Return Action Button */}
                    <button
                      type="button"
                      onClick={handleFinishReturnTransaction}
                      className="apple-btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '16px',
                        fontWeight: 700,
                        borderRadius: 'var(--apple-radius-md)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i className="bx bx-check-circle" style={{ fontSize: '20px' }} />
                      <span>PROSES PENGEMBALIAN &amp; CETAK BUKTI</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--apple-text-tertiary)' }}>
                    <i className="bx bx-barcode" style={{ fontSize: '48px', marginBottom: '8px', display: 'block', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--apple-text-primary)' }}>
                      Scan Barcode Buku yang Dikembalikan
                    </div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                      Sistem akan mencocokkan barcode dengan peminjam aktif secara otomatis.
                    </div>
                  </div>
                )}
              </div>

              {/* Active Loans Quick Lookup Panel */}
              <div className="apple-card" style={{ padding: '24px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', display: 'block', marginBottom: '16px' }}>
                  DAFTAR PINJAMAN AKTIF ({dipinjamList.length})
                </span>

                <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dipinjamList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--apple-text-tertiary)', fontSize: '13px' }}>
                      Tidak ada buku yang sedang dipinjam saat ini.
                    </div>
                  ) : (
                    dipinjamList.map((loan) => (
                      <button
                        key={loan.id_pinjam}
                        type="button"
                        onClick={() => {
                          setReturnSelectedLoan(loan);
                          setReturnBarcodeVal(loan.details?.[0]?.barcode_eksemplar || loan.details?.[0]?.isbn || '');
                          playItemScanBeep();
                        }}
                        className="apple-btn-secondary"
                        style={{
                          justifyContent: 'flex-start',
                          padding: '10px 14px',
                          fontSize: '12.5px',
                          textAlign: 'left',
                          minHeight: 'auto',
                        }}
                      >
                        <i className="bx bx-book" style={{ fontSize: '18px', color: 'var(--apple-accent)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>
                            {loan.details?.[0]?.buku?.judul || 'Buku'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                            {loan.anggota?.nama} &bull; Tempo: {loan.tgl_kembali}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* TAB 2: RIWAYAT & PENGAJUAN ACC ONLINE */
        <div className="apple-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="apple-segmented-control">
              <button
                type="button"
                className={`apple-segment-btn ${accTab === 'pending' ? 'active' : ''}`}
                onClick={() => setAccTab('pending')}
              >
                <span>Menunggu ACC ({pendingList.length})</span>
              </button>
              <button
                type="button"
                className={`apple-segment-btn ${accTab === 'dipinjam' ? 'active' : ''}`}
                onClick={() => setAccTab('dipinjam')}
              >
                <span>Sedang Dipinjam ({dipinjamList.length})</span>
              </button>
              <button
                type="button"
                className={`apple-segment-btn ${accTab === 'kembali' ? 'active' : ''}`}
                onClick={() => setAccTab('kembali')}
              >
                <span>Menunggu Kembali ({kembaliList.length})</span>
              </button>
              <button
                type="button"
                className={`apple-segment-btn ${accTab === 'selesai' ? 'active' : ''}`}
                onClick={() => setAccTab('selesai')}
              >
                <span>Riwayat Selesai ({selesaiList.length})</span>
              </button>
            </div>
          </div>

          {/* Table List */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--apple-border)', color: 'var(--apple-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>No. Transaksi</th>
                  <th style={{ padding: '10px 12px' }}>Anggota</th>
                  <th style={{ padding: '10px 12px' }}>Judul Buku</th>
                  <th style={{ padding: '10px 12px' }}>Tgl Pinjam</th>
                  <th style={{ padding: '10px 12px' }}>Jatuh Tempo</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(accTab === 'pending'
                  ? pendingList
                  : accTab === 'dipinjam'
                  ? dipinjamList
                  : accTab === 'kembali'
                  ? kembaliList
                  : selesaiList
                ).map((item) => (
                  <tr key={item.id_pinjam} style={{ borderBottom: '1px solid var(--apple-border-subtle)' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {item.nomor_transaksi || `TRX-${item.id_pinjam}`}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{item.anggota?.nama || 'Anggota'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--apple-text-secondary)' }}>
                        {item.anggota?.nomor_anggota || `AG-${item.id_anggota}`}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 500 }}>{item.details?.[0]?.buku?.judul || 'Buku'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>
                        Barcode: {item.details?.[0]?.barcode_eksemplar || item.details?.[0]?.isbn}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{item.tgl_pinjam}</td>
                    <td style={{ padding: '12px' }}>{item.tgl_kembali}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--apple-radius-pill)',
                          fontSize: '11px',
                          fontWeight: 600,
                          background:
                            item.status === 'DIPINJAM'
                              ? 'rgba(0, 113, 227, 0.1)'
                              : item.status === 'DIKEMBALIKAN'
                              ? 'rgba(52, 199, 89, 0.1)'
                              : 'rgba(255, 149, 0, 0.1)',
                          color:
                            item.status === 'DIPINJAM'
                              ? 'var(--apple-accent)'
                              : item.status === 'DIKEMBALIKAN'
                              ? 'var(--apple-success-text)'
                              : 'var(--apple-warning-text)',
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {accTab === 'pending' && (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => accPinjam(item.id_pinjam)}
                            className="apple-btn-primary"
                            style={{ padding: '4px 10px', fontSize: '12px', minHeight: '28px' }}
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => tolakPinjam(item.id_pinjam)}
                            className="apple-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px', minHeight: '28px' }}
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                      {accTab === 'kembali' && (
                        <button
                          type="button"
                          onClick={() => accKembali(item.id_pinjam, 0)}
                          className="apple-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '12px', minHeight: '28px' }}
                        >
                          ACC Kembali
                        </button>
                      )}
                      {(accTab === 'dipinjam' || accTab === 'selesai') && (
                        <button
                          type="button"
                          onClick={() => setSlipModalData({ loan: item, mode: accTab === 'selesai' ? 'kembali' : 'pinjam' })}
                          className="apple-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', minHeight: '28px' }}
                        >
                          Slip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* THERMAL SLIP MODAL (PRD §17.3) */}
      {slipModalData && (
        <ThermalSlipModal
          loan={slipModalData.loan}
          mode={slipModalData.mode}
          libraryName={config.namaPerpustakaan || 'PUSTAKASCAN DIGITAL'}
          libraryAddress={config.alamatPerpustakaan || 'Jl. Soekarno-Hatta No. 10'}
          officerName="Petugas Kasir"
          onClose={() => setSlipModalData(null)}
        />
      )}

      {/* MODAL CARI MANUAL (F3 - PRD §3.3) */}
      {showManualSearchModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManualSearchModal(false);
          }}
        >
          <div className="apple-card" style={{ maxWidth: '580px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bx bx-search" style={{ fontSize: '22px', color: 'var(--apple-accent)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Cari Manual [F3]</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualSearchModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="bx bx-x" />
              </button>
            </div>

            <input
              type="text"
              data-ignore-scanner="true"
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              placeholder="Ketik judul buku, nama pengarang, atau nama anggota..."
              className="apple-search-input"
              style={{ width: '100%', padding: '10px 16px', fontSize: '14px', marginBottom: '16px' }}
              autoFocus
            />

            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {manualSearchQuery ? (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--apple-text-secondary)', textTransform: 'uppercase' }}>
                    Hasil Pencarian Buku:
                  </div>
                  {buku
                    .filter(
                      (b) =>
                        b.judul.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                        b.isbn.toLowerCase().includes(manualSearchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((b) => (
                      <div
                        key={b.isbn}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderRadius: 'var(--apple-radius-sm)',
                          background: 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.judul}</div>
                          <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)', fontFamily: 'monospace' }}>
                            {b.barcode_eksemplar || b.isbn} &bull; Stok: {b.qty_stok}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleProcessBarcode(b.barcode_eksemplar || b.isbn);
                            setShowManualSearchModal(false);
                            setManualSearchQuery('');
                          }}
                          className="apple-btn-primary"
                          style={{ padding: '4px 12px', fontSize: '12px', minHeight: '28px' }}
                        >
                          + Pilih Buku
                        </button>
                      </div>
                    ))}

                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--apple-text-secondary)', textTransform: 'uppercase', marginTop: '12px' }}>
                    Hasil Pencarian Anggota:
                  </div>
                  {anggota
                    .filter(
                      (a) =>
                        a.nama.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                        (a.nomor_anggota && a.nomor_anggota.toLowerCase().includes(manualSearchQuery.toLowerCase()))
                    )
                    .slice(0, 3)
                    .map((a) => (
                      <div
                        key={a.id_anggota}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderRadius: 'var(--apple-radius-sm)',
                          background: 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{a.nama}</div>
                          <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>
                            {a.nomor_anggota || `AG-${a.id_anggota}`} &bull; {a.tipe_anggota || 'Siswa'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAnggota(a);
                            playMemberScanBeep();
                            setShowManualSearchModal(false);
                            setManualSearchQuery('');
                          }}
                          className="apple-btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '12px', minHeight: '28px' }}
                        >
                          Pilih Anggota
                        </button>
                      </div>
                    ))}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--apple-text-tertiary)', fontSize: '13px' }}>
                  Ketik kata kunci untuk mencari buku atau anggota perpustakaan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERPANJANG PINJAMAN (F4 - PRD §3.3 & §12.6) */}
      {showRenewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRenewModal(false);
          }}
        >
          <div className="apple-card" style={{ maxWidth: '540px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bx bx-refresh" style={{ fontSize: '22px', color: 'var(--apple-accent)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Perpanjang Pinjaman [F4]</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="bx bx-x" />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
              Perpanjangan menambah durasi {config.maxLamaPinjam || 7} hari dari hari ini (Maksimal 1x untuk siswa, 2x untuk guru).
            </p>

            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dipinjamList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--apple-text-tertiary)', fontSize: '13px' }}>
                  Tidak ada transaksi pinjaman aktif yang dapat diperpanjang.
                </div>
              ) : (
                dipinjamList.map((loan) => (
                  <div
                    key={loan.id_pinjam}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: 'var(--apple-radius-sm)',
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px solid var(--apple-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{loan.details?.[0]?.buku?.judul || 'Buku'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                        Peminjam: {loan.anggota?.nama} &bull; Tempo: {loan.tgl_kembali} (Renew: {loan.renewal_count || 0}x)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await renewLoan(loan.id_pinjam);
                        if (res.success) {
                          playTransactionSuccessSound();
                          setFeedback(res.message);
                          setShowRenewModal(false);
                          setTimeout(() => setFeedback(null), 3000);
                        } else {
                          showHardError(res.message);
                        }
                      }}
                      className="apple-btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', minHeight: '30px' }}
                    >
                      Perpanjang
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL BAYAR / BEBASKAN DENDA (F5 - PRD §3.3 & §F6) */}
      {showFineModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFineModal(false);
          }}
        >
          <div className="apple-card" style={{ maxWidth: '500px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bx bx-wallet" style={{ fontSize: '22px', color: 'var(--apple-accent)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Pembayaran &amp; Pembebasan Denda [F5]</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFineModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                <i className="bx bx-x" />
              </button>
            </div>

            {selectedAnggota ? (
              <div>
                <div style={{ padding: '12px 16px', borderRadius: 'var(--apple-radius-sm)', background: 'rgba(0,0,0,0.03)', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedAnggota.nama}</div>
                  <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>
                    {selectedAnggota.nomor_anggota || `AG-${selectedAnggota.id_anggota}`} &bull; Denda Tertunggak:{' '}
                    <strong style={{ color: 'var(--apple-danger-text)' }}>
                      Rp{(selectedAnggota.denda_tertunggak || 0).toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px' }}>
                    Nominal Pembayaran Tunai (Rp):
                  </label>
                  <input
                    type="number"
                    data-ignore-scanner="true"
                    step="500"
                    min="0"
                    value={finePayAmount || selectedAnggota.denda_tertunggak || 0}
                    onChange={(e) => setFinePayAmount(Number(e.target.value))}
                    className="apple-search-input"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '15px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const amt = finePayAmount || selectedAnggota.denda_tertunggak || 0;
                      if (amt <= 0) return;
                      const res = await payMemberFine(selectedAnggota.id_anggota, amt);
                      if (res.success) {
                        playTransactionSuccessSound();
                        setFeedback(`${res.message} Kuitansi: ${res.receiptNo}`);
                        setShowFineModal(false);
                        setTimeout(() => setFeedback(null), 4000);
                      }
                    }}
                    className="apple-btn-primary"
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Catat Pembayaran
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const reason = prompt('Masukkan alasan pembebasan denda oleh Kepala Perpustakaan:');
                      if (reason) {
                        const res = await waiveMemberFine(selectedAnggota.id_anggota, reason);
                        if (res.success) {
                          playTransactionSuccessSound();
                          setFeedback(res.message);
                          setShowFineModal(false);
                          setTimeout(() => setFeedback(null), 4000);
                        }
                      }
                    }}
                    className="apple-btn-secondary"
                    style={{ padding: '10px 16px', color: 'var(--apple-danger-text)' }}
                  >
                    Bebaskan Denda
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--apple-text-tertiary)', fontSize: '13px' }}>
                Silakan scan atau pilih anggota terlebih dahulu di Mode Kasir untuk memproses pembayaran denda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CAMERA BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={(scannedCode) => {
          setShowCameraScanner(false);
          handleProcessBarcode(scannedCode);
        }}
        title={
          circulationMode === 'pinjam'
            ? !selectedAnggota
              ? 'Pindai Kartu Anggota (Kamera)'
              : 'Pindai Barcode Buku (Kamera)'
            : 'Pindai Buku yang Dikembalikan (Kamera)'
        }
      />

      {/* PANDUAN ALUR KASIR MODAL */}
      {showGuideModal && (
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
            if (e.target === e.currentTarget) setShowGuideModal(false);
          }}
        >
          <div className="apple-card" style={{ maxWidth: '640px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,113,227,0.12)', color: 'var(--apple-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  <i className="bx bx-book-reader" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                    Panduan Alur Kerja Mode Kasir
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', margin: 0 }}>
                    Sistem sirkulasi kilat ala kasir minimarket (PRD §3.1)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--apple-text-secondary)' }}
              >
                <i className="bx bx-x" />
              </button>
            </div>

            {/* 3 Step Flow Visual */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(0, 113, 227, 0.06)', border: '1px solid rgba(0, 113, 227, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--apple-accent)', fontSize: '14px', marginBottom: '4px' }}>
                  <span>①</span> Langkah 1: Identifikasi Anggota (Prefix AG-)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', lineHeight: 1.5 }}>
                  Arahkan scanner ke barcode kartu KTM mahasiswa / siswa (atau gunakan tombol simulasi jika tidak ada alat scanner). Panel 1 otomatis menampilkan nama, kuota pinjam, dan status denda.
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(0, 113, 227, 0.06)', border: '1px solid rgba(0, 113, 227, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--apple-accent)', fontSize: '14px', marginBottom: '4px' }}>
                  <span>②</span> Langkah 2: Scan Barcode Buku (Prefix PS- / ISBN)
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', lineHeight: 1.5 }}>
                  Scan barcode pada buku yang ingin dipinjam. Buku otomatis ditambahkan ke Keranjang Kasir (Panel 2). Sistem otomatis memvalidasi ketersediaan stok fisik di rak dan koleksi referensi.
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(52, 199, 89, 0.08)', border: '1px solid rgba(52, 199, 89, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#248a3d', fontSize: '14px', marginBottom: '4px' }}>
                  <span>③</span> Langkah 3: Tekan Enter / F12 &amp; Cetak Struk
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', lineHeight: 1.5 }}>
                  Tekan tombol hijau atau Enter/F12. Transaksi peminjaman langsung sah, stok berkurang, dan struk kasir thermal 58mm langsung keluar sebagai bukti sah!
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255, 149, 0, 0.08)', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#b25900', fontSize: '14px', marginBottom: '4px' }}>
                  <span>🔄</span> Alur Pengembalian Buku [F2]
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', lineHeight: 1.5 }}>
                  Ganti ke tab &quot;KEMBALI BUKU&quot; [F2] ➔ Scan barcode buku yang dikembalikan ➔ Sistem otomatis menghitung denda keterlambatan jika melewati batas 7 hari (Rp 500/hari) ➔ Klik Terima Pengembalian.
                </div>
              </div>
            </div>

            {/* Shortcut Keys Table */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', marginBottom: '8px' }}>
                Tombol Pintas Keyboard (Shortcuts Kasir)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ fontWeight: 700 }}>[F1]</code> <span>Mode Pinjam Buku</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ fontWeight: 700 }}>[F2]</code> <span>Mode Kembali Buku</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ fontWeight: 700 }}>[F3]</code> <span>Pencarian Manual</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ fontWeight: 700 }}>[F4]</code> <span>Perpanjang Pinjaman</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ fontWeight: 700 }}>[F5]</code> <span>Bayar / Bebas Denda</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ fontWeight: 700 }}>[Enter / F12]</code> <span>Proses Transaksi</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="apple-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              Saya Mengerti, Mulai Melayani Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
