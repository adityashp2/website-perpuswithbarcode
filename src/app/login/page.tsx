'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { 
  BookOpen, 
  LogIn, 
  ShieldCheck, 
  User, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchRoleQuick } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Masukkan username Anda!');
      return;
    }

    const res = login(username);
    if (res.success) {
      if (username.toLowerCase() === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/member/dashboard');
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleQuickDemo = (type: 'ADM' | 'MBR') => {
    switchRoleQuick(type);
    if (type === 'ADM') {
      router.push('/admin/dashboard');
    } else {
      router.push('/member/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
            Masuk Portal Pustaka
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gunakan akun Mahasiswa atau Petugas Perpustakaan Polinela
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: admin atau mahasiswa"
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk Akun</span>
          </button>
        </form>

        {/* Quick Demo Shortcuts for Reviewers & Examiners */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Demo 1-Klik (Penguji & Reviewer)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADM')}
              className="p-2.5 text-left border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Petugas Admin</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Username: admin</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('MBR')}
              className="p-2.5 text-left border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <User className="w-4 h-4" />
                <span>Mahasiswa</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Username: mahasiswa</p>
            </button>
          </div>
        </div>

        {/* Register footer link */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          Belum punya akun perpustakaan?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Daftar sebagai Anggota
          </Link>
        </div>
      </div>
    </div>
  );
}
