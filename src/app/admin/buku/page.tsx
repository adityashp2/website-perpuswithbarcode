'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import BarcodeModal from '@/components/BarcodeModal';
import { Buku } from '@/types/database';

export default function AdminBukuPage() {
  const { buku, katalog, penerbit, pengarang, addBuku, deleteBuku, updateStok } = useData();

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
    <>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Manajemen Data Buku</h1>
          <p>Total {buku.length} judul buku tersimpan dalam basis data perpustakaan.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              if (buku.length > 0) setSelectedBarcodeBuku(buku[0]);
            }}
            className="btn btn-secondary"
          >
            <i className="bx bx-barcode"></i> Cetak Label Barcode
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <i className="bx bx-plus-circle"></i> Tambah Buku Baru
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <i className="bx bx-search" style={{ fontSize: '20px', color: 'var(--text-muted)' }}></i>
          <input
            type="text"
            className="form-control"
            placeholder="Cari berdasarkan judul buku, nomor ISBN, atau nama pengarang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Cover</th>
                <th style={{ width: '130px' }}>ISBN / Barcode</th>
                <th>Judul Buku</th>
                <th>Pengarang</th>
                <th>Penerbit</th>
                <th style={{ width: '80px' }}>Tahun</th>
                <th>Kategori</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Stok</th>
                <th style={{ width: '170px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuku.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <i className="bx bx-book-open" style={{ fontSize: '36px', display: 'block', marginBottom: '8px', color: 'var(--text-light)' }}></i>
                    Belum ada data buku yang sesuai. Klik tombol &quot;Tambah Buku Baru&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                filteredBuku.map((b) => (
                  <tr key={b.isbn}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.foto || '/default-book-cover.svg'}
                        alt={b.judul}
                        style={{
                          width: '62px',
                          height: '78px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '1px solid var(--card-border)',
                          background: '#f8fafc',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                        }}
                      />
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: 'var(--primary)' }}>
                          {b.isbn}
                        </span>
                        <button
                          onClick={() => setSelectedBarcodeBuku(b)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px', gap: '4px' }}
                          title="Cetak Barcode Buku"
                        >
                          <i className="bx bx-barcode"></i> Cetak
                        </button>
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: '#0f172a', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
                        {b.judul}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Maks Pinjam: {b.maks_pinjam_per_anggota || 1} eks / akun
                      </span>
                    </td>

                    <td>{b.pengarang?.nama_pengarang || '-'}</td>
                    <td>{b.penerbit?.nama_penerbit || '-'}</td>
                    <td>{b.tahun}</td>

                    <td>
                      <span className="badge badge-info">
                        {b.katalog?.nama || b.id_katalog}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${b.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                          {b.qty_stok}
                        </span>
                        <button
                          onClick={() => {
                            setEditingStokBuku({ isbn: b.isbn, current: b.qty_stok });
                            setNewStokVal(b.qty_stok);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px' }}
                          title="Ubah Kuota Stok"
                        >
                          <i className="bx bx-edit-alt"></i>
                        </button>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedBarcodeBuku(b)}
                          className="btn btn-secondary btn-sm"
                          title="Pratinjau Barcode"
                        >
                          <i className="bx bx-barcode"></i>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus buku "${b.judul}"?`)) {
                              deleteBuku(b.isbn);
                            }
                          }}
                          className="btn btn-danger btn-sm"
                          title="Hapus Buku"
                        >
                          <i className="bx bx-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ubah Stok */}
      {editingStokBuku && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>
              Update Stok Buku
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              ISBN: <code style={{ color: 'var(--primary)' }}>{editingStokBuku.isbn}</code>
            </p>
            <div className="form-group">
              <label className="form-label">Jumlah Eksemplar Tersedia</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={newStokVal}
                onChange={(e) => setNewStokVal(parseInt(e.target.value) || 0)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setEditingStokBuku(null)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={handleUpdateStokSubmit} className="btn btn-primary">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Buku */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '28px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Tambah Buku Baru
              </h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                <i className="bx bx-x" style={{ fontSize: '18px' }}></i>
              </button>
            </div>

            <form onSubmit={handleSaveBook}>
              <div className="form-group">
                <label className="form-label">Nomor ISBN (Otomatis Jadi Barcode) <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Contoh: 978-623-01-0812-7"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Judul Lengkap Buku <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Judul buku"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tahun Terbit</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) || 2024 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jumlah Stok Eksemplar</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.qty_stok}
                    onChange={(e) => setFormData({ ...formData, qty_stok: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label className="form-label">Katalog Kategori</label>
                  <select
                    className="form-control"
                    value={formData.id_katalog}
                    onChange={(e) => setFormData({ ...formData, id_katalog: e.target.value })}
                  >
                    {katalog.map((k) => (
                      <option key={k.id_katalog} value={k.id_katalog}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Penerbit</label>
                  <select
                    className="form-control"
                    value={formData.id_penerbit}
                    onChange={(e) => setFormData({ ...formData, id_penerbit: e.target.value })}
                  >
                    {penerbit.map((p) => (
                      <option key={p.id_penerbit} value={p.id_penerbit}>{p.nama_penerbit}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Pengarang</label>
                  <select
                    className="form-control"
                    value={formData.id_pengarang}
                    onChange={(e) => setFormData({ ...formData, id_pengarang: e.target.value })}
                  >
                    {pengarang.map((p) => (
                      <option key={p.id_pengarang} value={p.id_pengarang}>{p.nama_pengarang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Path Foto Cover (Opsional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="/buku/nama_gambar.jpg atau default"
                  value={formData.foto}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="bx bx-save"></i> Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBarcodeBuku && (
        <BarcodeModal
          buku={selectedBarcodeBuku}
          onClose={() => setSelectedBarcodeBuku(null)}
        />
      )}
    </>
  );
}
