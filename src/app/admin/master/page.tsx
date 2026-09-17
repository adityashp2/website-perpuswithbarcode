'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { useBanners, Banner } from '@/lib/useBanners';
import { compressImageUnder200KB } from '@/lib/imageCompressor';

export default function AdminMasterPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuth();

  // Role & Permission Guard
  useEffect(() => {
    if (currentUser && currentUser.type !== 'ADM') {
      router.replace('/login');
    }
  }, [currentUser, router]);

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

  const { banners, addBanner, updateBanner, deleteBanner, toggleActive, moveUp, moveDown } = useBanners();

  // Active Tab: 'branding' | 'kartu' | 'aturan' | 'master'
  const [activeTab, setActiveTab] = useState<'branding' | 'kartu' | 'aturan' | 'master'>('branding');

  // Form states for Config
  const [brandingData, setBrandingData] = useState({
    namaInstansi: config.namaInstansi || 'Politeknik Negeri Lampung',
    namaPerpustakaan: config.namaPerpustakaan || 'Perpustakaan Terpadu Polinela',
    logoInstansi: config.logoInstansi || '/buku/1788324109_logo.jpg',
    alamatPerpustakaan: config.alamatPerpustakaan || 'Jl. Soekarno-Hatta No. 10, Rajabasa, Bandar Lampung',
    jamLayanan: config.jamLayanan || 'Senin – Jumat (08.00 – 16.00 WIB)',
    // Landing Page
    heroTag: config.heroTag || 'PUSTAKASCAN • POLINELA',
    heroTitle: config.heroTitle || 'Sirkulasi buku secepat kasir minimarket.',
    heroSubtitle: config.heroSubtitle || 'Petugas memindai barcode buku dan kartu anggota dalam 5 detik. Tanpa antrean panjang, lengkap dengan cetak slip thermal 58mm dan deteksi otomatis denda keterlambatan.',
    heroImage: config.heroImage || '/buku/1788324109_logo.jpg',
    // Kartu Anggota
    kartuJudul: config.kartuJudul || 'KARTU TANDA ANGGOTA PERPUSTAKAAN',
    kartuCatatan: config.kartuCatatan || 'Kartu ini sah sebagai identitas peminjaman buku resmi perpustakaan digital.',
    kartuColorTheme: config.kartuColorTheme || 'gradient-blue',
    // Sirkulasi & Denda
    maxLamaPinjam: config.maxLamaPinjam || 7,
    dendaPerHari: config.dendaPerHari || 500,
    ambangDendaBlokir: config.ambangDendaBlokir || 50000,
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Master Data forms
  const [newKatalog, setNewKatalog] = useState({ id: '', nama: '' });
  const [newPenerbit, setNewPenerbit] = useState({ id: '', nama: '', email: '', telp: '', alamat: '' });
  const [newPengarang, setNewPengarang] = useState({ id: '', nama: '', email: '', telp: '', alamat: '' });

  // Banner states
  const BLANK_BANNER = {
    title: '',
    subtitle: '',
    cta_label: '',
    cta_href: '/katalog',
    bg_color: 'linear-gradient(135deg, #0071e3 0%, #4facfe 100%)',
    text_color: '#ffffff',
    icon: 'bx-megaphone',
    active: true,
  };
  const [newBanner, setNewBanner] = useState(BLANK_BANNER);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Logo file upload handler with auto compression
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const result = await compressImageUnder200KB(file, { maxKb: 180, maxWidthOrHeight: 600 });
      setBrandingData((prev) => ({ ...prev, logoInstansi: result.dataUrl }));
      setFeedback('Logo instansi berhasil dimuat dan dikompres otomatis!');
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setFeedback('Gagal memproses gambar logo. Silakan gunakan format JPG atau PNG.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      ...brandingData,
      maxLamaPinjam: Number(brandingData.maxLamaPinjam),
      dendaPerHari: Number(brandingData.dendaPerHari),
      ambangDendaBlokir: Number(brandingData.ambangDendaBlokir),
    });
    setFeedback('Pengaturan branding, teks landing page, dan kartu anggota berhasil disimpan!');
    setTimeout(() => setFeedback(null), 4000);
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

  // Card themes
  const cardThemeGradients: Record<string, string> = {
    'gradient-blue': 'linear-gradient(135deg, #0071e3 0%, #1e3a8a 60%, #0f172a 100%)',
    'gradient-dark': 'linear-gradient(135deg, #1d1d1f 0%, #334155 60%, #0f172a 100%)',
    'gradient-emerald': 'linear-gradient(135deg, #059669 0%, #064e3b 60%, #022c22 100%)',
    'gradient-purple': 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 60%, #1e1b4b 100%)',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-header-info">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '99px',
              background: 'rgba(0, 113, 227, 0.1)',
              color: 'var(--apple-accent)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            <i className="bx bx-palette" /> PENGATURAN KUSTOMISASI &amp; SISTEM
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)', margin: 0 }}>
            Kustomisasi Instansi, Tampilan &amp; Aturan Sirkulasi
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--apple-text-secondary)', marginTop: '4px', margin: 0 }}>
            Ubah logo instansi, teks dan gambar landing page, desain kartu anggota, serta tarif denda dan master data perpustakaan.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className="alert alert-success"
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <i className="bx bx-check-circle" style={{ fontSize: '20px', color: '#34c759' }} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Apple Segmented Control Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          padding: '5px',
          background: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '16px',
          width: 'fit-content',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'branding' ? '#ffffff' : 'transparent',
            color: activeTab === 'branding' ? 'var(--apple-accent)' : 'var(--apple-text-secondary)',
            boxShadow: activeTab === 'branding' ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <i className="bx bx-home-alt" style={{ fontSize: '17px' }} />
          <span>Branding &amp; Landing Page</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kartu')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'kartu' ? '#ffffff' : 'transparent',
            color: activeTab === 'kartu' ? 'var(--apple-accent)' : 'var(--apple-text-secondary)',
            boxShadow: activeTab === 'kartu' ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <i className="bx bx-id-card" style={{ fontSize: '17px' }} />
          <span>Desain Kartu Anggota</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aturan')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'aturan' ? '#ffffff' : 'transparent',
            color: activeTab === 'aturan' ? 'var(--apple-accent)' : 'var(--apple-text-secondary)',
            boxShadow: activeTab === 'aturan' ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <i className="bx bx-slider-alt" style={{ fontSize: '17px' }} />
          <span>Aturan Denda &amp; Pinjam</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('master')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'master' ? '#ffffff' : 'transparent',
            color: activeTab === 'master' ? 'var(--apple-accent)' : 'var(--apple-text-secondary)',
            boxShadow: activeTab === 'master' ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <i className="bx bx-data" style={{ fontSize: '17px' }} />
          <span>Katalog, Penerbit &amp; Banner</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BRANDING, LOGO INSTANSI & TEKS LANDING PAGE */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Logo & Identitas Kampus / Sekolah */}
          <div className="apple-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0, 113, 227, 0.1)',
                  color: 'var(--apple-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="bx bx-image" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Logo Instansi &amp; Identitas Perpustakaan
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                  Logo ini akan tampil pada Beranda, Kartu Anggota Digital/Cetak, dan Struk Thermal Kasir.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
              {/* Logo Preview & Upload */}
              <div
                style={{
                  padding: '20px',
                  background: '#f8fafc',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '18px',
                    background: '#ffffff',
                    border: '1.5px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '8px',
                  }}
                >
                  {brandingData.logoInstansi ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brandingData.logoInstansi}
                      alt="Logo Instansi"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                      }}
                    />
                  ) : (
                    <i className="bx bx-image" style={{ fontSize: '36px', color: 'var(--apple-text-tertiary)' }} />
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--apple-text-primary)' }}>
                    Logo Instansi Aktif
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                    Format JPG, PNG (otomatis dikompres &lt; 200 KB)
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <label
                    className="apple-btn-primary"
                    style={{
                      padding: '7px 16px',
                      fontSize: '12.5px',
                      cursor: isUploadingLogo ? 'wait' : 'pointer',
                      gap: '6px',
                    }}
                  >
                    <i className="bx bx-upload" />
                    <span>{isUploadingLogo ? 'Memproses...' : 'Upload Logo Baru'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                  </label>

                  {brandingData.logoInstansi && (
                    <button
                      type="button"
                      onClick={() => setBrandingData((prev) => ({ ...prev, logoInstansi: '' }))}
                      className="apple-btn-secondary"
                      style={{ padding: '7px 12px', fontSize: '12.5px', color: '#ff3b30' }}
                      title="Hapus logo"
                    >
                      <i className="bx bx-trash" />
                    </button>
                  )}
                </div>

                <div style={{ width: '100%', marginTop: '4px' }}>
                  <label className="apple-label" style={{ textAlign: 'left', fontSize: '11.5px' }}>
                    Atau Masukkan URL Logo
                  </label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="https://contoh.ac.id/logo.png"
                    value={brandingData.logoInstansi}
                    onChange={(e) => setBrandingData({ ...brandingData, logoInstansi: e.target.value })}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Identity Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="apple-label">Nama Lembaga / Kampus / Sekolah</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="Contoh: Politeknik Negeri Lampung"
                    value={brandingData.namaInstansi}
                    onChange={(e) => setBrandingData({ ...brandingData, namaInstansi: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--apple-text-secondary)', marginTop: '3px', display: 'block' }}>
                    Akan ditampilkan pada kop kartu anggota dan struk kasir peminjaman.
                  </span>
                </div>

                <div>
                  <label className="apple-label">Nama Perpustakaan</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="Contoh: Perpustakaan Terpadu Polinela"
                    value={brandingData.namaPerpustakaan}
                    onChange={(e) => setBrandingData({ ...brandingData, namaPerpustakaan: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="apple-label">Alamat Gedung Perpustakaan</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="Contoh: Jl. Soekarno-Hatta No. 10, Rajabasa, Bandar Lampung"
                    value={brandingData.alamatPerpustakaan}
                    onChange={(e) => setBrandingData({ ...brandingData, alamatPerpustakaan: e.target.value })}
                  />
                </div>

                <div>
                  <label className="apple-label">Jadwal / Jam Layanan Meja Sirkulasi</label>
                  <input
                    type="text"
                    className="apple-input"
                    placeholder="Contoh: Senin – Jumat (08.00 – 16.00 WIB)"
                    value={brandingData.jamLayanan}
                    onChange={(e) => setBrandingData({ ...brandingData, jamLayanan: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Teks & Tampilan Landing Page */}
          <div className="apple-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(52, 199, 89, 0.1)',
                  color: '#248a3d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="bx bx-layout" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Teks &amp; Konten Hero Landing Page
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                  Sesuaikan teks utama, slogan promosi, dan deskripsi publik pada halaman beranda utama (/).
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="apple-label">Tagline / Eyebrow (Badge Atas)</label>
                <input
                  type="text"
                  className="apple-input"
                  placeholder="Contoh: PUSTAKASCAN • POLINELA"
                  value={brandingData.heroTag}
                  onChange={(e) => setBrandingData({ ...brandingData, heroTag: e.target.value })}
                />
              </div>

              <div>
                <label className="apple-label">Judul Utama Beranda (Hero Title)</label>
                <input
                  type="text"
                  className="apple-input"
                  placeholder="Contoh: Sirkulasi buku secepat kasir minimarket."
                  value={brandingData.heroTitle}
                  onChange={(e) => setBrandingData({ ...brandingData, heroTitle: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="apple-label">Deskripsi / Paragraf Hero</label>
                <textarea
                  className="apple-input"
                  rows={3}
                  placeholder="Deskripsi singkat layanan sirkulasi dan katalog..."
                  value={brandingData.heroSubtitle}
                  onChange={(e) => setBrandingData({ ...brandingData, heroSubtitle: e.target.value })}
                  style={{ resize: 'vertical', minHeight: '75px' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="submit" className="apple-btn-primary" style={{ padding: '9px 24px', fontSize: '13.5px', fontWeight: 600 }}>
                <i className="bx bx-save" /> Simpan Pengaturan Branding &amp; Beranda
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KUSTOMISASI DESAIN KARTU ANGGOTA (DIGITAL & CETAK) */}
      {/* ========================================================================= */}
      {activeTab === 'kartu' && (
        <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="apple-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(88, 86, 214, 0.12)',
                  color: '#5856d6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="bx bx-id-card" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Kustomisasi Desain &amp; Teks Kartu Anggota
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                  Atur judul kartu, teks kebijakan, tema warna, dan lihat pratinjau kartu anggota secara real-time.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'start' }}>
              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="apple-label">Judul Kartu Anggota</label>
                  <input
                    type="text"
                    className="apple-input"
                    value={brandingData.kartuJudul}
                    onChange={(e) => setBrandingData({ ...brandingData, kartuJudul: e.target.value })}
                    placeholder="KARTU TANDA ANGGOTA PERPUSTAKAAN"
                    required
                  />
                </div>

                <div>
                  <label className="apple-label">Catatan / Ketentuan di Kartu</label>
                  <textarea
                    className="apple-input"
                    rows={2}
                    value={brandingData.kartuCatatan}
                    onChange={(e) => setBrandingData({ ...brandingData, kartuCatatan: e.target.value })}
                    placeholder="Kartu ini sah sebagai identitas peminjaman buku resmi perpustakaan digital."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label className="apple-label">Tema Warna Kartu Anggota</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'gradient-blue', label: 'Apple Royal Blue', color: '#0071e3' },
                      { id: 'gradient-dark', label: 'Midnight Obsidian', color: '#1d1d1f' },
                      { id: 'gradient-emerald', label: 'Emerald Campus', color: '#059669' },
                      { id: 'gradient-purple', label: 'Royal Purple', color: '#7c3aed' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setBrandingData({ ...brandingData, kartuColorTheme: theme.id })}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: `2px solid ${brandingData.kartuColorTheme === theme.id ? theme.color : 'rgba(0,0,0,0.08)'}`,
                          background: brandingData.kartuColorTheme === theme.id ? 'rgba(0,0,0,0.04)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12.5px',
                        }}
                      >
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: theme.color }} />
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="apple-btn-primary"
                  style={{
                    padding: '10px 24px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    marginTop: '8px',
                  }}
                >
                  <i className="bx bx-save" /> Simpan Desain Kartu Anggota
                </button>
              </div>

              {/* Realtime Live Preview of Member Card */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--apple-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  PRATINJAU LANGSUNG (LIVE PREVIEW KARTU):
                </div>

                <div
                  style={{
                    background: cardThemeGradients[brandingData.kartuColorTheme || 'gradient-blue'] || cardThemeGradients['gradient-blue'],
                    borderRadius: '22px',
                    padding: '24px',
                    color: '#ffffff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card Header with Logo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        {brandingData.logoInstansi ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={brandingData.logoInstansi}
                            alt="Logo"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                            }}
                          />
                        ) : (
                          <i className="bx bx-book-bookmark" style={{ color: '#0071e3', fontSize: '24px' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>
                          {brandingData.namaInstansi}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                          {brandingData.kartuJudul}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '99px',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      MAHASISWA
                    </span>
                  </div>

                  {/* Member Fake Details */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '18px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#0071e3',
                      }}
                    >
                      S
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>Siti Rahmawati</div>
                      <div style={{ fontSize: '11.5px', opacity: 0.8, fontFamily: 'monospace' }}>
                        NIM: AG-20260205 • Berlaku: 2028-12-31
                      </div>
                      <div style={{ fontSize: '10.5px', opacity: 0.7, marginTop: '2px' }}>
                        {brandingData.namaPerpustakaan}
                      </div>
                    </div>
                  </div>

                  {/* Mock Barcode */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      color: '#1d1d1f',
                    }}
                  >
                    <div
                      style={{
                        height: '28px',
                        width: '100%',
                        background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px)',
                      }}
                    />
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, marginTop: '4px' }}>
                      AG-20260205
                    </div>
                  </div>

                  {/* Card Note */}
                  <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '12px', textAlign: 'center' }}>
                    {brandingData.kartuCatatan}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ATURAN SIRKULASI, DENDA & SANKSI BLOKIR */}
      {/* ========================================================================= */}
      {activeTab === 'aturan' && (
        <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="apple-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 149, 0, 0.12)',
                  color: '#ff9500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="bx bx-slider-alt" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Aturan Tarif Denda, Durasi Pinjam &amp; Sanksi Otomatis
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                  Konfigurasi ini digunakan langsung oleh mesin scanner kasir sirkulasi dan dashboard pantauan.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              {/* Max Duration */}
              <div>
                <label className="apple-label">Maksimal Durasi Peminjaman Standar (Hari)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    className="apple-input"
                    style={{ paddingRight: '60px', fontWeight: 700, fontSize: '15px' }}
                    value={brandingData.maxLamaPinjam}
                    onChange={(e) => setBrandingData({ ...brandingData, maxLamaPinjam: parseInt(e.target.value) || 1 })}
                    required
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--apple-text-tertiary)',
                    }}
                  >
                    Hari
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '4px' }}>
                  Durasi pinjam standar untuk siswa/mahasiswa (Guru otomatis 14 hari).
                </div>
              </div>

              {/* Daily Fine Rate */}
              <div>
                <label className="apple-label">Tarif Denda Keterlambatan per Hari (Rp)</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--apple-text-tertiary)',
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="apple-input"
                    style={{ paddingLeft: '44px', fontWeight: 700, fontSize: '15px' }}
                    value={brandingData.dendaPerHari}
                    onChange={(e) => setBrandingData({ ...brandingData, dendaPerHari: Math.max(0, parseInt(e.target.value) || 0) })}
                    required
                  />
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '4px' }}>
                  Tarif denda dihitung per hari terlambat dikali jumlah eksemplar buku.
                </div>
              </div>

              {/* Auto Block Threshold */}
              <div>
                <label className="apple-label">Ambang Denda untuk Auto-Blokir Akun (Rp)</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--apple-text-tertiary)',
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="any"
                    className="apple-input"
                    style={{ paddingLeft: '44px', fontWeight: 700, fontSize: '15px' }}
                    value={brandingData.ambangDendaBlokir}
                    onChange={(e) => setBrandingData({ ...brandingData, ambangDendaBlokir: Math.max(0, parseInt(e.target.value) || 0) })}
                    required
                  />
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '4px' }}>
                  Jika total denda melewati angka ini, sistem otomatis mengunci keanggotaan.
                </div>
              </div>
            </div>

            {/* Sanksi Info Banner */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                background: 'rgba(255, 149, 0, 0.08)',
                border: '1px solid rgba(255, 149, 0, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <i className="bx bx-shield-quarter" style={{ fontSize: '22px', color: '#d97706', marginTop: '1px' }} />
              <div style={{ fontSize: '13px', color: 'var(--apple-text-primary)', lineHeight: 1.55 }}>
                <strong>Logika Sanksi Sirkulasi yang Berlaku:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', color: 'var(--apple-text-secondary)' }}>
                  <li><strong>Ada Denda (&gt; Rp 0):</strong> Mahasiswa dicekal sementara dari meminjam buku baru hingga denda dilunasi.</li>
                  <li><strong>Denda Berat (&gt; Rp {brandingData.ambangDendaBlokir.toLocaleString('id-ID')}):</strong> Akun diblokir penuh oleh sistem dan status menjadi <code>blocked</code>. Wajib menemui Admin Perpustakaan secara fisik untuk verifikasi pelunasan dan buka blokir.</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="apple-btn-primary" style={{ padding: '9px 24px', fontSize: '13.5px', fontWeight: 600 }}>
                <i className="bx bx-save" /> Simpan Aturan Sirkulasi &amp; Denda
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MASTER DATA KATALOG, PENERBIT, PENGARANG & BANNER */}
      {/* ========================================================================= */}
      {activeTab === 'master' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Master Katalog */}
          <div className="apple-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(52, 199, 89, 0.1)',
                  color: '#248a3d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                <i className="bx bx-category" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Master Kategori &amp; Katalog Buku ({katalog.length})
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                  Klasifikasi DDC katalog untuk pencarian di katalog publik (OPAC).
                </div>
              </div>
            </div>

            <form onSubmit={handleAddKatalog} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 120px', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  required
                  placeholder="Kode (misal: KG5)"
                  className="apple-input"
                  value={newKatalog.id}
                  onChange={(e) => setNewKatalog({ ...newKatalog, id: e.target.value })}
                />
                <input
                  type="text"
                  required
                  placeholder="Nama Kategori Baru"
                  className="apple-input"
                  value={newKatalog.nama}
                  onChange={(e) => setNewKatalog({ ...newKatalog, nama: e.target.value })}
                />
                <button type="submit" className="apple-btn-primary" style={{ width: '100%', height: '42px', fontWeight: 600 }}>
                  <i className="bx bx-plus" /> Tambah
                </button>
              </div>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {katalog.map((k) => (
                <div
                  key={k.id_katalog}
                  style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--apple-accent)', fontSize: '11px', display: 'block' }}>
                      {k.id_katalog}
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {k.nama}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus kategori "${k.nama}"?`)) deleteKatalog(k.id_katalog);
                    }}
                    className="apple-btn-secondary"
                    style={{ padding: '6px 8px', color: '#ff3b30', borderColor: 'rgba(255, 59, 48, 0.3)', fontSize: '13px', minHeight: '30px' }}
                    title="Hapus"
                  >
                    <i className="bx bx-trash" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Penerbit & Pengarang Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Penerbit */}
            <div className="apple-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <i className="bx bx-buildings" style={{ color: 'var(--apple-accent)', fontSize: '20px' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Penerbit ({penerbit.length})
                </h2>
              </div>
              <form onSubmit={handleAddPenerbit} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Kode"
                  className="apple-input"
                  style={{ width: '80px', flexShrink: 0 }}
                  value={newPenerbit.id}
                  onChange={(e) => setNewPenerbit({ ...newPenerbit, id: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Nama Penerbit"
                  className="apple-input"
                  style={{ flex: 1, minWidth: '130px' }}
                  value={newPenerbit.nama}
                  onChange={(e) => setNewPenerbit({ ...newPenerbit, nama: e.target.value })}
                  required
                />
                <button type="submit" className="apple-btn-primary" style={{ padding: '0 14px', height: '42px', flexShrink: 0 }}>
                  <i className="bx bx-plus" />
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {penerbit.map((p) => (
                  <div key={p.id_penerbit} style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--apple-text-tertiary)' }}>{p.id_penerbit}</span>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nama_penerbit}
                      </div>
                    </div>
                    <button type="button" onClick={() => { if (confirm(`Hapus "${p.nama_penerbit}"?`)) deletePenerbit(p.id_penerbit); }} className="apple-btn-secondary" style={{ padding: '4px 8px', color: '#ff3b30', fontSize: '12px' }} title="Hapus">
                      <i className="bx bx-trash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pengarang */}
            <div className="apple-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <i className="bx bx-pencil" style={{ color: '#5856d6', fontSize: '20px' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Pengarang ({pengarang.length})
                </h2>
              </div>
              <form onSubmit={handleAddPengarang} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Kode"
                  className="apple-input"
                  style={{ width: '80px', flexShrink: 0 }}
                  value={newPengarang.id}
                  onChange={(e) => setNewPengarang({ ...newPengarang, id: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Nama Pengarang"
                  className="apple-input"
                  style={{ flex: 1, minWidth: '130px' }}
                  value={newPengarang.nama}
                  onChange={(e) => setNewPengarang({ ...newPengarang, nama: e.target.value })}
                  required
                />
                <button type="submit" className="apple-btn-primary" style={{ padding: '0 14px', height: '42px', flexShrink: 0 }}>
                  <i className="bx bx-plus" />
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {pengarang.map((pg) => (
                  <div key={pg.id_pengarang} style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid rgba(0, 0, 0, 0.06)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--apple-text-tertiary)' }}>{pg.id_pengarang}</span>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pg.nama_pengarang}
                      </div>
                    </div>
                    <button type="button" onClick={() => { if (confirm(`Hapus "${pg.nama_pengarang}"?`)) deletePengarang(pg.id_pengarang); }} className="apple-btn-secondary" style={{ padding: '4px 8px', color: '#ff3b30', fontSize: '12px' }} title="Hapus">
                      <i className="bx bx-trash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Banner Promosi */}
          <div className="apple-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <i className="bx bx-image-alt" style={{ color: '#ff9500', fontSize: '20px' }} />
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                  Kelola Banner Promosi &amp; Pengumuman ({banners.length})
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>
                  Atur banner informasi yang muncul pada carousel beranda.
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="apple-label">Judul Banner</label>
                  <input
                    className="apple-input"
                    placeholder="Judul banner"
                    value={editingBanner ? editingBanner.title : newBanner.title}
                    onChange={(e) => editingBanner
                      ? setEditingBanner({ ...editingBanner, title: e.target.value })
                      : setNewBanner({ ...newBanner, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apple-label">Icon Boxicons</label>
                  <input
                    className="apple-input"
                    placeholder="bx-book-open"
                    value={editingBanner ? editingBanner.icon : newBanner.icon}
                    onChange={(e) => editingBanner
                      ? setEditingBanner({ ...editingBanner, icon: e.target.value })
                      : setNewBanner({ ...newBanner, icon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apple-label">Label Tombol</label>
                  <input
                    className="apple-input"
                    placeholder="Jelajahi Katalog"
                    value={editingBanner ? editingBanner.cta_label : newBanner.cta_label}
                    onChange={(e) => editingBanner
                      ? setEditingBanner({ ...editingBanner, cta_label: e.target.value })
                      : setNewBanner({ ...newBanner, cta_label: e.target.value })}
                  />
                </div>
                <div>
                  <label className="apple-label">Link Tombol</label>
                  <input
                    className="apple-input"
                    placeholder="/katalog"
                    value={editingBanner ? editingBanner.cta_href : newBanner.cta_href}
                    onChange={(e) => editingBanner
                      ? setEditingBanner({ ...editingBanner, cta_href: e.target.value })
                      : setNewBanner({ ...newBanner, cta_href: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                {editingBanner ? (
                  <>
                    <button
                      type="button"
                      className="apple-btn-primary"
                      onClick={() => {
                        updateBanner(editingBanner.id, editingBanner);
                        setEditingBanner(null);
                        setFeedback('Banner berhasil diperbarui!');
                        setTimeout(() => setFeedback(null), 3000);
                      }}
                    >
                      <i className="bx bx-save" /> Simpan Perubahan
                    </button>
                    <button type="button" className="apple-btn-secondary" onClick={() => setEditingBanner(null)}>
                      Batal
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="apple-btn-primary"
                    onClick={() => {
                      if (!newBanner.title) return;
                      addBanner(newBanner);
                      setNewBanner(BLANK_BANNER);
                      setFeedback('Banner berhasil ditambahkan!');
                      setTimeout(() => setFeedback(null), 3000);
                    }}
                    disabled={!newBanner.title}
                  >
                    <i className="bx bx-plus" /> Tambah Banner
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...banners].sort((a, b) => a.order - b.order).map((banner, idx) => (
                <div
                  key={banner.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '12px',
                    opacity: banner.active ? 1 : 0.6,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px', flex: 1 }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: banner.bg_color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: banner.text_color, fontSize: '18px' }}>
                      <i className={`bx ${banner.icon}`} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--apple-text-primary)' }}>{banner.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>{banner.subtitle}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button type="button" onClick={() => moveUp(banner.id)} disabled={idx === 0} className="apple-btn-secondary" style={{ padding: '4px 8px', minHeight: '30px' }} title="Pindah ke atas">
                      <i className="bx bx-chevron-up" />
                    </button>
                    <button type="button" onClick={() => moveDown(banner.id)} disabled={idx === banners.length - 1} className="apple-btn-secondary" style={{ padding: '4px 8px', minHeight: '30px' }} title="Pindah ke bawah">
                      <i className="bx bx-chevron-down" />
                    </button>
                    <button type="button" onClick={() => toggleActive(banner.id)} className="apple-btn-secondary" style={{ padding: '4px 10px', minHeight: '30px', fontSize: '11.5px', color: banner.active ? '#d97706' : '#248a3d' }} title="Toggle">
                      <i className={`bx ${banner.active ? 'bx-hide' : 'bx-show'}`} />
                    </button>
                    <button type="button" onClick={() => setEditingBanner(banner)} className="apple-btn-secondary" style={{ padding: '4px 8px', minHeight: '30px' }} title="Edit">
                      <i className="bx bx-edit" />
                    </button>
                    <button type="button" onClick={() => { if (confirm(`Hapus banner "${banner.title}"?`)) deleteBanner(banner.id); }} className="apple-btn-secondary" style={{ padding: '4px 8px', minHeight: '30px', color: '#ff3b30' }} title="Hapus">
                      <i className="bx bx-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
