'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import { 
  Settings, 
  Layers, 
  Building, 
  User, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Clock, 
  DollarSign 
} from 'lucide-react';

export default function AdminMasterPage() {
  const { 
    config, 
    updateConfig, 
    katalog, 
    addKatalog, 
    deleteKatalog, 
    penerbit, 
    addPenerbit, 
    deletePenerbit, 
    pengarang, 
    addPengarang, 
    deletePengarang 
  } = useData();

  // Config form state
  const [cfgData, setCfgData] = useState({
    maxLamaPinjam: config.maxLamaPinjam || 3,
    dendaPerHari: config.dendaPerHari || 500,
  });

  // Master Forms state
  const [newKatalog, setNewKatalog] = useState({ id: '', nama: '' });
  const [newPenerbit, setNewPenerbit] = useState({ id: '', nama: '', email: '', telp: '', alamat: '' });
  const [newPengarang, setNewPengarang] = useState({ id: '', nama: '', email: '', telp: '', alamat: '' });
  
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      id: config.id || 1,
      maxLamaPinjam: Number(cfgData.maxLamaPinjam),
      dendaPerHari: Number(cfgData.dendaPerHari),
    });
    setFeedback('Konfigurasi perpustakaan berhasil disimpan!');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAddKatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKatalog.id || !newKatalog.nama) return;
    await addKatalog({ id_katalog: newKatalog.id, nama: newKatalog.nama });
    setNewKatalog({ id: '', nama: '' });
    setFeedback('Katalog berhasil ditambahkan!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddPenerbit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPenerbit.id || !newPenerbit.nama) return;
    await addPenerbit({
      id_penerbit: newPenerbit.id,
      nama_penerbit: newPenerbit.nama,
      email: newPenerbit.email,
      telp: newPenerbit.telp,
      alamat: newPenerbit.alamat,
    });
    setNewPenerbit({ id: '', nama: '', email: '', telp: '', alamat: '' });
    setFeedback('Penerbit berhasil ditambahkan!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddPengarang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPengarang.id || !newPengarang.nama) return;
    await addPengarang({
      id_pengarang: newPengarang.id,
      nama_pengarang: newPengarang.nama,
      email: newPengarang.email,
      telp: newPengarang.telp,
      alamat: newPengarang.alamat,
    });
    setNewPengarang({ id: '', nama: '', email: '', telp: '', alamat: '' });
    setFeedback('Pengarang berhasil ditambahkan!');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
          Pengaturan & Master Data Perpustakaan
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Konfigurasi batas sirkulasi, tarif denda keterlambatan, dan data master referensi
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 1. Perpustakaan Config Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Aturan Sirkulasi & Denda
            </h2>
            <p className="text-xs text-zinc-500">
              Menentukan batas hari pinjam dan denda otomatis untuk seluruh transaksi
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Maksimal Lama Pinjam (Hari)
            </label>
            <input
              type="number"
              min="1"
              value={cfgData.maxLamaPinjam}
              onChange={(e) => setCfgData({ ...cfgData, maxLamaPinjam: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tarif Denda Keterlambatan per Hari (Rupiah)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={cfgData.dendaPerHari}
              onChange={(e) => setCfgData({ ...cfgData, dendaPerHari: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end mt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Aturan Sirkulasi</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Master Katalog */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Master Kategori & Katalog
            </h2>
            <p className="text-xs text-zinc-500">Pengelompokan rak buku dan klasifikasi ilmu</p>
          </div>
        </div>

        <form onSubmit={handleAddKatalog} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            required
            placeholder="Kode (contoh: KG5)"
            value={newKatalog.id}
            onChange={(e) => setNewKatalog({ ...newKatalog, id: e.target.value })}
            className="w-full sm:w-36 px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl uppercase font-mono"
          />
          <input
            type="text"
            required
            placeholder="Nama Kategori Baru"
            value={newKatalog.nama}
            onChange={(e) => setNewKatalog({ ...newKatalog, nama: e.target.value })}
            className="flex-1 px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {katalog.map((k) => (
            <div
              key={k.id_katalog}
              className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-mono font-bold text-blue-600 block">{k.id_katalog}</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{k.nama}</span>
              </div>
              <button
                onClick={() => deleteKatalog(k.id_katalog)}
                className="p-1 text-zinc-400 hover:text-rose-600 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Master Penerbit & Pengarang Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Penerbit */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            Data Penerbit ({penerbit.length})
          </h2>

          <form onSubmit={handleAddPenerbit} className="space-y-2 mb-4 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Kode (PN04)"
                value={newPenerbit.id}
                onChange={(e) => setNewPenerbit({ ...newPenerbit, id: e.target.value })}
                className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase"
              />
              <input
                type="text"
                placeholder="Nama Penerbit"
                value={newPenerbit.nama}
                onChange={(e) => setNewPenerbit({ ...newPenerbit, nama: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Penerbit</span>
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {penerbit.map((p) => (
              <div
                key={p.id_penerbit}
                className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-[10px] text-zinc-400 block">{p.id_penerbit}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{p.nama_penerbit}</span>
                </div>
                <button
                  onClick={() => deletePenerbit(p.id_penerbit)}
                  className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pengarang */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-600" />
            Data Pengarang ({pengarang.length})
          </h2>

          <form onSubmit={handleAddPengarang} className="space-y-2 mb-4 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Kode (PG04)"
                value={newPengarang.id}
                onChange={(e) => setNewPengarang({ ...newPengarang, id: e.target.value })}
                className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono uppercase"
              />
              <input
                type="text"
                placeholder="Nama Pengarang"
                value={newPengarang.nama}
                onChange={(e) => setNewPengarang({ ...newPengarang, nama: e.target.value })}
                className="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengarang</span>
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {pengarang.map((pg) => (
              <div
                key={pg.id_pengarang}
                className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono text-[10px] text-zinc-400 block">{pg.id_pengarang}</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{pg.nama_pengarang}</span>
                </div>
                <button
                  onClick={() => deletePengarang(pg.id_pengarang)}
                  className="p-1 text-zinc-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
