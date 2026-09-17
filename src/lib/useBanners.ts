'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  bg_color: string;       // CSS gradient or solid color
  text_color: string;     // '#ffffff' or '#0f172a'
  icon: string;           // boxicons class e.g. 'bx-book-open'
  active: boolean;
  order: number;
}

const STORAGE_KEY = 'perpus_banners';

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'Koleksi buku baru sudah tersedia!',
    subtitle: 'Ratusan judul terbaru siap dipinjam — dari referensi akademik hingga buku populer.',
    cta_label: 'Jelajahi Katalog',
    cta_href: '/katalog',
    bg_color: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    text_color: '#ffffff',
    icon: 'bx-book-open',
    active: true,
    order: 0,
  },
  {
    id: 'banner-2',
    title: 'Pinjam buku, raih prestasi.',
    subtitle: 'Maksimal peminjaman sesuai ketentuan. Kembalikan tepat waktu dan hindari denda.',
    cta_label: 'Cek Riwayat Saya',
    cta_href: '/member/dashboard',
    bg_color: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    text_color: '#ffffff',
    icon: 'bx-trophy',
    active: true,
    order: 1,
  },
  {
    id: 'banner-3',
    title: 'Belum punya akun anggota?',
    subtitle: 'Daftarkan diri Anda sekarang untuk mulai mengakses layanan peminjaman digital Polinela.',
    cta_label: 'Daftar Sekarang',
    cta_href: '/register',
    bg_color: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    text_color: '#ffffff',
    icon: 'bx-user-plus',
    active: true,
    order: 2,
  },
];

function loadBanners(): Banner[] {
  if (typeof window === 'undefined') return DEFAULT_BANNERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Banner[];
  } catch { /* ignore */ }
  return DEFAULT_BANNERS;
}

function saveBanners(banners: Banner[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
  } catch { /* ignore */ }
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    setBanners(loadBanners());
  }, []);

  const persist = useCallback((updated: Banner[]) => {
    setBanners(updated);
    saveBanners(updated);
  }, []);

  const addBanner = useCallback((banner: Omit<Banner, 'id' | 'order'>) => {
    const current = loadBanners();
    const newBanner: Banner = {
      ...banner,
      id: `banner-${Date.now()}`,
      order: current.length,
    };
    persist([...current, newBanner]);
  }, [persist]);

  const updateBanner = useCallback((id: string, updates: Partial<Banner>) => {
    const current = loadBanners();
    persist(current.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [persist]);

  const deleteBanner = useCallback((id: string) => {
    const current = loadBanners();
    persist(current.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
  }, [persist]);

  const toggleActive = useCallback((id: string) => {
    const current = loadBanners();
    persist(current.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  }, [persist]);

  const moveUp = useCallback((id: string) => {
    const current = [...loadBanners()].sort((a, b) => a.order - b.order);
    const idx = current.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    [current[idx - 1], current[idx]] = [current[idx], current[idx - 1]];
    persist(current.map((b, i) => ({ ...b, order: i })));
  }, [persist]);

  const moveDown = useCallback((id: string) => {
    const current = [...loadBanners()].sort((a, b) => a.order - b.order);
    const idx = current.findIndex((b) => b.id === id);
    if (idx >= current.length - 1) return;
    [current[idx + 1], current[idx]] = [current[idx], current[idx + 1]];
    persist(current.map((b, i) => ({ ...b, order: i })));
  }, [persist]);

  const activeBanners = [...banners]
    .filter((b) => b.active)
    .sort((a, b) => a.order - b.order);

  return { banners, activeBanners, addBanner, updateBanner, deleteBanner, toggleActive, moveUp, moveDown };
}
