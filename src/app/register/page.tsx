'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import { 
  UserPlus, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard,
  ArrowRight
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { registerMember } = useData();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    email: '',
    telp: '',
    sex: 'L' as 'L' | 'P',
    alamat: '',
  });

  const [ktmFilePreview, setKtmFilePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtmFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.username.trim() || !formData.nama.trim() || !formData.email.trim()) {
      setErrorMsg('Semua kolom bertanda bintang (*) wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerMember({
        ...formData,
        ktmFoto: ktmFilePreview || undefined,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        login(formData.username);
        setTimeout(() => {
          router.push('/member/dashboard');
        }, 2000);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat memproses pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-blue-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
            Pendaftaran Anggota Baru
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Unggah Kartu Tanda Mahasiswa (KTM) untuk verifikasi otomatis oleh Petugas
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Username Akun *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Contoh: aditya23"
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nama Lengkap (Sesuai KTM) *
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Muhammad Aditya"
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Email Aktif *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@polinela.ac.id"
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nomor WhatsApp / Telp *
              </label>
              <input
                type="tel"
                required
                value={formData.telp}
                onChange={(e) => setFormData({ ...formData, telp: e.target.value })}
                placeholder="0812XXXXXXXX"
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'L' | 'P' })}
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Alamat Domisili
              </label>
              <input
                type="text"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Kota / Alamat Kos"
                className="w-full px-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* KTM Upload Section */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Foto / Scan Kartu Tanda Mahasiswa (KTM)
            </label>
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-zinc-50 dark:bg-zinc-950/40">
              {ktmFilePreview ? (
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ktmFilePreview}
                    alt="Preview KTM"
                    className="max-h-48 rounded-xl object-contain shadow-md mb-3 border border-zinc-200 dark:border-zinc-700"
                  />
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    KTM Terpilih Siap Diunggah
                  </p>
                  <label className="mt-2 text-xs text-blue-600 cursor-pointer hover:underline">
                    Ganti Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center">
                  <CreditCard className="w-10 h-10 text-zinc-400 mb-2" />
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Klik untuk pilih berkas foto KTM
                  </span>
                  <span className="text-xs text-zinc-400 mt-0.5">
                    Format JPG, PNG, atau WebP (Maks 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Mendaftarkan...' : 'Kirim Pendaftaran Anggota'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
