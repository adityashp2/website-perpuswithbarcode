'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import { Anggota } from '@/types/database';
import { 
  Users, 
  Check, 
  X, 
  CreditCard, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Ban 
} from 'lucide-react';

export default function AdminVerifikasiPage() {
  const { anggota, adminUsers, verifikasiAnggota, banUser, unbanUser } = useData();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'TERVERIFIKASI' | 'DITOLAK' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selectedKtmPreview, setSelectedKtmPreview] = useState<{ url: string; nama: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ idAnggota: number; nama: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Foto KTM tidak terbaca atau buram');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredAnggota = anggota.filter((a) => {
    const matchTab = activeTab === 'ALL' || a.status_verifikasi === activeTab;
    const matchSearch =
      search.trim() === '' ||
      a.nama.toLowerCase().includes(search.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.telp && a.telp.includes(search));
    return matchTab && matchSearch;
  });

  const handleApprove = async (idAnggota: number, nama: string) => {
    await verifikasiAnggota(idAnggota, 'TERVERIFIKASI');
    setFeedback(`Akun ${nama} berhasil disetujui & terverifikasi!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmReject = async () => {
    if (rejectModal) {
      await verifikasiAnggota(rejectModal.idAnggota, 'DITOLAK', rejectReason);
      setFeedback(`Verifikasi ${rejectModal.nama} ditolak.`);
      setRejectModal(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
          Verifikasi KTM & Manajemen Anggota
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Validasi identitas Kartu Tanda Mahasiswa (KTM) dan pengelolaan hak akses anggota
        </p>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs and Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'PENDING', label: 'Menunggu Verifikasi' },
            { id: 'TERVERIFIKASI', label: 'Terverifikasi' },
            { id: 'DITOLAK', label: 'Ditolak' },
            { id: 'ALL', label: 'Semua Anggota' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
            placeholder="Cari nama anggota atau email..."
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
                <th className="p-4">Identitas Mahasiswa</th>
                <th className="p-4">Kontak & Domisili</th>
                <th className="p-4">Foto KTM</th>
                <th className="p-4">Status Akun</th>
                <th className="p-4 text-right">Aksi Validasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredAnggota.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    Tidak ada anggota pada tab ini.
                  </td>
                </tr>
              ) : (
                filteredAnggota.map((a) => {
                  const userAccount = adminUsers.find((u) => u.id === a.id_admin);
                  const isBanned = userAccount?.is_banned;

                  return (
                    <tr key={a.id_anggota} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="p-4">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white block">
                          {a.nama}
                        </span>
                        <span className="text-[11px] text-zinc-400 block">
                          Jenis Kelamin: {a.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Terdaftar: {a.tgl_entry}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                          {a.email || '-'}
                        </span>
                        <span className="text-zinc-500 text-[11px] block">
                          WA: {a.telp || '-'}
                        </span>
                        <span className="text-zinc-400 text-[10px]">
                          {a.alamat || '-'}
                        </span>
                      </td>

                      <td className="p-4">
                        {a.ktm_foto ? (
                          <button
                            onClick={() => setSelectedKtmPreview({ url: a.ktm_foto!, nama: a.nama })}
                            className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 bg-zinc-50 dark:bg-zinc-800 group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={a.ktm_foto}
                              alt="KTM"
                              className="w-10 h-7 object-cover rounded shadow"
                            />
                            <div className="text-left">
                              <span className="text-[11px] font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Lihat KTM
                              </span>
                            </div>
                          </button>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">Tidak ada KTM</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {a.status_verifikasi === 'TERVERIFIKASI' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Terverifikasi
                            </span>
                          )}
                          {a.status_verifikasi === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                              <Clock className="w-3 h-3" />
                              Menunggu
                            </span>
                          )}
                          {a.status_verifikasi === 'DITOLAK' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                              <X className="w-3 h-3" />
                              Ditolak: {a.catatan_verifikasi || 'KTM Kurang Jelas'}
                            </span>
                          )}

                          {isBanned && (
                            <span className="block text-[10px] font-bold text-rose-600 uppercase">
                              [BANNED]
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status_verifikasi === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(a.id_anggota, a.nama)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verifikasi</span>
                              </button>
                              <button
                                onClick={() => setRejectModal({ idAnggota: a.id_anggota, nama: a.nama })}
                                className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Tolak Berkas"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Ban / Unban Toggle */}
                          {userAccount && (
                            <button
                              onClick={() => {
                                if (isBanned) {
                                  unbanUser(userAccount.id);
                                } else {
                                  if (confirm(`Bekukan akun anggota ${a.nama}?`)) {
                                    banUser(userAccount.id, 'Pelanggaran peraturan perpustakaan');
                                  }
                                }
                              }}
                              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isBanned
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={isBanned ? 'Buka Blokir (Unban)' : 'Blokir Akun (Ban)'}
                            >
                              <Ban className="w-4 h-4" />
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

      {/* KTM Inspection Modal */}
      {selectedKtmPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Scan KTM: {selectedKtmPreview.nama}
              </h3>
              <button
                onClick={() => setSelectedKtmPreview(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-950 p-2 rounded-2xl flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedKtmPreview.url}
                alt="KTM Preview"
                className="max-h-[65vh] object-contain rounded-xl shadow"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
              Tolak Verifikasi KTM
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Anggota: <span className="font-semibold">{rejectModal.nama}</span>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Catatan Alasan Penolakan
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Tolak Berkas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
