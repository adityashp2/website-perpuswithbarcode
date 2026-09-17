'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import { compressImageUnder200KB } from '@/lib/imageCompressor';

export default function RegisterPage() {
  const router = useRouter();
  const { registerMember } = useData();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    email: '',
    telp: '',
    sex: 'L' as 'L' | 'P',
    alamat: '',
  });

  const [ktmFilePreview, setKtmFilePreview] = useState<string | null>(null);
  const [compressInfo, setCompressInfo] = useState<{ origKb: number; compKb: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMsg('');
    try {
      const result = await compressImageUnder200KB(file, { maxKb: 190 });
      setKtmFilePreview(result.dataUrl);
      setCompressInfo({ origKb: result.originalSizeKb, compKb: result.compressedSizeKb });
    } catch {
      setErrorMsg('Gagal memproses dan mengompres foto. Silakan coba pilih file gambar lain.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.username.trim() || !formData.nama.trim() || !formData.email.trim()) {
      setErrorMsg('Semua kolom bertanda bintang (*) wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerMember({
        ...formData,
        ktmFoto: ktmFilePreview || undefined,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        login(formData.username);
        setTimeout(() => {
          router.push('/member/dashboard');
        }, 2000);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat memproses pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', width: '100%', margin: '16px auto 32px', padding: '0 16px' }}>
      <div
        className="apple-card"
        style={{
          padding: 'clamp(24px, 5vw, 40px)',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--apple-border)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'var(--apple-accent-subtle)',
              color: 'var(--apple-accent)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px',
            }}
          >
            <i className="bx bxs-user-plus"></i>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--apple-text-primary)', margin: 0 }}>
            Pendaftaran Anggota Baru
          </h2>
          <p style={{ color: 'var(--apple-text-secondary)', fontSize: '13.5px', marginTop: '6px', lineHeight: 1.45 }}>
            Daftarkan diri Anda untuk mendapatkan akses peminjaman buku digital dan kartu anggota fisik di perpustakaan.
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            <i className="bx bx-error-circle" style={{ fontSize: '18px' }}></i>
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Contoh: mhs_polinela"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <div className="form-hint">Digunakan saat masuk ke sistem</div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nama Lengkap <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Sesuai nama di KTM"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Alamat Email <span className="required">*</span></label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="email@polinela.ac.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">No. Telepon / WhatsApp <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="08xxxxxxxxxx"
                value={formData.telp}
                onChange={(e) => setFormData({ ...formData, telp: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Jenis Kelamin <span className="required">*</span></label>
              <select
                className="form-control"
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'L' | 'P' })}
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Alamat Domisili <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Alamat tempat tinggal lengkap"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              />
            </div>
          </div>

          {/* KTM Upload Section */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid var(--apple-border)',
              borderRadius: 'var(--apple-radius-md)',
              padding: '18px',
              marginTop: '6px',
            }}
          >
            <label className="form-label" style={{ color: 'var(--apple-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bx bx-id-card" style={{ fontSize: '18px', color: 'var(--apple-accent)' }}></i>
              <span>Foto / Scan Kartu Tanda Mahasiswa (KTM)</span>
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
              {ktmFilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ktmFilePreview}
                  alt="KTM"
                  style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--apple-radius-md)', border: '2px solid var(--apple-accent)' }}
                />
              ) : (
                <div style={{ width: '120px', height: '80px', borderRadius: 'var(--apple-radius-md)', border: '1px dashed var(--apple-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                  <i className="bx bx-image-add" style={{ fontSize: '28px', color: 'var(--apple-text-tertiary)' }}></i>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-control"
                  style={{ background: '#fff' }}
                />
                {isCompressing && (
                  <div style={{ fontSize: '12px', color: 'var(--apple-accent)', marginTop: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '15px' }} />
                    <span>Mengompresi gambar otomatis di bawah 200 KB...</span>
                  </div>
                )}
                {compressInfo && !isCompressing && (
                  <div style={{ fontSize: '12px', color: 'var(--apple-success-text)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="bx bx-check-shield" style={{ fontSize: '15px' }} />
                    <span>Foto terkompresi otomatis: {compressInfo.origKb} KB ➔ {compressInfo.compKb} KB (Di bawah 200 KB ✓)</span>
                  </div>
                )}
                <div className="form-hint" style={{ color: 'var(--apple-text-secondary)', marginTop: '6px' }}>
                  Wajib diunggah untuk verifikasi keaktifan (otomatis dikompres di bawah 200 KB).
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="apple-btn-primary"
            style={{ width: '100%', minHeight: '42px', fontSize: '14.5px', marginTop: '8px' }}
          >
            <i className="bx bx-user-plus"></i> {isSubmitting ? 'Mendaftarkan...' : 'Kirim Pendaftaran Anggota'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--apple-border-subtle)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--apple-text-secondary)',
          }}
        >
          Sudah memiliki akun anggota?{' '}
          <Link href="/login" style={{ fontWeight: 600, color: 'var(--apple-accent)' }}>
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

