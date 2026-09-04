'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import BarcodeModal from '@/components/BarcodeModal';
import { Buku } from '@/types/database';
import { 
  Plus, 
  Search, 
  Barcode, 
  Trash2, 
  Edit, 
  BookOpen, 
  Check, 
  X, 
  Layers,
  ArrowUpDown
} from 'lucide-react';

export default function AdminBukuPage() {
  const { buku, katalog, penerbit, pengarang, addBuku, deleteBuku, updateStok } = useData();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedBarcodeBuku, setSelectedBarcodeBuku] = useState<Buku | null>(null);
  
  // Stock edit state
  const [editingStokBuku, setEditingStokBuku] = useState<{ isbn: string; current: number } | null>(null);
  const [newStokVal, setNewStokVal] = useState<number>(0);

  // Add Book Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    isbn: '',
    judul: '',
    tahun: new Date().getFullYear(),
    id_katalog: katalog[0]?.id_katalog || 'KG0',
    id_penerbit: penerbit[0]?.id_penerbit || 'PN01',
    id_pengarang: pengarang[0]?.id_pengarang || 'PG01',
    qty_stok: 5,
    maks_pinjam_per_anggota: 1,
    foto: '',
  });

  const filteredBuku = buku.filter(
    (b) =>
      b.judul.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase()) ||
      (b.pengarang?.nama_pengarang && b.pengarang.nama_pengarang.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.isbn.trim() || !formData.judul.trim()) return;

    const matchedKatalog = katalog.find((k) => k.id_katalog === formData.id_katalog);
    const matchedPenerbit = penerbit.find((p) => p.id_penerbit === formData.id_penerbit);
    const matchedPengarang = pengarang.find((p) => p.id_pengarang === formData.id_pengarang);

    const newBook: Buku = {
      ...formData,
      katalog: matchedKatalog,
      penerbit: matchedPenerbit,
      pengarang: matchedPengarang,
      foto: formData.foto || '/default-book-cover.svg',
    };

    await addBuku(newBook);
    setShowAddModal(false);
    setFormData({
      isbn: '',
      judul: '',
      tahun: new Date().getFullYear(),
      id_katalog: katalog[0]?.id_katalog || 'KG0',
      id_penerbit: penerbit[0]?.id_penerbit || 'PN01',
      id_pengarang: pengarang[0]?.id_pengarang || 'PG01',
      qty_stok: 5,
      maks_pinjam_per_anggota: 1,
      foto: '',
    });
  };

  const handleUpdateStokSubmit = async () => {
    if (editingStokBuku) {
      await updateStok(editingStokBuku.isbn, newStokVal);
      setEditingStokBuku(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Kelola Koleksi Buku & Barcode
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Tambah judul koleksi baru, perbarui kuota stok eksemplar, dan cetak stiker barcode ISBN
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Judul Buku Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan judul, ISBN, atau nama pengarang..."
          className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 font-semibold border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="p-4">Cover & Judul</th>
                <th className="p-4">ISBN / Barcode</th>
                <th className="p-4">Kategori & Penerbit</th>
                <th className="p-4">Stok</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredBuku.map((item) => (
                <tr key={item.isbn} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden shrink-0 flex items-center justify-center">
                        {item.foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.foto}
                            alt=""
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <BookOpen className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-zinc-900 dark:text-white block">
                          {item.judul}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Pengarang: {item.pengarang?.nama_pengarang || '-'} • Tahun {item.tahun}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                      {item.isbn}
                    </span>
                    <button
                      onClick={() => setSelectedBarcodeBuku(item)}
                      className="mt-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Barcode className="w-3.5 h-3.5" />
                      Cetak Barcode
                    </button>
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold block w-fit mb-1">
                      {item.katalog?.nama || item.id_katalog}
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      {item.penerbit?.nama_penerbit || '-'}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${item.qty_stok > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.qty_stok}
                      </span>
                      <button
                        onClick={() => {
                          setEditingStokBuku({ isbn: item.isbn, current: item.qty_stok });
                          setNewStokVal(item.qty_stok);
                        }}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                        title="Perbarui Stok"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Yakin ingin menghapus buku "${item.judul}"?`)) {
                          deleteBuku(item.isbn);
                        }
                      }}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Hapus Buku"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Edit Modal */}
      {editingStokBuku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-2">
              Perbarui Stok Buku
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              ISBN: <span className="font-mono">{editingStokBuku.isbn}</span>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Jumlah Stok Baru
              </label>
              <input
                type="number"
                min="0"
                value={newStokVal}
                onChange={(e) => setNewStokVal(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingStokBuku(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStokSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Simpan Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Tambah Judul Buku Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nomor ISBN (Akan Jadi Barcode) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  placeholder="Contoh: 978-623-01-0812-7"
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Judul Buku Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Judul buku"
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tahun Terbit
                  </label>
                  <input
                    type="number"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.qty_stok}
                    onChange={(e) => setFormData({ ...formData, qty_stok: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.id_katalog}
                    onChange={(e) => setFormData({ ...formData, id_katalog: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                  >
                    {katalog.map((k) => (
                      <option key={k.id_katalog} value={k.id_katalog}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Penerbit
                  </label>
                  <select
                    value={formData.id_penerbit}
                    onChange={(e) => setFormData({ ...formData, id_penerbit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                  >
                    {penerbit.map((p) => (
                      <option key={p.id_penerbit} value={p.id_penerbit}>
                        {p.nama_penerbit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Pengarang
                  </label>
                  <select
                    value={formData.id_pengarang}
                    onChange={(e) => setFormData({ ...formData, id_pengarang: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white"
                  >
                    {pengarang.map((p) => (
                      <option key={p.id_pengarang} value={p.id_pengarang}>
                        {p.nama_pengarang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL / Path Foto Sampul (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.foto}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                  placeholder="/buku/nama_gambar.jpg atau URL online"
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
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
