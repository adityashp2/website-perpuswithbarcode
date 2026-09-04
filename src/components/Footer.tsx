import React from 'react';
import Link from 'next/link';
import { BookOpen, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-zinc-900 dark:text-white">
                Perpustakaan Politeknik Negeri Lampung
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
              Sistem Informasi Manajemen Perpustakaan Terpadu dengan Integrasi Barcode, Verifikasi Berkas KTM Mahasiswa, dan Cloud Database Supabase yang dihosting di Vercel.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Layanan Mahasiswa
            </h4>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>
                <Link href="/katalog" className="hover:text-blue-600 transition-colors">
                  Katalog Koleksi Buku
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600 transition-colors">
                  Registrasi Anggota Baru
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Portal Masuk Anggota
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Administrasi
            </h4>
            <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Login Petugas
                </Link>
              </li>
              <li>
                <Link href="/admin/sirkulasi" className="hover:text-blue-600 transition-colors">
                  Validasi Sirkulasi Pinjam
                </Link>
              </li>
              <li>
                <Link href="/admin/buku" className="hover:text-blue-600 transition-colors">
                  Cetak Label Barcode Buku
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} UPT Perpustakaan Polinela. Ready for Vercel & Supabase.</p>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Secure Cloud Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
