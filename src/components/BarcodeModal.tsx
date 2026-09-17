'use client';

import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Buku } from '@/types/database';

interface BarcodeModalProps {
  buku: Buku | null;
  allBuku?: Buku[];
  onClose: () => void;
}

export default function BarcodeModal({ buku, allBuku = [], onClose }: BarcodeModalProps) {
  const [printMode, setPrintMode] = useState<'single' | 'sheetA4'>('single');
  const [sheetCount, setSheetCount] = useState<number>(24);
  const [selectedCopy, setSelectedCopy] = useState<number>(1);
  const singleSvgRef = useRef<SVGSVGElement | null>(null);

  const totalCopies = Math.max(1, buku?.qty_stok || 1);
  const baseBarcode = buku?.barcode_eksemplar?.replace(/[-_.]?0?\d+$/, '') || buku?.isbn || 'PS-2600001';
  const barcodeValue = `${baseBarcode}-${String(selectedCopy).padStart(2, '0')}`;

  useEffect(() => {
    if (buku && singleSvgRef.current && printMode === 'single') {
      try {
        JsBarcode(singleSvgRef.current, barcodeValue, {
          format: 'CODE128',
          lineColor: '#1d1d1f',
          width: 2,
          height: 48,
          displayValue: true,
          fontSize: 12,
          font: 'monospace',
          margin: 6,
        });
      } catch (err) {
        console.error('Error generating barcode:', err);
      }
    }
  }, [buku, barcodeValue, printMode]);

  // Generate barcodes for the 24 A4 sticker grid (each copy gets distinct barcode: Buku 1, 2, 3...)
  useEffect(() => {
    if (printMode === 'sheetA4') {
      for (let i = 0; i < sheetCount; i++) {
        const el = document.getElementById(`sheet-barcode-svg-${i}`) as SVGSVGElement | null;
        if (el && buku) {
          const itemCopy = (i % totalCopies) + 1;
          const itemBarcode = `${baseBarcode}-${String(itemCopy).padStart(2, '0')}`;
          try {
            JsBarcode(el, itemBarcode, {
              format: 'CODE128',
              lineColor: '#000000',
              width: 1.5,
              height: 32,
              displayValue: true,
              fontSize: 10,
              font: 'monospace',
              margin: 4,
            });
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }
  }, [printMode, sheetCount, buku, baseBarcode, totalCopies]);

  if (!buku) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="apple-card"
        style={{
          maxWidth: printMode === 'sheetA4' ? '740px' : '480px',
          width: '100%',
          padding: '24px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--apple-shadow-xl)',
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--apple-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bx bx-barcode" style={{ fontSize: '24px', color: 'var(--apple-accent)' }} />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--apple-text-primary)' }}>
                Cetak Label Barcode Eksemplar
              </h3>
              <div style={{ fontSize: '11.5px', color: 'var(--apple-text-secondary)' }}>
                Standar Code 128 &bull; PRD §17.1 (Stiker A4 Grid 3×8)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="apple-segmented-control">
              <button
                type="button"
                className={`apple-segment-btn ${printMode === 'single' ? 'active' : ''}`}
                onClick={() => setPrintMode('single')}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                Tunggal
              </button>
              <button
                type="button"
                className={`apple-segment-btn ${printMode === 'sheetA4' ? 'active' : ''}`}
                onClick={() => setPrintMode('sheetA4')}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                Lembar A4 (3×8)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: 'var(--apple-radius-pill)',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--apple-text-secondary)',
              }}
            >
              <i className="bx bx-x" style={{ fontSize: '18px' }} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '4px' }}>
          {printMode === 'single' ? (
            /* Single Label View */
            <div>
              {/* Copy / Eksemplar Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--apple-text-secondary)' }}>
                  Pilih Nomor Eksemplar:
                </span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {Array.from({ length: Math.min(10, totalCopies) }).map((_, idx) => {
                    const copyNum = idx + 1;
                    return (
                      <button
                        key={copyNum}
                        type="button"
                        onClick={() => setSelectedCopy(copyNum)}
                        className={`apple-segment-btn ${selectedCopy === copyNum ? 'active' : ''}`}
                        style={{ fontSize: '11.5px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Buku {copyNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                id="printableBarcodeSingleArea"
                style={{
                  border: '1.5px dashed #94a3b8',
                  borderRadius: 'var(--apple-radius-md)',
                  padding: '18px 24px',
                  textAlign: 'center',
                  background: '#ffffff',
                  margin: '0 auto',
                  maxWidth: '340px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', color: '#475569', textTransform: 'uppercase' }}>
                    PUSTAKASCAN PERPUSTAKAAN
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(0, 113, 227, 0.1)', color: 'var(--apple-accent)', padding: '2px 6px', borderRadius: '4px' }}>
                    BUKU #{selectedCopy}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#0f172a', margin: '6px 0 2px' }}>
                  {buku.judul}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
                  DDC: {buku.ddc || '000'} &bull; Rak: {buku.lokasi_rak || buku.id_katalog || 'Umum'} &bull; Eks: {selectedCopy}/{totalCopies}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                  <svg ref={singleSvgRef} style={{ maxWidth: '100%' }} />
                </div>

                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>
                  {barcodeValue}
                </div>
              </div>
            </div>
          ) : (
            /* Sheet A4 Grid 3x8 View (PRD §17.1: 64 x 34 mm per label) */
            <div
              id="printableBarcodeA4Area"
              style={{
                background: '#ffffff',
                border: '1px solid var(--apple-border)',
                borderRadius: 'var(--apple-radius-md)',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)', marginBottom: '10px', textAlign: 'center' }}>
                Preview Format Stiker Kertas A4 (Grid 3 Kolom &times; 8 Baris = 24 Label). Ukuran label 64&times;34 mm.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  padding: '4px',
                }}
              >
                {Array.from({ length: sheetCount }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px dashed #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px',
                      textAlign: 'center',
                      background: '#ffffff',
                      fontSize: '9.5px',
                    }}
                  >
                    <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '8px', color: '#64748b', letterSpacing: '0.5px' }}>
                      PUSTAKASCAN
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0' }}>
                      {buku.judul}
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                      DDC: {buku.ddc || '000'} | Rak: {buku.lokasi_rak || 'A1'}
                    </div>
                    <svg id={`sheet-barcode-svg-${idx}`} style={{ width: '100%', height: '36px', margin: '2px 0' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--apple-text-secondary)' }}>
            Eksemplar: <strong style={{ fontFamily: 'monospace' }}>{barcodeValue}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} className="apple-btn-secondary" style={{ fontSize: '13px' }}>
              Tutup
            </button>
            <button type="button" onClick={handlePrint} className="apple-btn-primary" style={{ fontSize: '13px', gap: '6px' }}>
              <i className="bx bx-printer" /> Cetak Label Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
