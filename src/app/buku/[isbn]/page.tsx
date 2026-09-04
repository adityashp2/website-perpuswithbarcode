'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';
import { 
  ArrowLeft, 
  BookOpen, 
  Barcode, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Building, 
  User, 
  Layers, 
  Clock, 
  Share2 
} from 'lucide-react';

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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <BookOpen className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Buku Tidak Ditemukan
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Buku dengan ISBN {isbn} tidak ditemukan di database.
        </p>
        <Link
          href="/katalog"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const handleBorrow = async () => {
    if (!currentUser) {
      setFeedback({
        msg: 'Silakan login terlebih dahulu untuk meminjam buku ini!',
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.isError
              ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-8">
        {/* Left Column: Cover */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="w-full aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-zinc-200 dark:border-zinc-700 shadow-inner">
            {targetBook.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={targetBook.foto}
                alt={targetBook.judul}
                className="max-h-full object-contain rounded-lg shadow-md"
              />
            ) : (
              <BookOpen className="w-20 h-20 text-zinc-300 dark:text-zinc-600" />
            )}
          </div>

          <div className="w-full mt-4 flex items-center gap-2">
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Barcode className="w-4 h-4 text-blue-600" />
              Cetak Barcode Label
            </button>
          </div>
        </div>

        {/* Right Column: Details & Loan */}
        <div className="md:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                {targetBook.katalog?.nama || 'Umum'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  targetBook.qty_stok > 0
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                }`}
              >
                {targetBook.qty_stok > 0 ? `Tersedia: ${targetBook.qty_stok} Eksemplar` : 'Stok Habis'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white leading-snug">
              {targetBook.judul}
            </h1>

            {/* Metadata Table */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">Pengarang</p>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {targetBook.pengarang?.nama_pengarang || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">Penerbit</p>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {targetBook.penerbit?.nama_penerbit || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">Tahun Terbit</p>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {targetBook.tahun}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Barcode className="w-4 h-4 text-zinc-400 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-400">Nomor ISBN</p>
                  <p className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                    {targetBook.isbn}
                  </p>
                </div>
              </div>
            </div>

            {/* Terms of Circulation */}
            <div className="mt-6 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
              <p className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Ketentuan Peminjaman UPT Perpustakaan Polinela:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Batas waktu peminjaman standar: <strong>{config.maxLamaPinjam} hari</strong>.</li>
                <li>Denda keterlambatan: <strong>Rp {config.dendaPerHari?.toLocaleString('id-ID')} per hari/buku</strong>.</li>
                <li>Maksimal kuota buku ini per anggota: <strong>{targetBook.maks_pinjam_per_anggota} eksemplar</strong>.</li>
                <li>Wajib membawa Kartu Tanda Mahasiswa (KTM) terverifikasi saat pengambilan buku fisik.</li>
              </ul>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
            <button
              onClick={handleBorrow}
              disabled={targetBook.qty_stok <= 0}
              className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                targetBook.qty_stok > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>{targetBook.qty_stok > 0 ? 'Ajukan Peminjaman Sekarang' : 'Stok Buku Habis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Modal */}
      {showBarcodeModal && (
        <BarcodeModal
          buku={targetBook}
          onClose={() => setShowBarcodeModal(false)}
        />
      )}
    </div>
  );
}
