'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';
import { Buku } from '@/types/database';
import { 
  Search, 
  BookOpen, 
  Barcode, 
  Users, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { buku, anggota, peminjaman, config } = useData();
  const { currentUser, isAdmin, isMember, switchRoleQuick } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarcodeBuku, setSelectedBarcodeBuku] = useState<Buku | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/katalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/katalog');
    }
  };

  const totalBuku = buku.reduce((acc, b) => acc + (b.qty_stok || 0), 0);
  const totalAnggota = anggota.length;
  const pinjamAktif = peminjaman.filter((p) => p.status === 'DIPINJAM').length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-zinc-50 dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f60a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f60a_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 shadow-sm border border-blue-200 dark:border-blue-900">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Versi Cloud Next.js + Supabase Ready for Vercel</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Akses Ribuan Koleksi Buku & Sirkulasi Digital{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Perpustakaan Polinela
            </span>
          </h1>

          <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Sistem peminjaman buku modern berbasis barcode dengan verifikasi KTM terintegrasi. Cepat, akurat, dan dapat diakses dari mana saja.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center shadow-lg shadow-blue-500/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 focus-within:border-blue-500 transition-all">
              <div className="pl-4 text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul buku, nomor ISBN, barcode, atau pengarang..."
                className="w-full px-4 py-3 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Cari Buku</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Access Bar (Convenience for testing on Vercel) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Akses Cepat Pengujian:</span>
            <button
              type="button"
              onClick={() => switchRoleQuick('ADM')}
              className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full font-medium text-blue-600 dark:text-blue-400 transition-colors"
            >
              Mode Petugas Admin
            </button>
            <button
              type="button"
              onClick={() => switchRoleQuick('MBR')}
              className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full font-medium text-emerald-600 dark:text-emerald-400 transition-colors"
            >
              Mode Mahasiswa / Member
            </button>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-8 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl">
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{buku.length}</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">Judul Koleksi</p>
            </div>
            <div className="p-4 rounded-xl">
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{totalBuku}</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">Total Eksemplar</p>
            </div>
            <div className="p-4 rounded-xl">
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalAnggota}</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">Anggota Aktif</p>
            </div>
            <div className="p-4 rounded-xl">
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">Rp {config.dendaPerHari?.toLocaleString('id-ID')}</p>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1">Denda/Hari (Maks {config.maxLamaPinjam} Hari)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Collection */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Koleksi Buku Unggulan
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Buku teks perkuliahan terpopuler dan terlaris di Perpustakaan Polinela
            </p>
          </div>
          <Link
            href="/katalog"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>Lihat Semua Koleksi</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {buku.slice(0, 4).map((item) => (
            <div
              key={item.isbn}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Cover Image */}
              <div className="relative h-56 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-4 overflow-hidden">
                {item.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.foto}
                    alt={item.judul}
                    className="max-h-full object-contain rounded shadow group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <BookOpen className="w-16 h-16 text-zinc-300 dark:text-zinc-600" />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    item.qty_stok > 0 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300' 
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                  }`}>
                    {item.qty_stok > 0 ? `Tersedia: ${item.qty_stok}` : 'Stok Habis'}
                  </span>
                </div>
              </div>

              {/* Book Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {item.katalog?.nama || 'Umum'}
                  </span>
                  <h3 className="font-bold text-zinc-900 dark:text-white mt-1 text-base line-clamp-2" title={item.judul}>
                    {item.judul}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Pengarang: {item.pengarang?.nama_pengarang || 'Tim Penulis'}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1">
                    ISBN: {item.isbn}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedBarcodeBuku(item)}
                    className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                    title="Cetak Barcode Label"
                  >
                    <Barcode className="w-5 h-5" />
                  </button>

                  <Link
                    href={`/buku/${encodeURIComponent(item.isbn)}`}
                    className="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
                  >
                    Detail & Pinjam
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Barcode Modal */}
      {selectedBarcodeBuku && (
        <BarcodeModal
          buku={selectedBarcodeBuku}
          onClose={() => setSelectedBarcodeBuku(null)}
        />
      )}
    </div>
  );
}
