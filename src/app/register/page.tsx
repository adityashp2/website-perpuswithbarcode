'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';

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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtmFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    <div style={{ maxWidth: '680px', margin: '30px auto' }}>
      <div className="card" style={{ padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
            <i className="bx bxs-user-plus"></i>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Pendaftaran Anggota Baru
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '4px' }}>
            Daftar akun untuk meminjam buku dan mengakses layanan sirkulasi. Verifikasi KTM diperlukan sebelum akun aktif meminjam.
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <i className="bx bx-error-circle" style={{ fontSize: '18px' }}></i>
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <i className="bx bx-check-circle" style={{ fontSize: '18px' }}></i>
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Username <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Contoh: mhs_polinela"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <div className="form-hint">Digunakan untuk masuk ke sistem</div>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Lengkap <span className="required">*</span></label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Nama lengkap sesuai KTM"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
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

            <div className="form-group">
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
            <div className="form-group">
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

            <div className="form-group">
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
          <div className="form-group" style={{ background: 'var(--primary-light)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', marginTop: '10px' }}>
            <label className="form-label" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bx bx-id-card" style={{ fontSize: '18px' }}></i>
              <span>Foto / Scan Kartu Tanda Mahasiswa (KTM)</span>
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
              {ktmFilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ktmFilePreview}
                  alt="KTM"
                  style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '2px solid var(--primary)' }}
                />
              ) : (
                <div style={{ width: '120px', height: '80px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                  <i className="bx bx-image-add" style={{ fontSize: '28px', color: 'var(--primary)' }}></i>
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
                <div className="form-hint" style={{ color: '#475569' }}>
                  Wajib diunggah untuk verifikasi status mahasiswa aktif Polinela.
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '12px' }}
          >
            <i className="bx bx-user-plus"></i> {isSubmitting ? 'Mendaftarkan...' : 'Kirim Pendaftaran Anggota'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--card-border)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Sudah memiliki akun? <Link href="/login" style={{ fontWeight: 600 }}>Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}
