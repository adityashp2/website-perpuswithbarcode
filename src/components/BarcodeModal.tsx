'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Buku } from '@/types/database';
import { X, Printer, Download, Check } from 'lucide-react';

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
          height: 60,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          margin: 10,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden print:shadow-none print:border-none print:w-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              Cetak Barcode Label Buku
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card */}
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-5 bg-white text-zinc-900 print:border-solid print:border-black">
            <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              PERPUSTAKAAN POLINELA
            </p>
            <h3 className="font-bold text-base text-zinc-900 mt-1 line-clamp-1">
              {buku.judul}
            </h3>
            <p className="text-xs text-zinc-600 mb-2">
              Kategori: {buku.katalog?.nama || 'Umum'} | Rak: {buku.id_katalog || 'KG0'}
            </p>

            {/* SVG Barcode rendered via JsBarcode */}
            <div className="my-2 flex justify-center bg-white p-2">
              <svg ref={svgRef} className="max-w-full" />
            </div>

            <p className="text-[11px] font-mono font-medium text-zinc-500">
              POLINELA-LIB-ITEM-{buku.isbn.replace(/[^0-9]/g, '').slice(-6)}
            </p>
          </div>

          <p className="text-xs text-zinc-500 mt-4 print:hidden">
            Format stiker barcode standar siap tempel pada buku fisik perpustakaan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak Label
          </button>
        </div>
      </div>
    </div>
  );
}
