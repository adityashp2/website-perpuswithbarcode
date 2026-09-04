'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Buku } from '@/types/database';

interface BarcodeModalProps {
  buku: Buku | null;
  onClose: () => void;
}

export default function BarcodeModal({ buku, onClose }: BarcodeModalProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (buku && svgRef.current) {
      try {
        JsBarcode(svgRef.current, buku.isbn, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 2,
          height: 55,
          displayValue: true,
          fontSize: 13,
          font: 'monospace',
          margin: 8,
        });
      } catch (err) {
        console.error('Error generating barcode:', err);
      }
    }
  }, [buku]);

  if (!buku) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      className="barcode-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card barcode-modal-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          borderRadius: '16px',
          background: '#ffffff',
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
            borderBottom: '1px solid var(--card-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bx bx-barcode" style={{ fontSize: '22px', color: 'var(--primary)' }}></i>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Cetak Label Barcode Buku
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
            title="Tutup Modal"
          >
            <i className="bx bx-x" style={{ fontSize: '18px' }}></i>
          </button>
        </div>

        {/* Printable Label Box */}
        <div
          id="printableBarcodeArea"
          style={{
            border: '2px dashed #94a3b8',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            background: '#ffffff',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase' }}>
            PERPUSTAKAAN POLINELA
          </div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', margin: '4px 0 2px' }}>
            {buku.judul}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
            Kategori: {buku.katalog?.nama || 'Umum'} &bull; Rak: {buku.id_katalog}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
            <svg ref={svgRef} style={{ maxWidth: '100%' }}></svg>
          </div>

          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>
            POLINELA-LIB-ITEM-{buku.isbn.replace(/[^0-9]/g, '').slice(-6)}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 16px' }}>
          Format stiker barcode standar siap tempel pada buku fisik perpustakaan.
        </p>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Tutup
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-primary" style={{ gap: '6px' }}>
            <i className="bx bx-printer"></i> Cetak Label
          </button>
        </div>
      </div>
    </div>
  );
}
