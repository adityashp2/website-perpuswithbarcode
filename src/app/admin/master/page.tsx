'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';

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

  const [cfgData, setCfgData] = useState({
    maxLamaPinjam: config.maxLamaPinjam || 3,
    dendaPerHari: config.dendaPerHari || 500,
  });

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
    setFeedback('Konfigurasi denda dan batas pinjam berhasil disimpan!');
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
    <>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Konfigurasi &amp; Master Data</h1>
          <p>Pengaturan tarif denda keterlambatan, batas hari pinjam, dan master data perpustakaan.</p>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success">
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }}></i>
          <div>{feedback}</div>
        </div>
      )}

      {/* 1. Aturan Denda */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <i className="bx bx-slider-alt"></i>
            <span>Konfigurasi Sirkulasi &amp; Denda</span>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSaveConfig}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Maksimal Lama Pinjam (Hari)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={cfgData.maxLamaPinjam}
                  onChange={(e) => setCfgData({ ...cfgData, maxLamaPinjam: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tarif Denda per Hari (Rupiah)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="form-control"
                  value={cfgData.dendaPerHari}
                  onChange={(e) => setCfgData({ ...cfgData, dendaPerHari: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary">
                <i className="bx bx-save"></i> Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Master Katalog */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">
            <i className="bx bx-category"></i>
            <span>Master Katalog &amp; Kategori ({katalog.length})</span>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleAddKatalog} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              required
              placeholder="Kode (contoh: KG5)"
              className="form-control"
              style={{ width: '140px' }}
              value={newKatalog.id}
              onChange={(e) => setNewKatalog({ ...newKatalog, id: e.target.value })}
            />
            <input
              type="text"
              required
              placeholder="Nama Kategori Baru"
              className="form-control"
              style={{ flex: 1 }}
              value={newKatalog.nama}
              onChange={(e) => setNewKatalog({ ...newKatalog, nama: e.target.value })}
            />
            <button type="submit" className="btn btn-primary">
              <i className="bx bx-plus"></i> Tambah
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {katalog.map((k) => (
              <div
                key={k.id_katalog}
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '11px', display: 'block' }}>
                    {k.id_katalog}
                  </span>
                  <strong style={{ fontSize: '13px' }}>{k.nama}</strong>
                </div>
                <button onClick={() => deleteKatalog(k.id_katalog)} className="btn btn-danger btn-sm" style={{ padding: '3px 6px' }}>
                  <i className="bx bx-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Penerbit & Pengarang Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Penerbit */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bx bx-buildings"></i>
              <span>Penerbit ({penerbit.length})</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddPenerbit} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Kode"
                className="form-control"
                style={{ width: '90px' }}
                value={newPenerbit.id}
                onChange={(e) => setNewPenerbit({ ...newPenerbit, id: e.target.value })}
              />
              <input
                type="text"
                placeholder="Nama Penerbit"
                className="form-control"
                style={{ flex: 1 }}
                value={newPenerbit.nama}
                onChange={(e) => setNewPenerbit({ ...newPenerbit, nama: e.target.value })}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <i className="bx bx-plus"></i>
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {penerbit.map((p) => (
                <div
                  key={p.id_penerbit}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-muted)' }}>{p.id_penerbit}</span>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.nama_penerbit}</div>
                  </div>
                  <button onClick={() => deletePenerbit(p.id_penerbit)} className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }}>
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pengarang */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bx bx-pencil"></i>
              <span>Pengarang ({pengarang.length})</span>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddPengarang} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Kode"
                className="form-control"
                style={{ width: '90px' }}
                value={newPengarang.id}
                onChange={(e) => setNewPengarang({ ...newPengarang, id: e.target.value })}
              />
              <input
                type="text"
                placeholder="Nama Pengarang"
                className="form-control"
                style={{ flex: 1 }}
                value={newPengarang.nama}
                onChange={(e) => setNewPengarang({ ...newPengarang, nama: e.target.value })}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <i className="bx bx-plus"></i>
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {pengarang.map((pg) => (
                <div
                  key={pg.id_pengarang}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-muted)' }}>{pg.id_pengarang}</span>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{pg.nama_pengarang}</div>
                  </div>
                  <button onClick={() => deletePengarang(pg.id_pengarang)} className="btn btn-danger btn-sm" style={{ padding: '2px 6px' }}>
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
