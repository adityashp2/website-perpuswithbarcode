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
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div className="page-header-info">
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)' }}>
            Kelola Pengguna &amp; Pendaftaran
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--apple-text-secondary)', marginTop: '4px' }}>
            Verifikasi pendaftaran anggota baru, validasi KTM, hingga manajemen akun anggota.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          {pendingList.length > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '12px', padding: '6px 14px' }}>
              <i className="bx bx-bell" /> {pendingList.length} Menunggu ACC
            </span>
          )}
          <span className="badge badge-success" style={{ fontSize: '12px', padding: '6px 14px' }}>
            <i className="bx bx-check-shield" /> {verifiedList.length} Aktif
          </span>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '24px', animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }} />
          <div>{feedback}</div>
        </div>
      )}

      {/* Tabs & Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="apple-segmented-control" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          {[
            { id: 'pending',  label: 'Menunggu ACC', icon: 'bx-time',         count: pendingList.length },
            { id: 'verified', label: 'Terverifikasi',icon: 'bx-check-circle', count: verifiedList.length },
            { id: 'rejected', label: 'Ditolak',      icon: 'bx-x-circle',     count: rejectedList.length },
            { id: 'banned',   label: 'Diblokir',     icon: 'bx-block',        count: bannedList.length },
            { id: 'all',      label: 'Semua',        icon: 'bx-user',         count: anggota.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`apple-segmented-btn ${activeTab === tab.id ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className={`bx ${tab.icon}`} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '99px',
                  background: activeTab === tab.id ? 'var(--apple-accent)' : 'rgba(0,0,0,0.06)',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--apple-text-secondary)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Apple Spotlight Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <i className="bx bx-search" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--apple-text-tertiary)',
            fontSize: '18px',
          }} />
          <input
            type="text"
            className="apple-search-input"
            placeholder="Cari nama, email, telp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px' }}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="apple-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>No</th>
                <th>Identitas Anggota</th>
                <th>Kontak &amp; WhatsApp</th>
                <th style={{ width: '130px' }}>Scan KTM</th>
                <th style={{ width: '130px' }}>Tgl Daftar</th>
                <th style={{ width: '140px' }}>Status Akun</th>
                <th style={{ width: '180px', textAlign: 'right' }}>Aksi Petugas</th>
              </tr>
            </thead>
            <tbody>
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--apple-text-secondary)' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--apple-bg-base)',
                      border: '1px solid var(--apple-separator)',
                      color: 'var(--apple-text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      fontSize: '24px',
                    }}>
                      <i className="bx bx-user-x" />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--apple-text-primary)' }}>
                      Tidak ada data anggota pada kategori ini.
                    </div>
                  </td>
                </tr>
              ) : (
                currentList.map((row, idx) => {
                  const userAccount = adminUsers.find((u) => u.id === row.id_admin);
                  const isBanned = userAccount?.is_banned;

                  return (
                    <tr key={row.id_anggota}>
                      <td style={{ color: 'var(--apple-text-tertiary)', fontSize: '12px', fontFamily: 'monospace' }}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.foto || '/profile-default.svg'}
                            alt=""
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--apple-separator)' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/profile-default.svg';
                            }}
                          />
                          <div>
                            <div style={{ color: 'var(--apple-text-primary)', fontSize: '13.5px', fontWeight: 600 }}>
                              {row.nama}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--apple-text-tertiary)', marginTop: '1px' }}>
                              @{userAccount?.username || 'user'} &bull; {row.sex === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12.5px', color: 'var(--apple-text-primary)' }}>{row.email || '-'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)', marginTop: '2px' }}>WA: {row.telp || '-'}</div>
                      </td>

                      <td>
                        {row.ktm_foto ? (
                          <button
                            type="button"
                            onClick={() => setSelectedKtm({ url: row.ktm_foto!, nama: row.nama })}
                            className="apple-btn-secondary"
                            style={{ gap: '4px', padding: '5px 10px', fontSize: '11.5px' }}
                          >
                            <i className="bx bx-image" /> Lihat KTM
                          </button>
                        ) : (
                          <span style={{ color: 'var(--apple-text-tertiary)', fontSize: '12px', fontStyle: 'italic' }}>Tanpa KTM</span>
                        )}
                      </td>

                      <td style={{ fontSize: '12.5px', color: 'var(--apple-text-secondary)' }}>{row.tgl_entry}</td>

                      <td>
                        {row.status_verifikasi === 'TERVERIFIKASI' && (
                          <span className="badge badge-success"><i className="bx bx-check" /> Terverifikasi</span>
                        )}
                        {row.status_verifikasi === 'PENDING' && (
                          <span className="badge badge-warning"><i className="bx bx-time" /> Menunggu</span>
                        )}
                        {row.status_verifikasi === 'DITOLAK' && (
                          <span className="badge badge-danger"><i className="bx bx-x" /> Ditolak</span>
                        )}
                        {isBanned && (
                          <span className="badge badge-danger" style={{ display: 'inline-block', marginTop: '4px' }}>BANNED</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {row.status_verifikasi === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(row.id_anggota, row.nama)}
                                className="apple-btn-primary"
                                style={{ background: '#34c759', padding: '5px 10px', fontSize: '11.5px' }}
                                title="ACC Verifikasi"
                              >
                                <i className="bx bx-check" /> ACC
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectModal({ idAnggota: row.id_anggota, nama: row.nama })}
                                className="apple-btn-secondary"
                                style={{ color: '#ff3b30', borderColor: 'rgba(255, 59, 48, 0.3)', padding: '5px 10px', fontSize: '11.5px' }}
                                title="Tolak Pendaftaran"
                              >
                                <i className="bx bx-x" /> Tolak
                              </button>
                            </>
                          )}

                          {userAccount && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isBanned) {
                                  unbanUser(userAccount.id);
                                } else {
                                  if (confirm(`Bekukan akun anggota ${row.nama}?`)) {
                                    banUser(userAccount.id, 'Pelanggaran peraturan perpustakaan');
                                  }
                                }
                              }}
                              className="apple-btn-secondary"
                              style={{
                                padding: '5px 9px',
                                fontSize: '12px',
                                color: isBanned ? '#34c759' : '#ff3b30',
                                borderColor: isBanned ? 'rgba(52,199,89,0.3)' : 'rgba(255,59,48,0.3)',
                              }}
                              title={isBanned ? 'Buka Blokir (Unban)' : 'Blokir Akun (Ban)'}
                            >
                              <i className={`bx ${isBanned ? 'bx-lock-open' : 'bx-block'}`} />
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

      {/* Modal Lihat KTM - Apple Sheet */}
      {selectedKtm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div className="apple-card" style={{ maxWidth: '540px', width: '100%', padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                Scan KTM: {selectedKtm.nama}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedKtm(null)}
                className="apple-btn-secondary"
                style={{ padding: '4px 8px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bx bx-x" style={{ fontSize: '18px' }} />
              </button>
            </div>
            <div style={{ background: 'var(--apple-bg-base)', borderRadius: '14px', padding: '12px', textAlign: 'center', border: '1px solid var(--apple-separator)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedKtm.url}
                alt="KTM"
                style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '10px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak - Apple Sheet */}
      {rejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div className="apple-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px', color: 'var(--apple-text-primary)' }}>
              Tolak Pendaftaran Anggota
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
              Calon Anggota: <strong style={{ color: 'var(--apple-text-primary)' }}>{rejectModal.nama}</strong>
            </p>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px', display: 'block' }}>
                Alasan Penolakan
              </label>
              <textarea
                className="apple-search-input"
                style={{ width: '100%', minHeight: '80px', borderRadius: '12px', resize: 'vertical' }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="apple-btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="apple-btn-primary"
                style={{ background: '#ff3b30' }}
              >
                Tolak Pendaftaran
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
