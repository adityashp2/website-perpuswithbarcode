'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
    };
  }
}

interface BarcodeScannerProps {
  expectedValue?: string;
  onScan: (value: string) => void;
  label?: string;
}

export default function BarcodeScanner({ expectedValue, onScan, label = 'Scan barcode buku sebelum melanjutkan' }: BarcodeScannerProps) {
  const [value, setValue] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Kamera tidak tersedia. Gunakan HTTPS/localhost atau scanner USB.');
        return;
      }
      if (!window.BarcodeDetector) {
        setError('Browser belum mendukung pembacaan barcode kamera. Ketik ISBN atau gunakan scanner USB.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const result = await detector.detect(videoRef.current);
            const scanned = result[0]?.rawValue;
            if (scanned) {
              setValue(scanned);
              onScan(scanned);
              setCameraOpen(false);
              return;
            }
          } catch {
            setError('Barcode belum terbaca. Arahkan kamera dengan lebih jelas.');
          }
          requestAnimationFrame(() => void scan());
        };
        void scan();
      } catch (cameraError) {
        setError(cameraError instanceof Error ? cameraError.message : 'Kamera tidak dapat dibuka.');
      }
    };
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, onScan]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const scanned = value.trim();
    if (!scanned) {
      setError('Barcode wajib dipindai atau ISBN wajib diisi.');
      return;
    }
    if (expectedValue && scanned.toLowerCase() !== expectedValue.trim().toLowerCase()) {
      setError('Barcode tidak sesuai dengan buku yang dipilih.');
      return;
    }
    setError('');
    onScan(scanned);
  };

  return (
    <div className="card" style={{ marginTop: '12px', padding: '14px' }}>
      <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>{label}</strong>
      <form onSubmit={submit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input className="form-control" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Scan atau ketik ISBN" style={{ flex: 1, minWidth: '180px' }} />
        <button type="button" className="btn btn-secondary" onClick={() => { setError(''); setCameraOpen(true); }}>
          <i className="bx bx-camera"></i> Kamera
        </button>
        <button type="submit" className="btn btn-primary">Verifikasi</button>
      </form>
      {error && <div className="alert alert-error" style={{ margin: '10px 0 0' }}>{error}</div>}
      {cameraOpen && (
        <div style={{ marginTop: '12px' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', borderRadius: '8px', background: '#0f172a' }} />
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }} onClick={() => setCameraOpen(false)}>Tutup Kamera</button>
        </div>
      )}
    </div>
  );
}
