'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Peminjaman } from '@/types/database';

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
    };
  }
}

export default function AdminSirkulasiPage() {
  const { peminjaman, config, accPinjam, tolakPinjam, accKembali } = useData();
  const [activeTab, setActiveTab] = useState<'pending' | 'dipinjam' | 'kembali' | 'selesai'>('pending');
  const [scanIsbn, setScanIsbn] = useState('');
  const [scanResult, setScanResult] = useState<Peminjaman | null>(null);
  const [scanError, setScanError] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Return modal state
  const [selectedReturn, setSelectedReturn] = useState<Peminjaman | null>(null);
  const [dendaVal, setDendaVal] = useState<number>(0);
  const [lateDays, setLateDays] = useState<number>(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const dendaPerHari = config.dendaPerHari || 500;

  const calculateLate = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);

    const diff = today.getTime() - target.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return { days, denda: days * dendaPerHari };
    }
    return { days: 0, denda: 0 };
  };

  const pendingList = peminjaman.filter((p) => p.status === 'MENUNGGU_ACC' || p.status === 'PENDING');
  const dipinjamList = peminjaman.filter((p) => p.status === 'DIPINJAM');
  const kembaliList = peminjaman.filter((p) => p.status === 'MENUNGGU_KEMBALI' || p.status === 'KEMBALI');
  const selesaiList = peminjaman.filter((p) => p.status === 'DIKEMBALIKAN' || p.status === 'SELESAI' || p.status === 'DITOLAK');

  const findTransaction = useCallback((value: string) => {
    setScanError('');
    setScanResult(null);

    const target = peminjaman.find(
      (p) =>
        p.details?.some((d) => d.isbn.toLowerCase() === value.trim().toLowerCase()) &&
        (p.status === 'MENUNGGU_ACC' || p.status === 'PENDING' || p.status === 'DIPINJAM' || p.status === 'MENUNGGU_KEMBALI' || p.status === 'KEMBALI')
    );

    if (target) {
      setScanResult(target);
    } else {
      setScanError(`ISBN / Barcode "${value}" tidak ditemukan pada sirkulasi aktif.`);
    }
  }, [peminjaman]);

  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Kamera tidak tersedia. Buka melalui localhost/HTTPS atau gunakan scanner USB.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!window.BarcodeDetector) {
          setCameraError('Preview kamera aktif, tetapi browser ini belum mendukung deteksi barcode otomatis. Gunakan Chrome/Edge terbaru atau ketik ISBN secara manual.');
          return;
        }
        const detector = new window.BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results[0]?.rawValue) {
              setScanIsbn(results[0].rawValue);
              findTransaction(results[0].rawValue);
              setCameraOpen(false);
              return;
            }
          } catch {
            setCameraError('Barcode belum terbaca. Arahkan kamera dengan lebih jelas.');
          }
          if (!cancelled) requestAnimationFrame(() => void scan());
        };
        void scan();
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setCameraError('Izin kamera ditolak. Klik ikon gembok kamera di address bar, izinkan kamera, lalu coba lagi.');
        } else if (error instanceof DOMException && error.name === 'NotFoundError') {
          setCameraError('Kamera tidak ditemukan pada perangkat ini.');
        } else {
          setCameraError(error instanceof Error ? error.message : 'Kamera tidak dapat diakses.');
        }
      }
    };
    void startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, findTransaction]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    findTransaction(scanIsbn);
  };

  const handleAccPinjam = async (idPinjam: number) => {
    await accPinjam(idPinjam);
    setFeedback(`Peminjaman TRX-${idPinjam} berhasil disetujui (ACC).`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleTolakPinjam = async (idPinjam: number) => {
    if (confirm('Apakah Anda yakin ingin menolak permohonan peminjaman ini?')) {
      await tolakPinjam(idPinjam);
      setFeedback(`Permohonan peminjaman TRX-${idPinjam} telah ditolak.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleOpenKembaliModal = (p: Peminjaman) => {
    const { days, denda } = calculateLate(p.tgl_kembali);
    setSelectedReturn(p);
    setLateDays(days);
    setDendaVal(denda);
  };

  const handleConfirmKembali = async () => {
    if (selectedReturn) {
      await accKembali(selectedReturn.id_pinjam, dendaVal);
      setSelectedReturn(null);
      setFeedback(`Pengembalian berhasil dicatat! Denda: Rp ${dendaVal.toLocaleString('id-ID')}`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const currentList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'dipinjam'
      ? dipinjamList
      : activeTab === 'kembali'
      ? kembaliList
      : selesaiList;

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>
            <i className="bx bx-check-shield" style={{ color: 'var(--primary)' }}></i> Panel ACC Sirkulasi
          </h1>
          <p>Verifikasi, setujui, atau tolak permohonan peminjaman dan pengembalian buku dari anggota.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {pendingList.length > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '13px', padding: '8px 14px' }}>
              <i className="bx bx-time"></i> {pendingList.length} Permohonan Pinjam
            </span>
          )}
          {kembaliList.length > 0 && (
            <span className="badge badge-info" style={{ fontSize: '13px', padding: '8px 14px' }}>
              <i className="bx bx-package"></i> {kembaliList.length} Permintaan Kembali
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success">
          <i className="bx bx-check-circle" style={{ fontSize: '20px' }}></i>
          <div>{feedback}</div>
        </div>
      )}

      {/* Barcode Scanner Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 24px' }}>
        <form onSubmit={handleScan} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
            <i className="bx bx-barcode-reader" style={{ fontSize: '22px', color: 'var(--primary)' }}></i>
            <span>Scan Barcode ISBN:</span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Arahkan scanner atau ketik nomor ISBN buku lalu tekan Enter..."
            value={scanIsbn}
            onChange={(e) => setScanIsbn(e.target.value)}
            style={{ flex: 1, minWidth: '240px' }}
          />
          <button type="submit" className="btn btn-primary">
            <i className="bx bx-search"></i> Cari Data
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => { setCameraError(''); setCameraOpen(true); }}>
            <i className="bx bx-camera"></i> Scan Kamera
          </button>
        </form>

        {scanError && (
          <div className="alert alert-error" style={{ marginTop: '16px', marginBottom: 0 }}>
            <i className="bx bx-error-circle" style={{ fontSize: '18px' }}></i>
            <div>{scanError}</div>
          </div>
        )}

        {scanResult && (
          <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Hasil Scan: TRX-{scanResult.id_pinjam}</strong> &bull; Peminjam: <strong>{scanResult.anggota?.nama}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Buku: {scanResult.details?.[0]?.buku?.judul} ({scanResult.details?.[0]?.isbn})
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(scanResult.status === 'MENUNGGU_ACC' || scanResult.status === 'PENDING') && (
                  <button onClick={() => handleAccPinjam(scanResult.id_pinjam)} className="btn btn-success btn-sm">
                    <i className="bx bx-check"></i> ACC Pinjam
                  </button>
                )}
                {(scanResult.status === 'DIPINJAM' || scanResult.status === 'MENUNGGU_KEMBALI' || scanResult.status === 'KEMBALI') && (
                  <button onClick={() => handleOpenKembaliModal(scanResult)} className="btn btn-info btn-sm">
                    <i className="bx bx-package"></i> ACC Kembali
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {cameraOpen && (
          <div className="card camera-scan-panel">
            <div className="camera-scan-header">
              <strong>Arahkan kamera ke barcode buku</strong>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCameraOpen(false)}>Tutup</button>
            </div>
            <div className="camera-preview">
              <video ref={videoRef} autoPlay muted playsInline />
              <div className="camera-guide" aria-hidden="true">
                <span className="camera-guide-frame"></span>
                <span className="camera-corner corner-top-left"></span>
                <span className="camera-corner corner-top-right"></span>
                <span className="camera-corner corner-bottom-left"></span>
                <span className="camera-corner corner-bottom-right"></span>
                <span className="camera-scan-line"></span>
                <span className="camera-guide-label">Posisikan barcode di dalam kotak</span>
              </div>
            </div>
            {cameraError && <div className="alert alert-error camera-scan-error">{cameraError}</div>}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'pending', label: 'Permohonan Pinjam', icon: 'bx-time', count: pendingList.length, color: 'var(--warning)' },
          { id: 'dipinjam', label: 'Sedang Dipinjam', icon: 'bx-book-open', count: dipinjamList.length, color: 'var(--primary)' },
          { id: 'kembali', label: 'Permintaan Pengembalian', icon: 'bx-package', count: kembaliList.length, color: 'var(--info)' },
          { id: 'selesai', label: 'Riwayat Selesai', icon: 'bx-history', count: selesaiList.length, color: 'var(--success)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-md)', padding: '10px 18px', gap: '8px' }}
          >
            <i className={`bx ${tab.icon}`}></i>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? '#ffffff' : tab.color,
                color: activeTab === tab.id ? 'var(--primary)' : '#ffffff',
                fontWeight: 700,
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="bx bx-list-ul"></i>
            <span>
              {activeTab === 'pending' && 'Daftar Permohonan Peminjaman Menunggu ACC'}
              {activeTab === 'dipinjam' && 'Daftar Buku yang Sedang Dipinjam Anggota'}
              {activeTab === 'kembali' && 'Daftar Permintaan Pengembalian Buku'}
              {activeTab === 'selesai' && 'Arsip Transaksi Sirkulasi Selesai'}
            </span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Total: {currentList.length} data
          </span>
        </div>

        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Anggota Peminjam</th>
                <th>Daftar Buku &amp; ISBN</th>
                <th>Tgl Pinjam</th>
                <th>Batas Kembali</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', width: '200px' }}>Aksi Petugas</th>
              </tr>
            </thead>
            <tbody>
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <i className="bx bx-folder-open" style={{ fontSize: '36px', display: 'block', marginBottom: '8px', color: '#cbd5e1' }}></i>
                    Tidak ada data transaksi pada tab ini.
                  </td>
                </tr>
              ) : (
                currentList.map((row) => {
                  const book = row.details?.[0]?.buku;
                  const { days, denda } = calculateLate(row.tgl_kembali);
                  const isLate = days > 0 && (row.status === 'DIPINJAM' || row.status === 'MENUNGGU_KEMBALI');

                  return (
                    <tr key={row.id_pinjam}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                          #{row.id_pinjam}
                        </span>
                      </td>

                      <td>
                        <strong>{row.anggota?.nama || `Anggota #${row.id_anggota}`}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {row.anggota?.email || '-'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {book?.judul || 'Buku Perpustakaan'}
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-light)' }}>
                          ISBN: {row.details?.[0]?.isbn}
                        </span>
                      </td>

                      <td>{row.tgl_pinjam}</td>

                      <td>
                        <span style={{ fontWeight: isLate ? 700 : 500, color: isLate ? 'var(--danger)' : 'inherit' }}>
                          {row.tgl_kembali}
                        </span>
                        {isLate && (
                          <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginTop: '2px' }}>
                            <i className="bx bx-error-circle"></i> Terlambat {days} hari (Denda: Rp {denda.toLocaleString('id-ID')})
                          </div>
                        )}
                      </td>

                      <td>
                        {row.status === 'MENUNGGU_ACC' && (
                          <span className="badge badge-warning"><i className="bx bx-time"></i> Menunggu ACC</span>
                        )}
                        {row.status === 'DIPINJAM' && (
                          <span className="badge badge-primary"><i className="bx bx-book-open"></i> Dipinjam</span>
                        )}
                        {row.status === 'MENUNGGU_KEMBALI' && (
                          <span className="badge badge-info"><i className="bx bx-package"></i> Minta Kembali</span>
                        )}
                        {row.status === 'DIKEMBALIKAN' && (
                          <span className="badge badge-success"><i className="bx bx-check-circle"></i> Dikembalikan</span>
                        )}
                        {row.status === 'DITOLAK' && (
                          <span className="badge badge-danger"><i className="bx bx-x-circle"></i> Ditolak</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {(row.status === 'MENUNGGU_ACC' || row.status === 'PENDING') && (
                            <>
                              <button
                                onClick={() => handleAccPinjam(row.id_pinjam)}
                                className="btn btn-success btn-sm"
                                title="Setujui Peminjaman"
                              >
                                <i className="bx bx-check"></i> ACC
                              </button>
                              <button
                                onClick={() => handleTolakPinjam(row.id_pinjam)}
                                className="btn btn-danger btn-sm"
                                title="Tolak Peminjaman"
                              >
                                <i className="bx bx-x"></i> Tolak
                              </button>
                            </>
                          )}

                          {(row.status === 'DIPINJAM' || row.status === 'MENUNGGU_KEMBALI' || row.status === 'KEMBALI') && (
                            <button
                              onClick={() => handleOpenKembaliModal(row)}
                              className="btn btn-info btn-sm"
                              title="Konfirmasi Pengembalian Buku"
                            >
                              <i className="bx bx-package"></i> ACC Kembali
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

      {/* Modal ACC Kembali & Denda */}
      {selectedReturn && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '28px', animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                <i className="bx bx-package"></i>
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>ACC Pengembalian Buku</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>Periksa keterlambatan &amp; denda</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Peminjam:</span>
                <strong>{selectedReturn.anggota?.nama}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Batas Waktu:</span>
                <span>{selectedReturn.tgl_kembali}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Keterlambatan:</span>
                <span style={{ fontWeight: 700, color: lateDays > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {lateDays > 0 ? `${lateDays} Hari Terlambat` : 'Tepat Waktu (0 Hari)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--card-border)', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Denda:</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                  Rp {dendaVal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedReturn(null)} className="btn btn-secondary">
                Batal
              </button>
              <button onClick={handleConfirmKembali} className="btn btn-success">
                <i className="bx bx-check"></i> Konfirmasi Terima
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
