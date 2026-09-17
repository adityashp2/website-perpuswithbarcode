'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  attachKeyboardWedgeListener, 
  resolveBarcodeType, 
  ScanDiagnosticLog, 
  BarcodeResolution 
} from '@/lib/scannerEngine';
import { 
  playItemScanBeep, 
  playMemberScanBeep, 
  playScanErrorSound, 
  playTransactionSuccessSound,
  isAudioMuted,
  toggleAudioMute
} from '@/lib/audioFeedback';

interface KeyStrokeEvent {
  id: number;
  key: string;
  gapMs: number;
  timestamp: string;
  isFastStreak: boolean;
}

export default function ScannerTestPage() {
  const [logs, setLogs] = useState<KeyStrokeEvent[]>([]);
  const [lastScanned, setLastScanned] = useState<{ text: string; resolution: BarcodeResolution; time: string } | null>(null);
  const [testInputVal, setTestInputVal] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSoundMuted(isAudioMuted());

    const detach = attachKeyboardWedgeListener(
      (code, res) => {
        setLastScanned({
          text: code,
          resolution: res,
          time: new Date().toLocaleTimeString('id-ID'),
        });
        if (res.type === 'member') {
          playMemberScanBeep();
        } else if (res.type === 'copy' || res.type === 'isbn') {
          playItemScanBeep();
        } else {
          playScanErrorSound();
        }
      },
      (diagnostic) => {
        setLogs((prev) => [
          ...prev.slice(-49), // retain last 50 strokes
          {
            id: Date.now() + Math.random(),
            key: diagnostic.key === ' ' ? 'Space' : diagnostic.key,
            gapMs: diagnostic.gapMs,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            isFastStreak: diagnostic.isFastStreak,
          },
        ]);
      }
    );

    return () => detach();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleToggleMute = () => {
    const next = toggleAudioMute();
    setSoundMuted(next);
  };

  const clearLogs = () => {
    setLogs([]);
    setLastScanned(null);
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInputVal.trim()) return;
    const res = resolveBarcodeType(testInputVal.trim());
    setLastScanned({
      text: testInputVal.trim(),
      resolution: res,
      time: new Date().toLocaleTimeString('id-ID'),
    });
    if (res.type === 'member') playMemberScanBeep();
    else if (res.type === 'copy' || res.type === 'isbn') playItemScanBeep();
    else playScanErrorSound();
    setTestInputVal('');
  };

  return (
    <div className="scanner-test-page" style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 20px 48px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--apple-radius-pill)', background: 'rgba(0, 113, 227, 0.08)', color: 'var(--apple-accent)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--apple-accent)', display: 'inline-block' }} />
            Diagnostik Hardware PRD §16.3
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--apple-text-primary)', margin: 0 }}>
            Uji &amp; Diagnostik Scanner Barcode
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--apple-text-secondary)', marginTop: '4px' }}>
            Pantau interval karakter per milidetik (ms), deteksi keyboard wedge, verifikasi awalan barcode, dan tes audio synthesizer.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleToggleMute}
            className="apple-btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <i className={`bx ${soundMuted ? 'bx-volume-mute' : 'bx-volume-full'}`} />
            {soundMuted ? 'Suara: Hening' : 'Suara: Aktif'}
          </button>
          <Link href="/admin/sirkulasi" className="apple-btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
            <i className="bx bx-store-alt" /> Buka Mode Kasir
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Status Live Scanner */}
        <div className="apple-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)' }}>
              Hasil Scan Terakhir
            </span>
            {lastScanned && (
              <span style={{ fontSize: '12px', color: 'var(--apple-text-tertiary)' }}>{lastScanned.time}</span>
            )}
          </div>

          {lastScanned ? (
            <div style={{ padding: '16px', borderRadius: 'var(--apple-radius-md)', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--apple-border)' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--apple-text-primary)', marginBottom: '8px', wordBreak: 'break-all' }}>
                {lastScanned.text}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: 'var(--apple-radius-pill)',
                    fontSize: '12px',
                    fontWeight: 600,
                    background:
                      lastScanned.resolution.type === 'member'
                        ? 'rgba(0, 113, 227, 0.12)'
                        : lastScanned.resolution.type === 'copy'
                        ? 'rgba(52, 199, 89, 0.12)'
                        : lastScanned.resolution.type === 'isbn'
                        ? 'rgba(255, 149, 0, 0.12)'
                        : 'rgba(255, 59, 48, 0.12)',
                    color:
                      lastScanned.resolution.type === 'member'
                        ? 'var(--apple-accent)'
                        : lastScanned.resolution.type === 'copy'
                        ? 'var(--apple-success-text)'
                        : lastScanned.resolution.type === 'isbn'
                        ? 'var(--apple-warning-text)'
                        : 'var(--apple-danger-text)',
                  }}
                >
                  <i className="bx bx-tag" />
                  {lastScanned.resolution.type === 'member'
                    ? 'KARTU ANGGOTA (Prefix AG-)'
                    : lastScanned.resolution.type === 'copy'
                    ? 'EKSEMPLAR BUKU (Prefix PS-)'
                    : lastScanned.resolution.type === 'isbn'
                    ? 'ISBN RESMI (EAN-13)'
                    : 'BARCODE TIDAK DIKENALI'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>
                  Panjang: {lastScanned.text.length} karakter
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--apple-text-tertiary)', border: '2px dashed var(--apple-border)', borderRadius: 'var(--apple-radius-md)' }}>
              <i className="bx bx-barcode" style={{ fontSize: '36px', marginBottom: '8px', display: 'block', opacity: 0.5 }} />
              <div>Tembakkan scanner barcode USB Anda sekarang atau gunakan form simulasi di bawah.</div>
            </div>
          )}

          {/* Form manual input simulation */}
          <form onSubmit={handleSimulateSubmit} style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)', marginBottom: '6px' }}>
              Uji Coba Ketik Barcode Manual:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                data-ignore-scanner="true"
                value={testInputVal}
                onChange={(e) => setTestInputVal(e.target.value)}
                placeholder="Contoh: AG-20260184 atau PS-2600001"
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: 'var(--apple-radius-pill)',
                  border: '1px solid var(--apple-border)',
                  outline: 'none',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
              <button type="submit" className="apple-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Uji
              </button>
            </div>
          </form>
        </div>

        {/* Audio Synthesizer Test */}
        <div className="apple-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
            Tes Feedback Suara (Web Audio API)
          </div>
          <p style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', marginBottom: '16px' }}>
            Suara disintesis secara real-time melalui browser tanpa memerlukan file audio eksternal mp3 (PRD §9.2).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button
              type="button"
              onClick={playItemScanBeep}
              className="apple-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '12.5px' }}
            >
              <i className="bx bx-play-circle" style={{ color: 'var(--apple-success-text)', fontSize: '18px' }} />
              <div>
                <div style={{ fontWeight: 600 }}>Scan Buku Masuk</div>
                <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>Beep Tinggi (80ms)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={playMemberScanBeep}
              className="apple-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '12.5px' }}
            >
              <i className="bx bx-play-circle" style={{ color: 'var(--apple-accent)', fontSize: '18px' }} />
              <div>
                <div style={{ fontWeight: 600 }}>Scan Kartu Anggota</div>
                <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>Dua Beep (2×60ms)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={playScanErrorSound}
              className="apple-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '12.5px' }}
            >
              <i className="bx bx-play-circle" style={{ color: 'var(--apple-danger-text)', fontSize: '18px' }} />
              <div>
                <div style={{ fontWeight: 600 }}>Error / Ditolak</div>
                <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>Nada Rendah (500ms)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={playTransactionSuccessSound}
              className="apple-btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '12.5px' }}
            >
              <i className="bx bx-play-circle" style={{ color: '#5856d6', fontSize: '18px' }} />
              <div>
                <div style={{ fontWeight: 600 }}>Transaksi Selesai</div>
                <div style={{ fontSize: '11px', color: 'var(--apple-text-tertiary)' }}>Akor Naik (400ms)</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Raw Keystroke Timing Stream */}
      <div className="apple-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
              Pemantauan Jeda Karakter (Keystroke Stream)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--apple-text-secondary)', margin: '2px 0 0' }}>
              Scanner USB hardware biasanya mengirim karakter dengan jeda &le; 50 ms. Ketikan manusia biasanya &ge; 80 ms.
            </p>
          </div>
          <button
            type="button"
            onClick={clearLogs}
            className="apple-btn-secondary"
            style={{ fontSize: '12px', padding: '4px 12px' }}
          >
            <i className="bx bx-trash" /> Bersihkan Log
          </button>
        </div>

        <div
          style={{
            maxHeight: '320px',
            overflowY: 'auto',
            background: '#1d1d1f',
            borderRadius: 'var(--apple-radius-md)',
            padding: '16px',
            color: '#f5f5f7',
            fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
            fontSize: '12.5px',
            lineHeight: 1.6,
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#86868b', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
              Belum ada ketikan atau scan terdeteksi. Tekan tombol pada keyboard atau gunakan barcode scanner untuk melihat data stream...
            </div>
          ) : (
            logs.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  padding: '3px 0',
                }}
              >
                <span>
                  <span style={{ color: '#86868b', marginRight: '12px' }}>{item.timestamp}</span>
                  <span style={{ color: '#2997ff', fontWeight: 600, marginRight: '12px' }}>
                    KEY: &quot;{item.key}&quot;
                  </span>
                  <span
                    style={{
                      color: item.isFastStreak ? '#30d158' : '#ffd60a',
                      fontWeight: 600,
                    }}
                  >
                    Jeda: {item.gapMs} ms
                  </span>
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: item.isFastStreak ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 214, 10, 0.2)',
                    color: item.isFastStreak ? '#30d158' : '#ffd60a',
                  }}
                >
                  {item.isFastStreak ? '⚡ Hardware Scanner' : '⌨ Ketik Manual'}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
