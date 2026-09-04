'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { 
  BookOpen, 
  Users, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Barcode, 
  Settings, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Clock
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentUser, isAdmin } = useAuth();
  const { buku, anggota, peminjaman, config } = useData();

  if (!currentUser || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Akses Petugas Khusus</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-6">
          Halaman ini hanya dapat diakses oleh Administrator Perpustakaan Polinela.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Login Sebagai Admin
        </Link>
      </div>
    );
  }

  const pendingLoans = peminjaman.filter((p) => p.status === 'MENUNGGU_ACC').length;
  const pendingReturns = peminjaman.filter((p) => p.status === 'MENUNGGU_KEMBALI').length;
  const activeLoans = peminjaman.filter((p) => p.status === 'DIPINJAM').length;
  const pendingKtm = anggota.filter((a) => a.status_verifikasi === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              Pusat Kontrol Petugas Perpustakaan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
              Admin Polinela
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola data buku, barcode, verifikasi berkas KTM, dan validasi transaksi sirkulasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/master"
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Konfigurasi & Master</span>
          </Link>
          <Link
            href="/admin/buku"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Kelola Koleksi Buku</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Antrean Sirkulasi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {pendingLoans + pendingReturns}
            </span>
            <span className="text-xs text-amber-600 font-semibold">
              ({pendingLoans} Pinjam, {pendingReturns} Kembali)
            </span>
          </div>
          <Link
            href="/admin/sirkulasi"
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Buka Sirkulasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Verifikasi Berkas KTM</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {pendingKtm}
            </span>
            <span className="text-xs text-zinc-400">Mahasiswa Menunggu</span>
          </div>
          <Link
            href="/admin/verifikasi"
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Periksa KTM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Peminjaman Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {activeLoans}
            </span>
            <span className="text-xs text-zinc-400">Buku di Tangan Anggota</span>
          </div>
          <Link
            href="/admin/sirkulasi?status=DIPINJAM"
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Daftar Peminjam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Koleksi Judul Buku</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Barcode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {buku.length}
            </span>
            <span className="text-xs text-zinc-400">Semua Ber-Barcode</span>
          </div>
          <Link
            href="/admin/buku"
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Cetak Barcode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/sirkulasi"
          className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">
            Sirkulasi Peminjaman & Pengembalian
          </h3>
          <p className="text-xs text-zinc-500 mt-1.5">
            Validasi persetujuan peminjaman buku fisik dan penerimaan buku kembali dengan perhitungan denda otomatis.
          </p>
        </Link>

        <Link
          href="/admin/verifikasi"
          className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
            Verifikasi KTM & Manajemen Anggota
          </h3>
          <p className="text-xs text-zinc-500 mt-1.5">
            Periksa foto Kartu Tanda Mahasiswa yang diunggah pendaftar baru dan berikan status Terverifikasi atau Ditolak.
          </p>
        </Link>

        <Link
          href="/admin/buku"
          className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Barcode className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            Katalog Buku & Pembuat Label Barcode
          </h3>
          <p className="text-xs text-zinc-500 mt-1.5">
            Tambah judul baru, ubah stok eksemplar, dan cetak stiker barcode siap tempel pada cover buku.
          </p>
        </Link>
      </div>
    </div>
  );
}
