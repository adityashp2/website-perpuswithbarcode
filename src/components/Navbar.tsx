'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { useData } from '@/lib/dataContext';
import { 
  BookOpen, 
  User, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  Database,
  Search,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, currentAnggota, isAdmin, isMember, logout, switchRoleQuick } = useAuth();
  const { isUsingSupabase, peminjaman, anggota } = useData();
  const [isOpen, setIsOpen] = useState(false);

  const pendingCirculations = peminjaman.filter((p) => p.status === 'MENUNGGU_ACC' || p.status === 'MENUNGGU_KEMBALI').length;
  const pendingVerifications = anggota.filter((a) => a.status_verifikasi === 'PENDING').length;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Pustaka Polinela
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  Barcode Pro
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-0.5">
                Perpustakaan Politeknik Negeri Lampung
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/katalog"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/katalog') 
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              Katalog Buku
            </Link>

            {/* Member Portal Link */}
            {isMember && (
              <Link
                href="/member/dashboard"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/member') 
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                Peminjaman Saya
              </Link>
            )}

            {/* Admin Management Links */}
            {isAdmin && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    pathname.startsWith('/admin/dashboard') 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/sirkulasi"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    pathname.startsWith('/admin/sirkulasi') 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  Sirkulasi
                  {pendingCirculations > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                      {pendingCirculations}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/buku"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/buku') 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  Kelola Buku & Barcode
                </Link>
                <Link
                  href="/admin/verifikasi"
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    pathname.startsWith('/admin/verifikasi') 
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' 
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  Verifikasi KTM
                  {pendingVerifications > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                      {pendingVerifications}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* Right Action: Role info, Supabase status & Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Supabase connection indicator */}
            <div 
              title={isUsingSupabase ? 'Terhubung ke Supabase Cloud Database' : 'Mode Offline/Local Demo'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
            >
              <div className={`w-2 h-2 rounded-full ${isUsingSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="hidden lg:inline">{isUsingSupabase ? 'Supabase Connected' : 'Demo Mode'}</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center justify-end gap-1">
                    {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                    {currentAnggota?.nama || currentUser.username}
                  </p>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400">
                    {isAdmin ? 'Petugas Admin' : 'Mahasiswa / Member'}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Daftar Anggota
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-2 pb-6 space-y-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 dark:text-white"
          >
            Beranda
          </Link>
          <Link
            href="/katalog"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 dark:text-white"
          >
            Katalog Buku
          </Link>

          {isMember && (
            <Link
              href="/member/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 dark:text-white"
            >
              Peminjaman Saya
            </Link>
          )}

          {isAdmin && (
            <>
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 dark:text-white"
              >
                Admin Dashboard
              </Link>
              <Link
                href="/admin/sirkulasi"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 dark:text-white"
              >
                Sirkulasi Peminjaman ({pendingCirculations})
              </Link>
              <Link
                href="/admin/buku"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 dark:text-white"
              >
                Kelola Buku & Barcode
              </Link>
              <Link
                href="/admin/verifikasi"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 dark:text-white"
              >
                Verifikasi KTM ({pendingVerifications})
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
            {currentUser ? (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-rose-600 font-medium flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Keluar ({currentUser.username})
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 px-4 border border-zinc-200 dark:border-zinc-800 rounded-lg font-medium text-zinc-700 dark:text-zinc-200"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center py-2 px-4 bg-blue-600 text-white rounded-lg font-medium"
                >
                  Daftar Anggota Baru
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
