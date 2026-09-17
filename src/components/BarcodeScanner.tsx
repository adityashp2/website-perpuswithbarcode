'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { compressImageUnder200KB } from '@/lib/imageCompressor';

// Polyfill type declaration for Native BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string; format?: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

// Audio beep feedback helper
export function playScanBeep() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5)
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

// Clean and normalize barcode or ISBN (digits and letters only)
export function normalizeBarcode(val: string): string {
  return val.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedValue: string) => void;
  title?: string;
  expectedValue?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Pindai Barcode / ISBN',
  expectedValue,
}: BarcodeScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanEngine, setScanEngine] = useState<'native' | 'zxing'>('native');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop all camera streams and scanners
  const stopAll = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (zxingControlsRef.current) {
      try {
        zxingControlsRef.current.stop();
      } catch {
        // ignore
      }
      zxingControlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setTorchOn(false);
  }, []);

  const handleSuccess = useCallback(
    (code: string) => {
      const clean = code.trim();
      if (!clean) return;

      if (expectedValue) {
        const normExpected = normalizeBarcode(expectedValue);
        const normScanned = normalizeBarcode(clean);
        if (normScanned !== normExpected && !normScanned.endsWith(normExpected)) {
          setError(`Barcode tidak cocok! Terbaca "${clean}", yang dicari "${expectedValue}"`);
          return;
        }
      }

      playScanBeep();
      stopAll();
      onScan(clean);
      onClose();
    },
    [expectedValue, onScan, onClose, stopAll]
  );

  // Enumerate cameras once modal opens
  useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          // Prefer environment/back camera if labeled
          const backCam = videoDevices.find((d) =>
            /back|rear|environment|belakang/i.test(d.label)
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
        }
      } catch {
        // ignore device listing error
      }
    };

    void getDevices();
  }, [isOpen, selectedDeviceId]);

  // Start video scanning
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      stopAll();
      setError('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Kamera tidak didukung oleh browser ini. Silakan gunakan scanner USB atau unggah foto barcode.');
        return;
      }

      setScanning(true);

      // 1. Acquire MediaStream with fallback constraints
      let stream: MediaStream | null = null;
      try {
        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback: simple { video: true } in case resolution or deviceId constraint fails
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (fallbackErr) {
          if (!cancelled) {
            const err = fallbackErr as Error;
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setError('Izin kamera ditolak. Klik ikon gembok / kamera di address bar browser untuk mengizinkan.');
            } else if (err.name === 'NotFoundError') {
              setError('Perangkat kamera tidak ditemukan. Gunakan scanner USB atau unggah foto barcode.');
            } else {
              setError(`Gagal mengakses kamera: ${err.message || 'Kamera sedang digunakan aplikasi lain'}`);
            }
            setScanning(false);
          }
          return;
        }
      }

      if (cancelled || !stream) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const capabilities = (videoTrack.getCapabilities?.() || {}) as { torch?: boolean };
          setHasTorch(Boolean(capabilities.torch));
        } catch {
          setHasTorch(false);
        }
      }

      // Bind to video element
      const videoEl = videoRef.current;
      if (!videoEl) return;

      videoEl.srcObject = stream;
      try {
        await videoEl.play();
      } catch {
        // ignore play error
      }

      // 2. Decide scanning engine: Check if native BarcodeDetector actually supports code_128
      let canUseNativeForBarcodes = false;
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window && window.BarcodeDetector?.getSupportedFormats) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          if (supported && supported.includes('code_128')) {
            canUseNativeForBarcodes = true;
          }
        } catch {
          canUseNativeForBarcodes = false;
        }
      }

      if (canUseNativeForBarcodes && window.BarcodeDetector) {
        setScanEngine('native');
        try {
          const detector = new window.BarcodeDetector({
            formats: ['code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
          });

          let isDetecting = false;

          const tick = async () => {
            if (cancelled || !streamRef.current || !videoRef.current) return;

            if (videoRef.current.readyState >= 2 && !isDetecting) {
              isDetecting = true;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleSuccess(barcodes[0].rawValue);
                  return;
                }
              } catch {
                // frame detection pass failed, continue
              } finally {
                isDetecting = false;
              }
            }

            animFrameRef.current = requestAnimationFrame(() => void tick());
          };

          animFrameRef.current = requestAnimationFrame(() => void tick());
          return;
        } catch {
          // Native detector failed, fall through to ZXing
        }
      }

      // 3. ZXing Engine with TRY_HARDER, comprehensive barcode formats, and continuous decodeFromVideoElement
      setScanEngine('zxing');
      try {
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_39,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.ITF,
        ]);

        const reader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanSuccess: 1200,
          delayBetweenScanAttempts: 50,
        });

        const controls = await reader.decodeFromVideoElement(videoEl, (result, err) => {
          if (cancelled) return;
          if (result) {
            const scannedText = result.getText();
            if (scannedText && scannedText.trim()) {
              handleSuccess(scannedText.trim());
            }
          }
        });

        zxingControlsRef.current = controls;
      } catch (e) {
        if (!cancelled) {
          setError(`Inisialisasi pemindai kamera gagal: ${(e as Error).message}`);
          setScanning(false);
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [isOpen, selectedDeviceId, stopAll, handleSuccess]);

  // Toggle Torch / Senter
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await (track as unknown as { applyConstraints: (c: { advanced: [{ torch: boolean }] }) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch {
      // torch not supported
    }
  };

  // Decode barcode from an uploaded image file (auto-compress if > 200KB)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setError('');
    let file = rawFile;
    if (rawFile.size > 200 * 1024) {
      try {
        const compressed = await compressImageUnder200KB(rawFile);
        file = compressed.file;
      } catch (err) {
        console.warn('Kompresi barcode upload dilewati:', err);
      }
    }

    const imgUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(imgUrl);

      // Try Native BarcodeDetector first
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window && window.BarcodeDetector) {
        try {
          const detector = new window.BarcodeDetector({
            formats: ['code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
          });
          const results = await detector.detect(img);
          if (results && results.length > 0 && results[0].rawValue) {
            handleSuccess(results[0].rawValue);
            return;
          }
        } catch {
          // fall through to ZXing
        }
      }

      // Try ZXing
      try {
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_39,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.QR_CODE,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        const result = await reader.decodeFromImageElement(img);
        if (result && result.getText()) {
          handleSuccess(result.getText());
          return;
        }
      } catch {
        // ignore
      }

      setError('Barcode tidak dapat terbaca dari gambar ini. Pastikan foto tegak, tajam, dan tidak buram.');
    };

    img.onerror = () => {
      setError('Gagal membaca file gambar yang dipilih.');
    };

    img.src = imgUrl;
    // reset input value so user can pick the same file again
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopAll();
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0f172a',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              <i className="bx bx-barcode-reader" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                {title}
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {scanEngine === 'native' ? 'Engine: Hardware Accelerated' : 'Engine: MultiFormat ZXing'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopAll();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '10px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s',
            }}
            title="Tutup Scanner"
          >
            <i className="bx bx-x" />
          </button>
        </div>

        {/* Video Viewport & Scanning Guide */}
        <div style={{ position: 'relative', width: '100%', height: '260px', background: '#020617', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Barcode Targeting Box */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: '78%',
                height: '90px',
                border: '2px solid rgba(56, 189, 248, 0.85)',
                borderRadius: '12px',
                boxShadow: '0 0 0 3000px rgba(15, 23, 42, 0.45)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Animated laser scanline */}
              {scanning && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    background: 'linear-gradient(90deg, transparent, #38bdf8, #60a5fa, transparent)',
                    boxShadow: '0 0 12px #38bdf8',
                    animation: 'scannerLaser 1.8s ease-in-out infinite',
                  }}
                />
              )}

              {/* Corner brackets */}
              {[
                { top: -2, left: -2, borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' },
                { top: -2, right: -2, borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' },
                { bottom: -2, left: -2, borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8' },
                { bottom: -2, right: -2, borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8' },
              ].map((style, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    width: '18px',
                    height: '18px',
                    borderRadius: '2px',
                    ...style,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Camera controls overlay (Torch & Switch) */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '14px',
              right: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'auto',
            }}
          >
            {/* Camera Switcher */}
            {cameras.length > 1 ? (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '5px 8px',
                  fontSize: '11.5px',
                  maxWidth: '190px',
                  cursor: 'pointer',
                }}
              >
                {cameras.map((c, i) => (
                  <option key={c.deviceId} value={c.deviceId} style={{ background: '#0f172a' }}>
                    {c.label || `Kamera ${i + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.6)', padding: '4px 8px', borderRadius: '6px' }}>
                <i className="bx bx-scan" /> Arahkan ke barcode
              </span>
            )}

            {/* Torch Button if available */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                style={{
                  background: torchOn ? '#f59e0b' : 'rgba(15, 23, 42, 0.75)',
                  color: torchOn ? '#0f172a' : '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <i className="bx bxs-zap" /> {torchOn ? 'Senter ON' : 'Senter'}
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="bx bx-error-circle" style={{ fontSize: '16px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{error}</div>
          </div>
        )}

        {/* Manual Input and File Upload Footer */}
        <div style={{ padding: '16px 20px', background: '#0f172a' }}>
          {/* Quick File Upload Alternative */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <i className="bx bx-image-add" style={{ fontSize: '16px', color: '#38bdf8' }} />
              Unggah Foto Barcode
            </button>
          </div>

          {/* Manual Keyboard Input Fallback */}
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Atau ketik ISBN / kode barcode..."
              style={{
                flex: 1,
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                opacity: manualCode.trim() ? 1 : 0.6,
              }}
            >
              OK
            </button>
          </form>

          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
            Scanner USB juga aktif otomatis. Tembak barcode kapan saja.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scannerLaser {
          0%   { top: 2px; opacity: 0.2; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { top: calc(100% - 4px); opacity: 0.2; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Inline BarcodeScanner Component with trigger button and modal popup
interface BarcodeScannerProps {
  expectedValue?: string;
  onScan: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export default function BarcodeScanner({
  expectedValue,
  onScan,
  label = 'Pindai barcode buku untuk memproses',
  placeholder = 'Scan atau ketik ISBN...',
}: BarcodeScannerProps) {
  const [value, setValue] = useState('');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Global listener for USB Barcode Scanner gun
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      // Ignore if user is actively typing in a normal text input or textarea
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && diff < 80) {
          // Hardware USB scanner detected!
          e.preventDefault();
          const scanned = buffer.trim();
          buffer = '';
          setValue(scanned);
          onScan(scanned);
          playScanBeep();
        } else {
          buffer = '';
        }
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (diff < 60) {
          buffer += e.key;
        } else {
          buffer = isInputFocused ? '' : e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scanned = value.trim();
    if (!scanned) {
      setError('Barcode wajib dipindai atau ISBN wajib diisi.');
      return;
    }
    if (expectedValue) {
      const normExpected = normalizeBarcode(expectedValue);
      const normScanned = normalizeBarcode(scanned);
      if (normScanned !== normExpected && !normScanned.endsWith(normExpected)) {
        setError(`Barcode tidak cocok! ISBN yang dipilih: ${expectedValue}`);
        return;
      }
    }
    setError('');
    onScan(scanned);
    playScanBeep();
  };

  return (
    <div className="card" style={{ marginTop: '12px', padding: '14px' }}>
      {label && <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>{label}</strong>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          className="form-control"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: '180px' }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setError('');
            setCameraModalOpen(true);
          }}
          style={{ gap: '6px' }}
        >
          <i className="bx bx-camera" /> Kamera
        </button>
        <button type="submit" className="btn btn-primary">
          Verifikasi
        </button>
      </form>

      {error && <div className="alert alert-error" style={{ margin: '10px 0 0' }}>{error}</div>}

      <BarcodeScannerModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onScan={(code) => {
          setValue(code);
          setError('');
          onScan(code);
        }}
        expectedValue={expectedValue}
      />
    </div>
  );
}
