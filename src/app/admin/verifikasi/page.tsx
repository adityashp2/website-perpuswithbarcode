'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';

export default function AdminVerifikasiPage() {
  const { anggota, adminUsers, verifikasiAnggota, banUser, unbanUser } = useData();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'banned' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [selectedKtm, setSelectedKtm] = useState<{ url: string; nama: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ idAnggota: number; nama: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Foto KTM tidak terbaca atau buram');
  const [feedback, setFeedback] = useState<string | null>(null);

  const pendingList = anggota.filter((a) => a.status_verifikasi === 'PENDING');
  const verifiedList = anggota.filter((a) => {
    const user = adminUsers.find((u) => u.id === a.id_admin);
    return a.status_verifikasi === 'TERVERIFIKASI' && !user?.is_banned;
  });
  const rejectedList = anggota.filter((a) => a.status_verifikasi === 'DITOLAK');
  const bannedList = anggota.filter((a) => {
    const user = adminUsers.find((u) => u.id === a.id_admin);
    return user?.is_banned;
  });

  const getFilteredList = () => {
    let base =
      activeTab === 'pending'
        ? pendingList
        : activeTab === 'verified'
        ? verifiedList
        : activeTab === 'rejected'
        ? rejectedList
        : activeTab === 'banned'
        ? bannedList
        : anggota;

    if (search.trim()) {
      base = base.filter(
        (a) =>
          a.nama.toLowerCase().includes(search.toLowerCase()) ||
          (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
          (a.telp && a.telp.includes(search))
      );
    }
    return base;
  };

  const handleApprove = async (idAnggota: number, nama: string) => {
    await verifikasiAnggota(idAnggota, 'TERVERIFIKASI');
    setFeedback(`Akun ${nama} berhasil disetujui & terverifikasi!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmReject = async () => {
    if (rejectModal) {
      await verifikasiAnggota(rejectModal.idAnggota, 'DITOLAK', rejectReason);
      setFeedback(`Verifikasi pendaftaran ${rejectModal.nama} ditolak.`);
      setRejectModal(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const currentList = getFilteredList();

  return (
    <>
      <div className="page-header">
        <div className="page-header-info">
          <h1>
            <i className="bx bxs-user-detail" style={{ color: 'var(--primary)' }}></i> Kelola Pengguna &amp; Pendaftaran
          </h1>
          <p>Kelola verifikasi pendaftaran anggota baru, penolakan, pemblokiran (banned), hingga pembukaan akun anggota.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          {pendingList.length > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '13px', padding: '8px 14px' }}>
              <i className="bx bx-bell"></i> {pendingList.length} Menunggu ACC
            </span>
          )}
          <span className="badge badge-success" style={{ fontSize: '13px', padding: '8px 14px' }}>
            <i className="bx bx-check-shield"></i> {verifiedList.length} Aktif
          </span>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success">
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }}></i>
          <div>{feedback}</div>
        </div>
      )}

      {/* Tabs Nav */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'pending', label: 'Menunggu ACC', icon: 'bx-time', count: pendingList.length, color: 'var(--warning)' },
            { id: 'verified', label: 'Terverifikasi', icon: 'bx-check-circle', count: verifiedList.length, color: 'var(--success)' },
            { id: 'rejected', label: 'Ditolak', icon: 'bx-x-circle', count: rejectedList.length, color: 'var(--danger)' },
            { id: 'banned', label: 'Diblokir', icon: 'bx-block', count: bannedList.length, color: '#64748b' },
            { id: 'all', label: 'Semua Anggota', icon: 'bx-user', count: anggota.length, color: 'var(--primary)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-md)', padding: '9px 16px', gap: '6px' }}
            >
              <i className={`bx ${tab.icon}`}></i>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.id ? '#ffffff' : tab.color,
                  color: activeTab === tab.id ? 'var(--primary)' : '#ffffff',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '260px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Cari nama, email, telp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 14px' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>No</th>
                <th>Identitas Anggota</th>
                <th>Kontak &amp; Alamat</th>
                <th style={{ width: '130px' }}>Scan KTM</th>
                <th style={{ width: '130px' }}>Tgl Daftar</th>
                <th style={{ width: '140px' }}>Status Akun</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Aksi Petugas</th>
              </tr>
            </thead>
            <tbody>
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <i className="bx bx-user-x" style={{ fontSize: '36px', display: 'block', marginBottom: '8px', color: 'var(--text-light)' }}></i>
                    Tidak ada anggota pada tab ini.
                  </td>
                </tr>
              ) : (
                currentList.map((row, idx) => {
                  const userAccount = adminUsers.find((u) => u.id === row.id_admin);
                  const isBanned = userAccount?.is_banned;

                  return (
                    <tr key={row.id_anggota}>
                      <td>{idx + 1}</td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.foto || '/profile-default.svg'}
                            alt=""
                            style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '1px solid var(--card-border)' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/profile-default.svg';
                            }}
                          />
                          <div>
                            <strong style={{ color: '#0f172a', fontSize: '13.5px', display: 'block' }}>
                              {row.nama}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              @{userAccount?.username || 'user'} &bull; {row.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px' }}>{row.email || '-'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>WA: {row.telp || '-'}</div>
                      </td>

                      <td>
                        {row.ktm_foto ? (
                          <button
                            onClick={() => setSelectedKtm({ url: row.ktm_foto!, nama: row.nama })}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '4px', padding: '4px 8px', fontSize: '11.5px' }}
                          >
                            <i className="bx bx-image"></i> Lihat KTM
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Tanpa KTM</span>
                        )}
                      </td>

                      <td>{row.tgl_entry}</td>

                      <td>
                        {row.status_verifikasi === 'TERVERIFIKASI' && (
                          <span className="badge badge-success"><i className="bx bx-check"></i> Terverifikasi</span>
                        )}
                        {row.status_verifikasi === 'PENDING' && (
                          <span className="badge badge-warning"><i className="bx bx-time"></i> Menunggu</span>
                        )}
                        {row.status_verifikasi === 'DITOLAK' && (
                          <span className="badge badge-danger"><i className="bx bx-x"></i> Ditolak</span>
                        )}
                        {isBanned && (
                          <span className="badge badge-danger" style={{ display: 'block', marginTop: '4px' }}>BANNED</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {row.status_verifikasi === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(row.id_anggota, row.nama)}
                                className="btn btn-success btn-sm"
                                title="ACC Verifikasi"
                              >
                                <i className="bx bx-check"></i> ACC
                              </button>
                              <button
                                onClick={() => setRejectModal({ idAnggota: row.id_anggota, nama: row.nama })}
                                className="btn btn-danger btn-sm"
                                title="Tolak Pendaftaran"
                              >
                                <i className="bx bx-x"></i> Tolak
                              </button>
                            </>
                          )}

                          {userAccount && (
                            <button
                              onClick={() => {
                                if (isBanned) {
                                  unbanUser(userAccount.id);
                                } else {
                                  if (confirm(`Bekukan akun anggota ${row.nama}?`)) {
                                    banUser(userAccount.id, 'Pelanggaran peraturan perpustakaan');
                                  }
                                }
                              }}
                              className={`btn btn-sm ${isBanned ? 'btn-secondary' : 'btn-danger'}`}
                              style={{ padding: '4px 8px' }}
                              title={isBanned ? 'Buka Blokir (Unban)' : 'Blokir Akun (Ban)'}
                            >
                              <i className={`bx ${isBanned ? 'bx-lock-open' : 'bx-block'}`}></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lihat KTM */}
      {selectedKtm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Scan KTM: {selectedKtm.nama}
              </h3>
              <button onClick={() => setSelectedKtm(null)} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>
                <i className="bx bx-x" style={{ fontSize: '18px' }}></i>
              </button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '8px', textAlign: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedKtm.url}
                alt="KTM"
                style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {rejectModal && (
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px' }}>
              Tolak Pendaftaran Anggota
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Anggota: <strong>{rejectModal.nama}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Alasan Penolakan</label>
              <textarea
                className="form-control"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setRejectModal(null)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={handleConfirmReject} className="btn btn-danger">
                Tolak Pendaftaran
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
