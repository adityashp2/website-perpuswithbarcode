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
      if (username.toLowerCase() === 'admin') {
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
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto' }}>
      <div className="card" style={{ padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
            <i className="bx bxs-user-lock"></i>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Masuk ke Akun
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '4px' }}>
            Akses layanan perpustakaan digital Polinela
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <i className="bx bx-error-circle" style={{ fontSize: '18px' }}></i>
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-user" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}></i>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <i className="bx bx-lock-alt" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}></i>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`} style={{ fontSize: '18px' }}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '8px' }}>
            <i className="bx bx-log-in"></i> Masuk Sekarang
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--card-border)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Belum memiliki akun anggota? <Link href="/register" style={{ fontWeight: 600 }}>Daftar di sini</Link>
        </div>

        {/* Demo Account Quick Fill Helper */}
        <div style={{ marginTop: '20px', padding: '12px 14px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--card-border)', fontSize: '12px' }}>
          <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Akun Demo Default:</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span>Admin: <code>admin</code></span>
            <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => fillLogin('admin', 'password123')}>
              Isi Form
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span>Mahasiswa: <code>mahasiswa</code></span>
            <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => fillLogin('mahasiswa', 'password123')}>
              Isi Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
