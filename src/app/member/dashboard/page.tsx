'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { Peminjaman } from '@/types/database';

export default function MemberDashboardPage() {
  const { currentUser, currentAnggota, isAdmin } = useAuth();
  const { peminjaman, ajukanKembali, config } = useData();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="card" style={{ maxWidth: '440px', margin: '60px auto', padding: '32px', textAlign: 'center' }}>
        <i className="bx bx-lock-alt" style={{ fontSize: '42px', color: 'var(--warning)', marginBottom: '12px', display: 'block' }}></i>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Akses Terbatas</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Silakan masuk (login) untuk melihat kartu anggota dan riwayat peminjaman.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          <i className="bx bx-log-in"></i> Masuk Sekarang
        </Link>
      </div>
    );
  }

  const myLoans = peminjaman.filter(
    (p) => p.id_anggota === currentAnggota?.id_anggota
  );

  const handleReturnAction = async (idPinjam: number) => {
    await ajukanKembali(idPinjam);
    setFeedback('Permintaan pengembalian telah diajukan ke petugas perpustakaan.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const statusVerif = currentAnggota?.status_verifikasi || 'TERVERIFIKASI';

  return (
    <>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Profil &amp; Kartu Pengguna</h1>
          <p>Informasi identitas dan kartu keanggotaan Perpustakaan Politeknik Negeri Lampung.</p>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success">
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }}></i>
          <div>{feedback}</div>
        </div>
      )}

      {/* Digital Member ID Card Badge */}
      <div className="digital-id-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="bx bxs-book-reader"></i>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>
                KARTU PERPUSTAKAAN
              </h3>
              <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>POLITEKNIK NEGERI LAMPUNG</p>
            </div>
          </div>
          <span className={`role-badge ${isAdmin ? 'badge-adm' : 'badge-ang'}`} style={{ fontSize: '11px', padding: '4px 12px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
            {isAdmin ? 'ADMINISTRATOR' : 'ANGGOTA RESMI'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAnggota?.foto || '/profile-default.svg'}
            alt="Foto Profil"
            style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', boxShadow: 'var(--shadow-md)' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/profile-default.svg';
            }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>
              {currentAnggota?.nama || currentUser.username}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>
              Username: <code>@{currentUser.username}</code>
            </div>
            <div style={{ fontSize: '11.5px', opacity: 0.75, marginTop: '4px', fontFamily: 'monospace' }}>
              ID Anggota: #{currentAnggota?.id_anggota || 1}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details & Loans */}
      <div className="profile-card" style={{ marginBottom: '32px' }}>
        <div className="profile-avatar-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAnggota?.foto || '/profile-default.svg'}
            alt="Avatar"
            className="profile-avatar-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/profile-default.svg';
            }}
          />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            {currentAnggota?.nama || currentUser.username}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            @{currentUser.username}
          </p>

          <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', marginTop: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Total Peminjaman
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>
              {myLoans.length} kali
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <span className={`badge ${statusVerif === 'TERVERIFIKASI' ? 'badge-success' : statusVerif === 'PENDING' ? 'badge-warning' : 'badge-danger'}`} style={{ padding: '6px 12px', width: '100%', justifyContent: 'center' }}>
              <i className={`bx ${statusVerif === 'TERVERIFIKASI' ? 'bx-check-shield' : 'bx-time'}`}></i> {statusVerif}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bx bx-info-circle"></i>
              <span>Data Identitas Diri</span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Email:</span>
                <strong>{currentAnggota?.email || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>No. WhatsApp:</span>
                <strong>{currentAnggota?.telp || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Jenis Kelamin:</span>
                <strong>{currentAnggota?.sex === 'L' ? 'Laki-laki' : 'Perempuan'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Tanggal Entry:</span>
                <strong>{currentAnggota?.tgl_entry || '-'}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Alamat:</span>
                <strong>{currentAnggota?.alamat || '-'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loans History Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="bx bx-history"></i>
            <span>Riwayat &amp; Peminjaman Aktif Saya</span>
          </div>
          <Link href="/katalog" className="btn btn-primary btn-sm">
            <i className="bx bx-plus"></i> Pinjam Buku Baru
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Buku &amp; ISBN</th>
                <th>Tanggal Pinjam</th>
                <th>Batas Kembali</th>
                <th>Status</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {myLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <i className="bx bx-book-open" style={{ fontSize: '32px', display: 'block', marginBottom: '6px', color: 'var(--text-light)' }}></i>
                    Belum ada riwayat transaksi peminjaman.
                  </td>
                </tr>
              ) : (
                myLoans.map((row) => (
                  <tr key={row.id_pinjam}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{row.id_pinjam}
                      </span>
                    </td>
                    <td>
                      <strong>{row.details?.[0]?.buku?.judul || 'Buku Perpustakaan'}</strong>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-light)' }}>
                        ISBN: {row.details?.[0]?.isbn}
                      </div>
                    </td>
                    <td>{row.tgl_pinjam}</td>
                    <td>{row.tgl_kembali}</td>
                    <td>
                      {row.status === 'MENUNGGU_ACC' && <span className="badge badge-warning">Menunggu ACC</span>}
                      {row.status === 'DIPINJAM' && <span className="badge badge-primary">Sedang Dipinjam</span>}
                      {row.status === 'MENUNGGU_KEMBALI' && <span className="badge badge-info">Menunggu Kembali</span>}
                      {row.status === 'DIKEMBALIKAN' && <span className="badge badge-success">Dikembalikan</span>}
                      {row.status === 'DITOLAK' && <span className="badge badge-danger">Ditolak</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {row.status === 'DIPINJAM' && (
                        <button
                          onClick={() => handleReturnAction(row.id_pinjam)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '4px' }}
                        >
                          <i className="bx bx-refresh"></i> Minta Kembali
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
