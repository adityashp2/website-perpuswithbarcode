'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Masukkan username Anda!');
      return;
    }

    const res = login(username);
    if (res.success) {
      if (res.role === 'ADM') {
        router.push('/admin/dashboard');
      } else {
        router.push('/member/dashboard');
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  const fillLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div
      style={{
        maxWidth: '1080px',
        margin: '24px auto 60px',
        padding: '0 16px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Campus Library Identity & Concrete Value Points (SKILL_APPLE + SKILL2) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '99px',
                background: 'rgba(0, 113, 227, 0.1)',
                color: 'var(--apple-accent)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              <i className="bx bx-book-bookmark" />
              <span>PERPUSTAKAAN POLINELA</span>
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 3.5vw, 40px)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                color: 'var(--apple-text-primary)',
                margin: '0 0 12px',
              }}
            >
              Sistem Sirkulasi &amp; Peminjaman Buku Cepat
            </h1>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--apple-text-secondary)',
                margin: 0,
                maxWidth: '520px',
              }}
            >
              Akses katalog terbuka (OPAC), peminjaman mandiri dengan kartu anggota ber-barcode, dan pengembalian buku di meja kasir sirkulasi.
            </p>
          </div>

          {/* Concrete Feature Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(0, 113, 227, 0.12)',
                  color: 'var(--apple-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                <i className="bx bx-barcode-reader" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--apple-text-primary)' }}>
                  Pemindaian Barcode Kasir 5 Detik
                </div>
                <div style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                  Petugas kasir memindai barcode buku dan kartu anggota untuk pencatatan transaksi secara langsung.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(52, 199, 89, 0.12)',
                  color: '#248a3d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                <i className="bx bx-layer" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--apple-text-primary)' }}>
                  100+ Koleksi Buku &amp; Stok Real-Time
                </div>
                <div style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                  Cek ketersediaan eksemplar fisik dan posisi rak sebelum datang mengambil buku ke perpustakaan.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 149, 0, 0.12)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                <i className="bx bx-receipt" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--apple-text-primary)' }}>
                  Slip Peminjaman Thermal 58mm
                </div>
                <div style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginTop: '2px', lineHeight: 1.45 }}>
                  Cetak struk peminjaman format kasir minimarket dengan nomor transaksi dan tanggal batas kembali.
                </div>
              </div>
            </div>
          </div>

          {/* Live Service Status Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '12px',
              background: 'rgba(52, 199, 89, 0.08)',
              border: '1px solid rgba(52, 199, 89, 0.25)',
              fontSize: '12.5px',
              color: '#1e7e34',
              fontWeight: 600,
              width: 'fit-content',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34c759' }} />
            <span>Layanan Sirkulasi Aktif • Tarif denda keterlambatan: Rp 500 / hari</span>
          </div>
        </div>

        {/* Right Column: Tactile Apple Glass Login Card */}
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <div
            className="apple-card"
            style={{
              padding: 'clamp(28px, 4vw, 36px)',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '20px',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
                  margin: '0 auto 14px',
                }}
              >
                <i className="bx bxs-user-badge" />
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--apple-text-primary)',
                  margin: 0,
                }}
              >
                Masuk ke Akun
              </h2>
              <p
                style={{
                  color: 'var(--apple-text-secondary)',
                  fontSize: '13px',
                  marginTop: '6px',
                  lineHeight: 1.4,
                }}
              >
                Gunakan akun petugas perpustakaan atau akun mahasiswa untuk melanjutkan.
              </p>
            </div>

            {errorMsg && (
              <div
                className="alert alert-danger"
                style={{
                  marginBottom: '18px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="bx bx-error-circle" style={{ fontSize: '18px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="apple-label">Username Akun</label>
                <div style={{ position: 'relative' }}>
                  <i
                    className="bx bx-user"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--apple-text-tertiary)',
                      fontSize: '17px',
                    }}
                  />
                  <input
                    type="text"
                    className="apple-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="apple-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <i
                    className="bx bx-lock-alt"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--apple-text-tertiary)',
                      fontSize: '17px',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="apple-input"
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--apple-text-tertiary)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                    }}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`} style={{ fontSize: '18px' }} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="apple-btn-primary"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  marginTop: '4px',
                }}
              >
                Masuk ke Akun
              </button>
            </form>

            <div
              style={{
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '1px solid var(--apple-border-subtle)',
                textAlign: 'center',
                fontSize: '13px',
                color: 'var(--apple-text-secondary)',
              }}
            >
              Belum memiliki akun anggota?{' '}
              <Link href="/register" style={{ fontWeight: 600, color: 'var(--apple-accent)' }}>
                Daftar anggota baru di sini
              </Link>
            </div>

            {/* Apple Segmented Quick Demo Accounts */}
            <div
              style={{
                marginTop: '18px',
                padding: '14px',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 'var(--apple-radius-md)',
                border: '1px solid var(--apple-border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--apple-text-tertiary)',
                  marginBottom: '8px',
                }}
              >
                Akun Uji Coba Cepat:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="apple-btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    minHeight: '34px',
                    fontWeight: 600,
                    gap: '6px',
                  }}
                  onClick={() => fillLogin('admin', 'password123')}
                >
                  <i className="bx bx-shield" style={{ color: 'var(--apple-accent)' }} />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  className="apple-btn-secondary"
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    minHeight: '34px',
                    fontWeight: 600,
                    gap: '6px',
                  }}
                  onClick={() => fillLogin('mahasiswa', 'password123')}
                >
                  <i className="bx bx-user" style={{ color: '#34c759' }} />
                  <span>Mahasiswa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
