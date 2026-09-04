'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';
import { Buku } from '@/types/database';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Barcode, 
  CheckCircle, 
  AlertCircle,
  PlusCircle,
  Clock
} from 'lucide-react';

function KatalogContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const { buku, katalog, pinjamBuku, config } = useData();
  const { currentUser, currentAnggota, isMember } = useAuth();
  
  const [search, setSearch] = useState(initialQuery);
  const [selectedKatalog, setSelectedKatalog] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedBarcodeBuku, setSelectedBarcodeBuku] = useState<Buku | null>(null);
  const [borrowFeedback, setBorrowFeedback] = useState<{ msg: string; isError: boolean } | null>(null);

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

      const matchAvailable = !onlyAvailable || b.qty_stok > 0;

      return matchSearch && matchKatalog && matchAvailable;
    });
  }, [buku, search, selectedKatalog, onlyAvailable]);

  const handlePinjam = async (item: Buku) => {
    if (!currentUser) {
      setBorrowFeedback({
        msg: 'Silakan masuk (login) terlebih dahulu untuk mengajukan peminjaman buku!',
        isError: true,
      });
      return;
    }

    if (!currentAnggota) {
      setBorrowFeedback({
        msg: 'Akun Anda belum terdaftar sebagai Anggota Perpustakaan!',
        isError: true,
      });
      return;
    }

    const res = await pinjamBuku(currentAnggota.id_anggota, item.isbn, 1);
    setBorrowFeedback({
      msg: res.message,
      isError: !res.success,
    });

    setTimeout(() => {
      setBorrowFeedback(null);
    }, 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
          Katalog Koleksi Buku
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Daftar seluruh buku, monograf, dan literatur yang tersedia di UPT Perpustakaan Polinela
        </p>
      </div>

      {/* Borrow Alert Banner */}
      {borrowFeedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
            borrowFeedback.isError
              ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
          }`}
        >
          {borrowFeedback.isError ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{borrowFeedback.msg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, ISBN, pengarang..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedKatalog}
              onChange={(e) => setSelectedKatalog(e.target.value)}
              className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-800 dark:text-zinc-200"
            >
              <option value="ALL">Semua Kategori</option>
              {katalog.map((k) => (
                <option key={k.id_katalog} value={k.id_katalog}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Only Available Toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>Hanya yang Tersedia</span>
          </label>
        </div>
      </div>

      {/* Grid of Books */}
      {filteredBuku.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Tidak ada buku yang sesuai dengan pencarian Anda
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Coba gunakan kata kunci lain atau pilih Semua Kategori.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBuku.map((item) => (
            <div
              key={item.isbn}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              {/* Cover */}
              <div className="relative h-60 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-4 overflow-hidden">
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
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      item.qty_stok > 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                    }`}
                  >
                    Stok: {item.qty_stok}
                  </span>
                </div>
              </div>

              {/* Book Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {item.katalog?.nama || 'Umum'}
                    </span>
                    <span className="text-xs text-zinc-400">Tahun {item.tahun}</span>
                  </div>

                  <h3
                    className="font-bold text-zinc-900 dark:text-white mt-1.5 text-base line-clamp-2"
                    title={item.judul}
                  >
                    {item.judul}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <p className="line-clamp-1">
                      <span className="text-zinc-400">Pengarang:</span>{' '}
                      {item.pengarang?.nama_pengarang || '-'}
                    </p>
                    <p className="line-clamp-1">
                      <span className="text-zinc-400">Penerbit:</span>{' '}
                      {item.penerbit?.nama_penerbit || '-'}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-400">
                      ISBN: {item.isbn}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBarcodeBuku(item)}
                    className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors shrink-0"
                    title="Cetak Barcode Label"
                  >
                    <Barcode className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handlePinjam(item)}
                    disabled={item.qty_stok <= 0}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      item.qty_stok > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Ajukan Pinjam</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default function KatalogPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-zinc-500">Memuat katalog...</div>}>
      <KatalogContent />
    </Suspense>
  );
}
