'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { 
  User, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export default function MemberDashboardPage() {
  const router = useRouter();
  const { currentUser, currentAnggota, isMember } = useAuth();
  const { peminjaman, ajukanKembali, config } = useData();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Akses Dibatasi</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-6">Silakan login untuk melihat dashboard anggota Anda.</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Menuju Halaman Login
        </Link>
      </div>
    );
  }

  // Filter loans for this member
  const myLoans = peminjaman.filter(
    (p) => p.id_anggota === currentAnggota?.id_anggota
  );

  const handleAjukanKembali = async (idPinjam: number) => {
    await ajukanKembali(idPinjam);
    setFeedback('Permohonan pengembalian buku telah diajukan! Silakan serahkan buku fisik ke petugas.');
    setTimeout(() => setFeedback(null), 5000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MENUNGGU_ACC':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">Menunggu ACC Petugas</span>;
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
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-2xl border border-blue-200 dark:border-blue-900">
              {currentAnggota?.nama ? currentAnggota.nama[0].toUpperCase() : 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">
                  {currentAnggota?.nama || currentUser.username}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono text-zinc-600 dark:text-zinc-400">
                  @{currentUser.username}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {currentAnggota?.descripsi || 'Anggota Aktif Perpustakaan Polinela'}
              </p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Status Verifikasi KTM
              </span>
              <div className="mt-1">
                {currentAnggota?.status_verifikasi === 'TERVERIFIKASI' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terverifikasi
                  </span>
                ) : currentAnggota?.status_verifikasi === 'DITOLAK' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Ditolak ({currentAnggota.catatan_verifikasi || 'KTM Kurang Jelas'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    Menunggu Verifikasi KTM
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Member Details */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 block">Email:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {currentAnggota?.email || '-'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">WhatsApp:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {currentAnggota?.telp || '-'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">Tanggal Terdaftar:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {currentAnggota?.tgl_entry || '-'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">Domisili:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {currentAnggota?.alamat || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Loans Table / History */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Riwayat & Status Peminjaman Buku
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Daftar seluruh buku yang pernah atau sedang Anda pinjam
            </p>
          </div>
          <Link
            href="/katalog"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Pinjam Buku Lain</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myLoans.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">
              Belum Ada Riwayat Peminjaman
            </h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              Jelajahi koleksi kami dan ajukan peminjaman buku favorit Anda.
            </p>
            <Link
              href="/katalog"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Lihat Katalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 font-semibold border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="p-4">ID & Buku</th>
                  <th className="p-4">Tanggal Pinjam</th>
                  <th className="p-4">Batas Pengembalian</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {myLoans.map((loan) => {
                  const book = loan.details?.[0]?.buku;
                  const isLate = new Date() > new Date(loan.tgl_kembali) && loan.status === 'DIPINJAM';

                  return (
                    <tr key={loan.id_pinjam} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-4">
                        <span className="font-mono text-[10px] text-zinc-400 block">
                          TRX-{loan.id_pinjam}
                        </span>
                        <span className="font-bold text-sm text-zinc-900 dark:text-white block mt-0.5">
                          {book?.judul || 'Buku Perpustakaan'}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          ISBN: {loan.details?.[0]?.isbn}
                        </span>
                      </td>

                      <td className="p-4 text-zinc-600 dark:text-zinc-300">
                        {loan.tgl_pinjam}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span className={isLate ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300'}>
                            {loan.tgl_kembali}
                          </span>
                        </div>
                        {isLate && (
                          <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                            * Melebihi batas (Kena denda harian)
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {getStatusBadge(loan.status)}
                      </td>

                      <td className="p-4 text-right">
                        {loan.status === 'DIPINJAM' && (
                          <button
                            onClick={() => handleAjukanKembali(loan.id_pinjam)}
                            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 ml-auto transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ajukan Pengembalian</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
