'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { Peminjaman } from '@/types/database';

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, currentAnggota, isAdmin } = useAuth();
  const { 
    buku, 
    anggota, 
    peminjaman, 
    config, 
    payMemberFine, 
    waiveMemberFine, 
    unblockAnggota 
  } = useData();

  // Role & Permission Guard
  useEffect(() => {
    if (currentUser && currentUser.type !== 'ADM') {
      router.replace('/login');
    }
  }, [currentUser, router]);

  // 2 Menu View State: 'statistik' (Menu 1: Ringkasan Statistik & Panduan) vs 'monitor' (Menu 2: Pantauan Peminjam & Denda)
  const [dashboardView, setDashboardView] = useState<'statistik' | 'monitor'>('statistik');

  // Search & Filter state for Menu 2 (Live Monitor)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE' | 'ON_TIME' | 'BLOCKED'>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync with searchParams from sidebar notification clicks
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const tabParam = searchParams.get('tab');
    if (viewParam === 'monitor') setDashboardView('monitor');
    if (viewParam === 'statistik') setDashboardView('statistik');
    if (tabParam === 'OVERDUE' || tabParam === 'ON_TIME' || tabParam === 'BLOCKED' || tabParam === 'ALL') {
      setActiveTab(tabParam as 'ALL' | 'OVERDUE' | 'ON_TIME' | 'BLOCKED');
    }
  }, [searchParams]);

  // Quick Action Modal states
  const [payingTarget, setPayingTarget] = useState<{ idAnggota: number; nama: string; totalDenda: number } | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [waivingTarget, setWaivingTarget] = useState<{ idAnggota: number; nama: string; totalDenda: number } | null>(null);
  const [waiveReasonInput, setWaiveReasonInput] = useState('Kebijakan Kepala Perpustakaan');

  // Date setup for overdue fine calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const calculateLoanFine = (loan: Peminjaman) => {
    let daysLate = 0;
    let fine = 0;
    if ((loan.status === 'DIPINJAM' || loan.status === 'MENUNGGU_KEMBALI') && loan.tgl_kembali) {
      const due = new Date(loan.tgl_kembali);
      due.setHours(0, 0, 0, 0);
      const diffMs = today.getTime() - due.getTime();
      if (diffMs > 0) {
        daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        fine = daysLate * (config.dendaPerHari || 500);
      }
    }
    return { daysLate, fine, isOverdue: daysLate > 0 };
  };

  // Map active loans with member data and fine details
  const activeLoansList = peminjaman
    .filter((p) => p.status === 'DIPINJAM' || p.status === 'MENUNGGU_KEMBALI')
    .map((p) => {
      const member = anggota.find((a) => a.id_anggota === p.id_anggota) || p.anggota;
      const fineInfo = calculateLoanFine(p);
      const profileUnpaidFine = member?.denda_tertunggak || 0;
      const grandTotalMemberFine = fineInfo.fine + profileUnpaidFine;
      const isHardBlocked = grandTotalMemberFine > 50000 || member?.status_keanggotaan === 'blocked';
      const isSoftBlocked = grandTotalMemberFine > 0 && !isHardBlocked;

      return {
        ...p,
        member,
        ...fineInfo,
        profileUnpaidFine,
        grandTotalMemberFine,
        isHardBlocked,
        isSoftBlocked,
      };
    });

  const overdueLoansList = activeLoansList.filter((l) => l.isOverdue);
  const onTimeLoansList = activeLoansList.filter((l) => !l.isOverdue);
  const blockedLoansList = activeLoansList.filter((l) => l.isHardBlocked);
  const totalActiveFines = activeLoansList.reduce((acc, l) => acc + l.fine, 0);

  // Filtered loans based on activeTab and searchQuery
  const filteredLoans = activeLoansList.filter((item) => {
    if (activeTab === 'OVERDUE' && !item.isOverdue) return false;
    if (activeTab === 'ON_TIME' && item.isOverdue) return false;
    if (activeTab === 'BLOCKED' && !item.isHardBlocked) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = item.member?.nama?.toLowerCase().includes(q);
    const nimMatch = item.member?.nomor_anggota?.toLowerCase().includes(q);
    const trxMatch = item.nomor_transaksi?.toLowerCase().includes(q);
    const bookMatch = item.details?.some(
      (d) =>
        d.buku?.judul?.toLowerCase().includes(q) ||
        d.barcode_eksemplar?.toLowerCase().includes(q) ||
        d.isbn?.toLowerCase().includes(q)
    );
    return nameMatch || nimMatch || trxMatch || bookMatch;
  });

  // Action handlers
  const handlePayFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingTarget || payAmountInput <= 0) return;

    const res = await payMemberFine(payingTarget.idAnggota, payAmountInput);
    if (res.success) {
      setFeedback(`Pembayaran denda untuk ${payingTarget.nama} sebesar Rp ${payAmountInput.toLocaleString('id-ID')} berhasil dicatat! Kwitansi: ${res.receiptNo}`);
      setPayingTarget(null);
      setPayAmountInput(0);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleWaiveFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waivingTarget) return;

    const res = await waiveMemberFine(waivingTarget.idAnggota, waiveReasonInput);
    if (res.success) {
      setFeedback(res.message);
      setWaivingTarget(null);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleUnblockMember = async (idAnggota: number, nama: string) => {
    if (confirm(`Buka blokir keanggotaan untuk ${nama}? Anggota akan dapat meminjam buku kembali jika denda sudah diselesaikan.`)) {
      await unblockAnggota(idAnggota);
      setFeedback(`Blokir keanggotaan untuk ${nama} berhasil dibuka!`);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // General dashboard metrics for Menu 2
  const totalBuku = buku.length;
  const totalStok = buku.reduce((acc, b) => acc + (b.qty_stok || 0), 0);
  const activeLoans = peminjaman.filter((p) => p.status === 'DIPINJAM').length;
  const pendingLoans = peminjaman.filter((p) => p.status === 'MENUNGGU_ACC').length;
  const pendingReturns = peminjaman.filter((p) => p.status === 'MENUNGGU_KEMBALI').length;
  const pendingUsers = anggota.filter((a) => a.status_verifikasi === 'PENDING').length;

  // Chart data
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      value: peminjaman.filter((p) => p.tgl_pinjam?.slice(0, 10) === key).length,
    };
  });
  const chartMax = Math.max(...chartDays.map((day) => day.value), 1);
  const chartPoints = chartDays
    .map((day, index) => `${index * 100 / 6},${100 - (day.value / chartMax) * 82 - 9}`)
    .join(' ');

  return (
    <div className="admin-dashboard-page">
      {/* Toast Feedback */}
      {feedback && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'rgba(29, 29, 31, 0.95)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '14px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <i className="bx bx-check-circle" style={{ color: '#34c759', fontSize: '20px' }} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Pending Registrations Alert */}
      {pendingUsers > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          padding: '14px 18px',
          borderRadius: '16px',
          background: 'rgba(255, 149, 0, 0.08)',
          border: '1px solid rgba(255, 149, 0, 0.25)',
          color: 'var(--apple-text-primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 149, 0, 0.15)',
              color: '#ff9500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              <i className="bx bxs-id-card" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px' }}>
                Terdapat {pendingUsers} Pendaftaran Anggota Baru Menunggu ACC
              </div>
              <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>
                Periksa berkas KTM mahasiswa yang baru mendaftar.
              </div>
            </div>
          </div>
          <Link href="/admin/verifikasi" className="apple-btn-primary" style={{ background: '#ff9500', padding: '7px 14px', fontSize: '12.5px' }}>
            <i className="bx bx-check-shield" /> Periksa KTM
          </Link>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-header-info">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '99px', background: 'rgba(0, 113, 227, 0.1)', color: 'var(--apple-accent)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }}>
            <i className="bx bx-grid-alt" /> DASHBOARD PERPUSTAKAAN
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)' }}>
            Halo, {currentAnggota?.nama || currentUser?.username || 'Administrator'}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
            Pilih menu pantauan sirkulasi denda atau ringkasan statistik di bawah ini.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href="/admin/sirkulasi" className="apple-btn-primary" style={{ padding: '9px 18px', gap: '6px', fontSize: '13px' }}>
            <i className="bx bx-barcode-reader" style={{ fontSize: '17px' }} />
            <span>Mode Kasir Sirkulasi</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🧭 DUA MENU UTAMA DASHBOARD (PILIHAN DUA MENU TERPISAH, TIDAK CAMPUR ADUK) */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          padding: '5px',
          background: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '16px',
          width: 'fit-content',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Menu 1 Switcher: Statistik */}
        <button
          type="button"
          onClick={() => setDashboardView('statistik')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: dashboardView === 'statistik' ? '#ffffff' : 'transparent',
            color: dashboardView === 'statistik' ? 'var(--apple-accent)' : 'var(--apple-text-secondary)',
            boxShadow: dashboardView === 'statistik' ? '0 3px 12px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <i className="bx bx-bar-chart-alt-2" style={{ fontSize: '18px' }} />
          <span>Menu 1: Ringkasan Statistik &amp; Panduan</span>
        </button>

        {/* Menu 2 Switcher: Live Monitor */}
        <button
          type="button"
          onClick={() => setDashboardView('monitor')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: dashboardView === 'monitor' ? '#ffffff' : 'transparent',
            color: dashboardView === 'monitor' ? 'var(--apple-accent)' : 'var(--apple-text-secondary)',
            boxShadow: dashboardView === 'monitor' ? '0 3px 12px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <i className="bx bx-list-check" style={{ fontSize: '18px' }} />
          <span>Menu 2: Pantauan Peminjam &amp; Denda</span>
          {overdueLoansList.length > 0 && (
            <span
              style={{
                background: '#ff3b30',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '99px',
                lineHeight: 1,
              }}
            >
              {overdueLoansList.length} Telat
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🔴 MENU 1: PANTAUAN PEMINJAM BUKU & KETERLAMBATAN REAL-TIME */}
      {/* ========================================================================= */}
      {dashboardView === 'monitor' && (
        <div
          className="apple-card"
          style={{
            padding: '24px 28px',
            marginBottom: '28px',
            border: '1.5px solid rgba(0, 113, 227, 0.18)',
            boxShadow: '0 8px 30px rgba(0, 113, 227, 0.06)',
            background: '#ffffff',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Module Header with Live Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: 'var(--apple-text-primary)', letterSpacing: '-0.02em' }}>
                  Daftar Peminjam Aktif, Keterlambatan &amp; Denda
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '99px',
                    background: 'rgba(52, 199, 89, 0.15)',
                    color: '#248a3d',
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34c759' }} />
                  LIVE MONITOR
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', margin: '4px 0 0' }}>
                Menampilkan mahasiswa yang sedang meminjam buku, deteksi telat, nominal denda (Rp {config.dendaPerHari?.toLocaleString('id-ID')}/hari), dan status blokir akun otomatis.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/admin/sirkulasi" className="apple-btn-secondary" style={{ padding: '7px 14px', fontSize: '12px', gap: '6px' }}>
                <i className="bx bx-store-alt" /> Buka Kasir Pengembalian ➔
              </Link>
            </div>
          </div>

          {/* 4 Summary Metric Capsules */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
              marginBottom: '22px',
            }}
          >
            {/* Active Loans */}
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--apple-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Sedang Dipinjam
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--apple-accent)', marginTop: '4px' }}>
                {activeLoansList.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--apple-text-secondary)' }}>Buku</span>
              </div>
            </div>

            {/* Overdue Loans */}
            <div style={{
              background: overdueLoansList.length > 0 ? 'rgba(255, 59, 48, 0.06)' : '#f8fafc',
              padding: '14px 18px',
              borderRadius: '14px',
              border: `1.5px solid ${overdueLoansList.length > 0 ? 'rgba(255, 59, 48, 0.3)' : 'rgba(0,0,0,0.06)'}`,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: overdueLoansList.length > 0 ? '#ff3b30' : 'var(--apple-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {overdueLoansList.length > 0 && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b30' }} />}
                Mahasiswa Terlambat (Overdue)
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: overdueLoansList.length > 0 ? '#ff3b30' : 'var(--apple-text-primary)', marginTop: '4px' }}>
                {overdueLoansList.length} <span style={{ fontSize: '13px', fontWeight: 500, color: overdueLoansList.length > 0 ? '#ff3b30' : 'var(--apple-text-secondary)' }}>Transaksi</span>
              </div>
            </div>

            {/* Accumulation of Running Fines */}
            <div style={{
              background: totalActiveFines > 0 ? 'rgba(255, 149, 0, 0.06)' : '#f8fafc',
              padding: '14px 18px',
              borderRadius: '14px',
              border: `1.5px solid ${totalActiveFines > 0 ? 'rgba(255, 149, 0, 0.3)' : 'rgba(0,0,0,0.06)'}`,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: totalActiveFines > 0 ? '#d97706' : 'var(--apple-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Akumulasi Denda Berjalan
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: totalActiveFines > 0 ? '#d97706' : 'var(--apple-text-primary)', marginTop: '4px' }}>
                Rp {totalActiveFines.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Blocked Accounts (> 50k / Sanksi) */}
            <div style={{
              background: blockedLoansList.length > 0 ? 'rgba(255, 59, 48, 0.08)' : '#f8fafc',
              padding: '14px 18px',
              borderRadius: '14px',
              border: `1.5px solid ${blockedLoansList.length > 0 ? 'rgba(255, 59, 48, 0.35)' : 'rgba(0,0,0,0.06)'}`,
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: blockedLoansList.length > 0 ? '#ff3b30' : 'var(--apple-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Akun Terblokir (&gt; Rp 50.000)
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: blockedLoansList.length > 0 ? '#ff3b30' : 'var(--apple-text-primary)', marginTop: '4px' }}>
                {blockedLoansList.length} <span style={{ fontSize: '13px', fontWeight: 500, color: blockedLoansList.length > 0 ? '#ff3b30' : 'var(--apple-text-secondary)' }}>Akun</span>
              </div>
            </div>
          </div>

          {/* Filter Tabs & Realtime Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`apple-segment-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--apple-radius-pill)', cursor: 'pointer' }}
              >
                Semua Peminjam ({activeLoansList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('OVERDUE')}
                className={`apple-segment-btn ${activeTab === 'OVERDUE' ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  borderRadius: 'var(--apple-radius-pill)',
                  cursor: 'pointer',
                  background: activeTab === 'OVERDUE' ? '#ff3b30' : 'rgba(255, 59, 48, 0.1)',
                  color: activeTab === 'OVERDUE' ? '#ffffff' : '#ff3b30',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                ⚠️ Terlambat &amp; Berdenda ({overdueLoansList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ON_TIME')}
                className={`apple-segment-btn ${activeTab === 'ON_TIME' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--apple-radius-pill)', cursor: 'pointer' }}
              >
                Tepat Waktu ({onTimeLoansList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BLOCKED')}
                className={`apple-segment-btn ${activeTab === 'BLOCKED' ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  borderRadius: 'var(--apple-radius-pill)',
                  cursor: 'pointer',
                  background: activeTab === 'BLOCKED' ? '#5856d6' : 'rgba(88, 86, 214, 0.1)',
                  color: activeTab === 'BLOCKED' ? '#ffffff' : '#5856d6',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                ⛔ Akun Terblokir ({blockedLoansList.length})
              </button>
            </div>

            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <i className="bx bx-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--apple-text-tertiary)', fontSize: '16px' }} />
              <input
                type="text"
                className="apple-input"
                placeholder="Cari mahasiswa, NIM, judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '34px', fontSize: '12.5px', borderRadius: '10px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apple-text-tertiary)' }}
                >
                  <i className="bx bx-x" />
                </button>
              )}
            </div>
          </div>

          {/* Live Circulation Table */}
          <div style={{ background: '#ffffff', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              <table className="table-modern" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '23%', padding: '12px 16px' }}>Mahasiswa / Peminjam</th>
                    <th style={{ width: '25%', padding: '12px 14px' }}>Buku Yang Dipinjam</th>
                    <th style={{ width: '17%', padding: '12px 14px' }}>Waktu &amp; Status Tempo</th>
                    <th style={{ width: '17%', padding: '12px 14px' }}>Denda &amp; Sanksi Akun</th>
                    <th style={{ width: '18%', padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--apple-text-secondary)' }}>
                        <i className="bx bx-check-double" style={{ fontSize: '36px', color: '#34c759', marginBottom: '8px', display: 'block' }} />
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Tidak ada data peminjaman yang sesuai filter saat ini.</div>
                        <div style={{ fontSize: '12px', color: 'var(--apple-text-tertiary)', marginTop: '2px' }}>
                          Semua peminjaman tercatat dalam status normal dan tertib.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((item) => {
                      const firstDetail = item.details?.[0];
                      const bookItem = firstDetail?.buku;

                      return (
                        <tr key={item.id_pinjam} style={{ background: item.isOverdue ? 'rgba(255, 59, 48, 0.02)' : undefined }}>
                          {/* Member Identity */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: item.isOverdue ? 'rgba(255, 59, 48, 0.12)' : 'rgba(0, 113, 227, 0.1)',
                                  color: item.isOverdue ? '#ff3b30' : 'var(--apple-accent)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '13.5px',
                                  flexShrink: 0,
                                }}
                              >
                                {item.member?.nama?.charAt(0) || 'A'}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--apple-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.member?.nama}>
                                  {item.member?.nama || `Anggota #${item.id_anggota}`}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--apple-text-secondary)', display: 'flex', gap: '4px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.member?.nomor_anggota || `ID-${item.id_anggota}`}</span>
                                  <span>•</span>
                                  <span>{item.member?.tipe_anggota || 'Siswa'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Book Borrowed */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={bookItem?.foto || '/default-book-cover.svg'}
                                alt="Cover"
                                style={{ width: '30px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.08)', background: '#f5f5f7', flexShrink: 0 }}
                                onError={(e) => { (e.target as HTMLImageElement).src = '/default-book-cover.svg'; }}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--apple-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={bookItem?.judul}>
                                  {bookItem?.judul || firstDetail?.isbn || 'Buku Perpustakaan'}
                                </div>
                                <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--apple-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span>Barcode: {firstDetail?.barcode_eksemplar || `PS-${firstDetail?.isbn?.slice(-6) || '260001'}-01`}</span>
                                  <span style={{ fontSize: '9.5px', background: 'rgba(0, 113, 227, 0.1)', color: 'var(--apple-accent)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                    Buku {(firstDetail?.barcode_eksemplar?.match(/[-_.]?0?(\d+)$/)?.[1]) || '1'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Loan & Due Dates + Status Waktu */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-primary)', whiteSpace: 'nowrap' }}>
                              {item.tgl_pinjam} ➔ <span style={{ color: item.isOverdue ? '#ff3b30' : 'inherit' }}>{item.tgl_kembali}</span>
                            </div>
                            <div style={{ marginTop: '4px' }}>
                              {item.isOverdue ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    borderRadius: '99px',
                                    background: 'rgba(255, 59, 48, 0.12)',
                                    color: '#ff3b30',
                                    fontSize: '10.5px',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <i className="bx bx-time-five" /> TELAT {item.daysLate} HARI
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 8px',
                                    borderRadius: '99px',
                                    background: 'rgba(52, 199, 89, 0.12)',
                                    color: '#248a3d',
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <i className="bx bx-check" /> Tepat Waktu
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Fine Calculation + Status Akun */}
                          <td style={{ padding: '12px 14px' }}>
                            {item.fine > 0 ? (
                              <div>
                                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ff3b30', whiteSpace: 'nowrap' }}>
                                  Rp {item.fine.toLocaleString('id-ID')}
                                </div>
                                <div style={{ marginTop: '4px' }}>
                                  {item.isHardBlocked ? (
                                    <span
                                      title="Akumulasi denda > Rp 50.000 memicu Auto-Block Sistem. Wajib temui petugas!"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 7px',
                                        borderRadius: '6px',
                                        background: 'rgba(255, 59, 48, 0.15)',
                                        color: '#ff3b30',
                                        fontSize: '10.5px',
                                        fontWeight: 800,
                                        border: '1px solid rgba(255, 59, 48, 0.3)',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      <i className="bx bxs-lock-alt" /> DIBLOKIR (&gt; 50rb)
                                    </span>
                                  ) : (
                                    <span
                                      title="Ada denda aktif: Peminjaman buku baru dicekal sementara sampai denda lunas."
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 7px',
                                        borderRadius: '6px',
                                        background: 'rgba(255, 149, 0, 0.12)',
                                        color: '#b45309',
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        border: '1px solid rgba(255, 149, 0, 0.3)',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      <i className="bx bx-error" /> CEKAL PINJAM
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#248a3d' }}>
                                  Rp 0
                                </span>
                                <div style={{ marginTop: '4px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 7px',
                                      borderRadius: '6px',
                                      background: 'rgba(52, 199, 89, 0.1)',
                                      color: '#248a3d',
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    <i className="bx bx-check-circle" /> Akun Bersih
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Quick Actions */}
                          <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <Link
                                href={`/admin/sirkulasi?returnBarcode=${item.details?.[0]?.barcode_eksemplar || ''}`}
                                className="apple-btn-secondary"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  borderRadius: '8px',
                                  minHeight: '30px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: '#f5f5f7',
                                  border: '1px solid rgba(0,0,0,0.08)',
                                  color: 'var(--apple-text-primary)',
                                  textDecoration: 'none',
                                  whiteSpace: 'nowrap',
                                }}
                                title="Buka transaksi pengembalian di kasir sirkulasi"
                              >
                                <i className="bx bx-store-alt" style={{ fontSize: '13px' }} /> Kasir
                              </Link>

                              {item.grandTotalMemberFine > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayingTarget({
                                      idAnggota: item.member?.id_anggota || item.id_anggota,
                                      nama: item.member?.nama || `Anggota #${item.id_anggota}`,
                                      totalDenda: item.grandTotalMemberFine,
                                    });
                                    setPayAmountInput(item.grandTotalMemberFine);
                                  }}
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    minHeight: '30px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#0071e3',
                                    border: '1px solid #0071e3',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 6px rgba(0, 113, 227, 0.25)',
                                  }}
                                  title="Catat pelunasan denda mahasiswa"
                                >
                                  <i className="bx bx-wallet" style={{ fontSize: '13px' }} /> Bayar
                                </button>
                              )}

                              {item.isHardBlocked && (
                                <button
                                  type="button"
                                  onClick={() => handleUnblockMember(item.member?.id_anggota || item.id_anggota, item.member?.nama || 'Anggota')}
                                  style={{
                                    padding: '5px 8px',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    minHeight: '30px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: '#7c3aed',
                                    border: '1px solid rgba(124, 58, 237, 0.25)',
                                    background: 'rgba(124, 58, 237, 0.08)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="Buka Blokir Manual Akun Ini"
                                >
                                  <i className="bx bx-lock-open-alt" style={{ fontSize: '14px' }} /> Buka
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 MENU 2: RINGKASAN STATISTIK, GRAFIK & PANDUAN KASIR */}
      {/* ========================================================================= */}
      {dashboardView === 'statistik' && (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {/* Stats Grid - 4 Key Indicators */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="apple-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', marginBottom: '4px' }}>
                  Total Judul Buku
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--apple-text-primary)', lineHeight: 1 }}>
                  {totalBuku}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(0, 113, 227, 0.1)',
                color: 'var(--apple-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                <i className="bx bx-book" />
              </div>
            </div>

            <div className="apple-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', marginBottom: '4px' }}>
                  Total Stok Eksemplar
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--apple-text-primary)', lineHeight: 1 }}>
                  {totalStok}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(52, 199, 89, 0.1)',
                color: '#34c759',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                <i className="bx bx-check-shield" />
              </div>
            </div>

            <div className="apple-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', marginBottom: '4px' }}>
                  Peminjaman Aktif
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--apple-text-primary)', lineHeight: 1 }}>
                  {activeLoans}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(0, 199, 190, 0.1)',
                color: '#00c7be',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                <i className="bx bx-time-five" />
              </div>
            </div>

            <div className="apple-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', marginBottom: '4px' }}>
                  Tarif Denda per Hari
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--apple-text-primary)', lineHeight: 1.2 }}>
                  Rp {config.dendaPerHari?.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 149, 0, 0.1)',
                color: '#ff9500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                <i className="bx bx-coin-stack" />
              </div>
            </div>
          </div>

          {/* Overdue Action Banner in Menu 1 */}
          {overdueLoansList.length > 0 && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 2px 10px rgba(220, 38, 38, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(220, 38, 38, 0.12)',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  <i className="bx bx-error-circle" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#991b1b' }}>
                    Terdapat {overdueLoansList.length} Peminjaman Buku yang Telat / Overdue!
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#7f1d1d', marginTop: '2px' }}>
                    Total akumulasi denda berjalan mencapai <strong>Rp {totalActiveFines.toLocaleString('id-ID')}</strong>. Segera tindak lanjuti peminjam.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDashboardView('monitor');
                  setActiveTab('OVERDUE');
                }}
                className="apple-btn-primary"
                style={{
                  background: '#dc2626',
                  borderColor: '#dc2626',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  borderRadius: '10px',
                }}
              >
                <i className="bx bx-list-check" /> Buka Daftar Telat (Menu 2) &rarr;
              </button>
            </div>
          )}

          {/* Analytics Grid */}
          <div className="admin-analytics-grid" style={{ marginBottom: '24px' }}>
            <div className="apple-card realtime-chart-card" style={{ padding: '24px' }}>
              <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>
                    <i className="bx bx-line-chart" style={{ color: 'var(--apple-accent)' }} />
                    <span>Aktivitas Peminjaman 7 Hari Terakhir</span>
                  </div>
                  <p className="chart-subtitle" style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', margin: '4px 0 0' }}>
                    Tren permohonan pinjam buku harian
                  </p>
                </div>
                <span className="live-indicator" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '99px',
                  background: 'rgba(52, 199, 89, 0.12)',
                  color: '#34c759',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34c759' }} /> LIVE
                </span>
              </div>

              <div className="realtime-chart">
                <svg viewBox="0 0 100 100" role="img" aria-label="Grafik aktivitas peminjaman" preserveAspectRatio="none" style={{ width: '100%', height: '140px' }}>
                  <defs>
                    <linearGradient id="chartFillApple2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="chart-area" d={`M 0 100 L ${chartPoints} L 100 100 Z`} fill="url(#chartFillApple2)" />
                  <polyline className="chart-line" points={chartPoints} fill="none" stroke="#0071e3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartDays.map((day, index) => (
                    <circle
                      key={`${day.label}-${index}`}
                      className="chart-dot"
                      cx={index * 100 / 6}
                      cy={100 - (day.value / chartMax) * 82 - 9}
                      r="2.2"
                      fill="#ffffff"
                      stroke="#0071e3"
                      strokeWidth="1.8"
                    />
                  ))}
                </svg>
                <div className="chart-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--apple-text-secondary)', fontWeight: 500 }}>
                  {chartDays.map((day, index) => <span key={`${day.label}-label-${index}`}>{day.label}</span>)}
                </div>
              </div>
            </div>

            {/* Real-time status list */}
            <div className="apple-card activity-summary-card" style={{ padding: '24px' }}>
              <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>
                  <i className="bx bx-pulse" style={{ color: 'var(--apple-accent)' }} />
                  <span>Status Sirkulasi Terkini</span>
                </div>
              </div>
              <div className="activity-summary-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--apple-bg-base)', borderRadius: '12px', border: '1px solid var(--apple-separator)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9500' }} />
                    <span style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>Menunggu ACC</span>
                  </div>
                  <strong style={{ fontSize: '15px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>{pendingLoans}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--apple-bg-base)', borderRadius: '12px', border: '1px solid var(--apple-separator)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0071e3' }} />
                    <span style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>Sedang Dipinjam</span>
                  </div>
                  <strong style={{ fontSize: '15px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>{activeLoans}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--apple-bg-base)', borderRadius: '12px', border: '1px solid var(--apple-separator)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5856d6' }} />
                    <span style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>Menunggu Kembali</span>
                  </div>
                  <strong style={{ fontSize: '15px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>{pendingReturns}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--apple-bg-base)', borderRadius: '12px', border: '1px solid var(--apple-separator)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34c759' }} />
                    <span style={{ fontSize: '13px', color: 'var(--apple-text-secondary)' }}>Selesai Dikembalikan</span>
                  </div>
                  <strong style={{ fontSize: '15px', fontWeight: 700, color: 'var(--apple-text-primary)' }}>{peminjaman.filter((p) => p.status === 'DIKEMBALIKAN').length}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Panduan Alur Kasir 3 Langkah */}
          <div
            className="apple-card"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.05) 0%, rgba(52, 199, 89, 0.05) 100%)',
              border: '1.5px solid rgba(0, 113, 227, 0.2)',
              borderRadius: '18px',
              padding: '22px 26px',
              marginBottom: '24px',
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                📖 Panduan Alur Kasir Sirkulasi Cepat (3 Langkah)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', margin: '4px 0 0' }}>
                Pelayanan cepat tanpa antre berbelit ala kasir modern:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--apple-accent)', display: 'block', marginBottom: '4px' }}>1. Scan Kartu Anggota</strong>
                <p style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', margin: 0 }}>Scan KTM mahasiswa (<code style={{ fontFamily: 'monospace' }}>AG-2026...</code>) untuk verifikasi profil.</p>
              </div>
              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--apple-accent)', display: 'block', marginBottom: '4px' }}>2. Scan Barcode Buku</strong>
                <p style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', margin: 0 }}>Arahkan scanner ke barcode buku (<code style={{ fontFamily: 'monospace' }}>PS-2600...</code>) masuk keranjang.</p>
              </div>
              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                <strong style={{ fontSize: '13px', color: '#248a3d', display: 'block', marginBottom: '4px' }}>3. Tekan Enter &amp; Cetak Struk</strong>
                <p style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', margin: 0 }}>Tekan Enter atau F12 untuk cetak struk thermal bukti pinjam.</p>
              </div>
            </div>
          </div>

          {/* Quick Navigation Hubs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <div className="apple-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--apple-text-primary)' }}>Antrean Sirkulasi</strong>
                <span className="badge badge-warning">{pendingLoans + pendingReturns} Antrean</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
                Permohonan peminjaman dan pengembalian buku yang menunggu konfirmasi.
              </p>
              <Link href="/admin/sirkulasi" className="apple-btn-primary" style={{ justifyContent: 'center', width: '100%', fontSize: '12.5px' }}>
                Buka Kasir Sirkulasi &rarr;
              </Link>
            </div>

            <div className="apple-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--apple-text-primary)' }}>Koleksi 100 Buku</strong>
                <span className="badge badge-primary">{totalBuku} Judul</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
                Katalog 100 buku, barcode eksemplar, dan pencetakan stiker label.
              </p>
              <Link href="/admin/buku" className="apple-btn-secondary" style={{ justifyContent: 'center', width: '100%', fontSize: '12.5px' }}>
                Kelola Koleksi Buku &rarr;
              </Link>
            </div>

            <div className="apple-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--apple-text-primary)' }}>Verifikasi KTM</strong>
                <span className="badge badge-warning">{pendingUsers} Pending</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
                Verifikasi foto Kartu Tanda Mahasiswa yang diunggah anggota baru.
              </p>
              <Link href="/admin/verifikasi" className="apple-btn-secondary" style={{ justifyContent: 'center', width: '100%', fontSize: '12.5px' }}>
                Periksa Berkas KTM &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💵 MODAL PEMBAYARAN DENDA CEPAT */}
      {/* ========================================================================= */}
      {payingTarget && (
        <div className="apple-modal-overlay" onClick={() => setPayingTarget(null)}>
          <div className="apple-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="apple-modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                Pelunasan Denda Mahasiswa
              </h3>
              <button className="apple-btn-icon" onClick={() => setPayingTarget(null)}>
                <i className="bx bx-x" />
              </button>
            </div>
            <form onSubmit={handlePayFineSubmit}>
              <div className="apple-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 14px', background: 'rgba(255, 149, 0, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>Nama Mahasiswa</div>
                  <strong style={{ fontSize: '15px', color: 'var(--apple-text-primary)' }}>{payingTarget.nama}</strong>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--apple-text-secondary)' }}>
                    Total Tagihan Denda: <span style={{ fontWeight: 700, color: '#ff3b30' }}>Rp {payingTarget.totalDenda.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="apple-form-group">
                  <label className="apple-label">Nominal Pembayaran Diterima (Rp)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--apple-text-tertiary)', fontSize: '14px' }}>
                      Rp
                    </span>
                    <input
                      type="number"
                      className="apple-input"
                      style={{ paddingLeft: '44px', fontSize: '15px', fontWeight: 700 }}
                      value={payAmountInput || ''}
                      min={1}
                      max={payingTarget.totalDenda}
                      step="any"
                      onChange={(e) => setPayAmountInput(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)' }}>
                      Maksimal: Rp {payingTarget.totalDenda.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPayAmountInput(payingTarget.totalDenda)}
                      style={{
                        background: 'rgba(255, 149, 0, 0.12)',
                        color: '#d97706',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Bayar Lunas
                    </button>
                  </div>
                </div>
              </div>
              <div className="apple-modal-footer">
                <button type="button" className="apple-btn-secondary" onClick={() => setPayingTarget(null)}>
                  Batal
                </button>
                <button type="submit" className="apple-btn-primary" style={{ background: '#ff9500' }}>
                  <i className="bx bx-check-circle" /> Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🕊️ MODAL BEBASKAN DENDA */}
      {/* ========================================================================= */}
      {waivingTarget && (
        <div className="apple-modal-overlay" onClick={() => setWaivingTarget(null)}>
          <div className="apple-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="apple-modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                Bebaskan Denda (Waive Fine)
              </h3>
              <button className="apple-btn-icon" onClick={() => setWaivingTarget(null)}>
                <i className="bx bx-x" />
              </button>
            </div>
            <form onSubmit={handleWaiveFineSubmit}>
              <div className="apple-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', margin: 0 }}>
                  Apakah Anda yakin ingin membebaskan seluruh denda sebesar <strong style={{ color: '#ff3b30' }}>Rp {waivingTarget.totalDenda.toLocaleString('id-ID')}</strong> untuk <strong>{waivingTarget.nama}</strong>?
                </p>
                <div className="apple-form-group">
                  <label className="apple-label">Alasan Pembebasan Denda</label>
                  <input
                    type="text"
                    className="apple-input"
                    value={waiveReasonInput}
                    onChange={(e) => setWaiveReasonInput(e.target.value)}
                    placeholder="Contoh: Dispensasi Bencana / Sakit / Kebijakan Pimpinan"
                    required
                  />
                </div>
              </div>
              <div className="apple-modal-footer">
                <button type="button" className="apple-btn-secondary" onClick={() => setWaivingTarget(null)}>
                  Batal
                </button>
                <button type="submit" className="apple-btn-primary" style={{ background: '#34c759' }}>
                  <i className="bx bx-check" /> Bebaskan Denda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
