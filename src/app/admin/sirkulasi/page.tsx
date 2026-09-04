'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import { Peminjaman } from '@/types/database';
import { 
  RotateCcw, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  BookOpen, 
  DollarSign,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function AdminSirkulasiPage() {
  const { peminjaman, config, accPinjam, tolakPinjam, accKembali } = useData();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Return Confirm Modal State
  const [selectedReturnLoan, setSelectedReturnLoan] = useState<Peminjaman | null>(null);
  const [calculatedDenda, setCalculatedDenda] = useState<number>(0);
  const [lateDays, setLateDays] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const calculateFines = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const fine = diffDays * (config.dendaPerHari || 500);
      return { days: diffDays, fine };
    }
    return { days: 0, fine: 0 };
  };

  const handleOpenReturnModal = (loan: Peminjaman) => {
    const { days, fine } = calculateFines(loan.tgl_kembali);
    setSelectedReturnLoan(loan);
    setLateDays(days);
    setCalculatedDenda(fine);
  };

  const handleConfirmReturn = async () => {
    if (selectedReturnLoan) {
      await accKembali(selectedReturnLoan.id_pinjam, calculatedDenda);
      setSelectedReturnLoan(null);
      setFeedback(`Buku berhasil dikembalikan! Denda tercatat: Rp ${calculatedDenda.toLocaleString('id-ID')}`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const filteredPeminjaman = peminjaman.filter((p) => {
    const matchTab = activeTab === 'ALL' || p.status === activeTab;
    const matchSearch =
      search.trim() === '' ||
      p.anggota?.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.details?.[0]?.buku?.judul.toLowerCase().includes(search.toLowerCase()) ||
      p.details?.[0]?.isbn.includes(search);
    return matchTab && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MENUNGGU_ACC':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">Menunggu ACC Pinjam</span>;
      case 'DIPINJAM':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">Sedang Dipinjam</span>;
      case 'MENUNGGU_KEMBALI':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">Menunggu ACC Kembali</span>;
      case 'DIKEMBALIKAN':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">Selesai Dikembalikan</span>;
      case 'DITOLAK':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-zinc-100 text-zinc-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
          Sirkulasi Peminjaman & Pengembalian
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Persetujuan peminjaman buku fisik, pemantauan batas pengembalian, dan kalkulasi denda keterlambatan otomatis
        </p>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Semua Status' },
            { id: 'MENUNGGU_ACC', label: 'Antrean Pinjam' },
            { id: 'DIPINJAM', label: 'Sedang Dipinjam' },
            { id: 'MENUNGGU_KEMBALI', label: 'Antrean Kembali' },
            { id: 'DIKEMBALIKAN', label: 'Selesai' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota / judul..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 font-semibold border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="p-4">ID Transaksi</th>
                <th className="p-4">Anggota Peminjam</th>
                <th className="p-4">Buku & ISBN</th>
                <th className="p-4">Tgl Pinjam / Batas</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredPeminjaman.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    Tidak ada transaksi sirkulasi pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredPeminjaman.map((p) => {
                  const book = p.details?.[0]?.buku;
                  const { days, fine } = calculateFines(p.tgl_kembali);
                  const isOverdue = days > 0 && p.status === 'DIPINJAM';

                  return (
                    <tr key={p.id_pinjam} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-4 font-mono font-bold text-zinc-500">
                        TRX-{p.id_pinjam}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {p.anggota?.nama?.[0] || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-white block">
                              {p.anggota?.nama || `Anggota #${p.id_anggota}`}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Status KTM: {p.anggota?.status_verifikasi || 'TERVERIFIKASI'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-zinc-900 dark:text-white block">
                          {book?.judul || 'Buku Perpustakaan'}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {p.details?.[0]?.isbn}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="text-zinc-600 dark:text-zinc-400 block">
                            Pinjam: {p.tgl_pinjam}
                          </span>
                          <span className={`block font-semibold ${isOverdue ? 'text-rose-600' : 'text-zinc-800 dark:text-zinc-200'}`}>
                            Batas: {p.tgl_kembali}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] text-rose-500 font-bold block">
                              Terlambat {days} hari (Denda: Rp {fine.toLocaleString('id-ID')})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {getStatusBadge(p.status)}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* When waiting for approval to borrow */}
                          {p.status === 'MENUNGGU_ACC' && (
                            <>
                              <button
                                onClick={() => accPinjam(p.id_pinjam)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>ACC Pinjam</span>
                              </button>
                              <button
                                onClick={() => tolakPinjam(p.id_pinjam)}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Tolak Peminjaman"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* When borrowed or waiting to be returned */}
                          {(p.status === 'DIPINJAM' || p.status === 'MENUNGGU_KEMBALI') && (
                            <button
                              onClick={() => handleOpenReturnModal(p)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>ACC Kembali</span>
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

      {/* Return & Fines Confirmation Modal */}
      {selectedReturnLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Konfirmasi Pengembalian Buku
            </h3>
            <p className="text-xs text-zinc-500 mb-6">
              Periksa kondisi fisik buku dan hitung tagihan denda keterlambatan
            </p>

            <div className="space-y-3 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-xs mb-6">
              <div className="flex justify-between">
                <span className="text-zinc-400">Peminjam:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {selectedReturnLoan.anggota?.nama}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Batas Pengembalian:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedReturnLoan.tgl_kembali}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Hari Keterlambatan:</span>
                <span className={`font-bold ${lateDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {lateDays > 0 ? `${lateDays} Hari Terlambat` : 'Tepat Waktu (0 Hari)'}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline">
                <span className="text-zinc-500 font-semibold">Total Denda:</span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  Rp {calculatedDenda.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReturnLoan(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terima & Selesaikan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
