'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { 
  Buku, 
  Katalog, 
  Penerbit, 
  Pengarang, 
  LibraryConfig, 
  Peminjaman, 
  Anggota,
  AdminUser
} from '@/types/database';
import { 
  initialBuku, 
  initialKatalog, 
  initialPenerbit, 
  initialPengarang, 
  initialConfig, 
  initialPeminjaman, 
  initialAnggota,
  initialAdminUsers 
} from './mockData';

interface DataContextType {
  buku: Buku[];
  katalog: Katalog[];
  penerbit: Penerbit[];
  pengarang: Pengarang[];
  peminjaman: Peminjaman[];
  anggota: Anggota[];
  adminUsers: AdminUser[];
  config: LibraryConfig;
  isLoading: boolean;
  isUsingSupabase: boolean;
  addBuku: (buku: Buku) => Promise<void>;
  updateBuku: (isbn: string, updated: Partial<Buku>) => Promise<void>;
  deleteBuku: (isbn: string) => Promise<void>;
  updateStok: (isbn: string, newQty: number) => Promise<void>;
  addKatalog: (item: Katalog) => Promise<void>;
  deleteKatalog: (id: string) => Promise<void>;
  addPenerbit: (item: Penerbit) => Promise<void>;
  deletePenerbit: (id: string) => Promise<void>;
  addPengarang: (item: Pengarang) => Promise<void>;
  deletePengarang: (id: string) => Promise<void>;
  updateConfig: (newCfg: LibraryConfig) => Promise<void>;
  pinjamBuku: (idAnggota: number, isbn: string, qty?: number) => Promise<{ success: boolean; message: string }>;
  accPinjam: (idPinjam: number) => Promise<void>;
  tolakPinjam: (idPinjam: number) => Promise<void>;
  ajukanKembali: (idPinjam: number) => Promise<void>;
  accKembali: (idPinjam: number, denda: number) => Promise<void>;
  verifikasiAnggota: (idAnggota: number, status: 'TERVERIFIKASI' | 'DITOLAK', catatan?: string) => Promise<void>;
  banUser: (idAdmin: string, reason: string) => Promise<void>;
  unbanUser: (idAdmin: string) => Promise<void>;
  registerMember: (data: {
    username: string;
    nama: string;
    email: string;
    telp: string;
    alamat: string;
    sex: 'L' | 'P';
    ktmFoto?: string;
  }) => Promise<{ success: boolean; message: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [buku, setBuku] = useState<Buku[]>([]);
  const [katalog, setKatalog] = useState<Katalog[]>([]);
  const [penerbit, setPenerbit] = useState<Penerbit[]>([]);
  const [pengarang, setPengarang] = useState<Pengarang[]>([]);
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>([]);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [config, setConfig] = useState<LibraryConfig>(initialConfig);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data (from Supabase or LocalStorage/Mock)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (isSupabaseConfigured && supabase) {
        try {
          const [
            bukuRes,
            katRes,
            penRes,
            pengRes,
            cfgRes,
            pinjamRes,
            angRes,
            admRes
          ] = await Promise.all([
            supabase.from('buku').select('*, katalog(*), penerbit(*), pengarang(*)'),
            supabase.from('katalog').select('*'),
            supabase.from('penerbit').select('*'),
            supabase.from('pengarang').select('*'),
            supabase.from('config').select('*').single(),
            supabase.from('peminjaman').select('*, anggota(*), details:detail_peminjaman(*, buku(*))'),
            supabase.from('anggota').select('*'),
            supabase.from('admin').select('*'),
          ]);

          if (bukuRes.data && bukuRes.data.length > 0) setBuku(bukuRes.data as Buku[]);
          else setBuku(initialBuku);

          if (katRes.data && katRes.data.length > 0) setKatalog(katRes.data as Katalog[]);
          else setKatalog(initialKatalog);

          if (penRes.data && penRes.data.length > 0) setPenerbit(penRes.data as Penerbit[]);
          else setPenerbit(initialPenerbit);

          if (pengRes.data && pengRes.data.length > 0) setPengarang(pengRes.data as Pengarang[]);
          else setPengarang(initialPengarang);

          if (cfgRes.data) setConfig(cfgRes.data as LibraryConfig);
          else setConfig(initialConfig);

          if (pinjamRes.data && pinjamRes.data.length > 0) setPeminjaman(pinjamRes.data as Peminjaman[]);
          else setPeminjaman(initialPeminjaman);

          if (angRes.data && angRes.data.length > 0) setAnggota(angRes.data as Anggota[]);
          else setAnggota(initialAnggota);

          if (admRes.data && admRes.data.length > 0) setAdminUsers(admRes.data as AdminUser[]);
          else setAdminUsers(initialAdminUsers);

          setIsLoading(false);
          return;
        } catch (e) {
          console.warn('Supabase fetch failed, falling back to local store:', e);
        }
      }

      // LocalStorage / Mock fallback
      try {
        const localBuku = localStorage.getItem('perpus_buku');
        const localKatalog = localStorage.getItem('perpus_katalog');
        const localPenerbit = localStorage.getItem('perpus_penerbit');
        const localPengarang = localStorage.getItem('perpus_pengarang');
        const localPeminjaman = localStorage.getItem('perpus_peminjaman');
        const localAnggota = localStorage.getItem('perpus_anggota');
        const localAdmin = localStorage.getItem('perpus_admin');
        const localConfig = localStorage.getItem('perpus_config');

        setBuku(localBuku ? JSON.parse(localBuku) : initialBuku);
        setKatalog(localKatalog ? JSON.parse(localKatalog) : initialKatalog);
        setPenerbit(localPenerbit ? JSON.parse(localPenerbit) : initialPenerbit);
        setPengarang(localPengarang ? JSON.parse(localPengarang) : initialPengarang);
        setPeminjaman(localPeminjaman ? JSON.parse(localPeminjaman) : initialPeminjaman);
        setAnggota(localAnggota ? JSON.parse(localAnggota) : initialAnggota);
        setAdminUsers(localAdmin ? JSON.parse(localAdmin) : initialAdminUsers);
        setConfig(localConfig ? JSON.parse(localConfig) : initialConfig);
      } catch {
        setBuku(initialBuku);
        setKatalog(initialKatalog);
        setPenerbit(initialPenerbit);
        setPengarang(initialPengarang);
        setPeminjaman(initialPeminjaman);
        setAnggota(initialAnggota);
        setAdminUsers(initialAdminUsers);
        setConfig(initialConfig);
      }
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Sync to local storage
  const saveLocal = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const addBuku = async (newBook: Buku) => {
    const updated = [newBook, ...buku];
    setBuku(updated);
    saveLocal('perpus_buku', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('buku').insert({
        isbn: newBook.isbn,
        judul: newBook.judul,
        tahun: newBook.tahun,
        id_penerbit: newBook.id_penerbit,
        id_pengarang: newBook.id_pengarang,
        id_katalog: newBook.id_katalog,
        qty_stok: newBook.qty_stok,
        foto: newBook.foto,
        maks_pinjam_per_anggota: newBook.maks_pinjam_per_anggota,
      });
    }
  };

  const updateBuku = async (isbn: string, updatedFields: Partial<Buku>) => {
    const updated = buku.map((b) => (b.isbn === isbn ? { ...b, ...updatedFields } : b));
    setBuku(updated);
    saveLocal('perpus_buku', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('buku').update(updatedFields).eq('isbn', isbn);
    }
  };

  const deleteBuku = async (isbn: string) => {
    const updated = buku.filter((b) => b.isbn !== isbn);
    setBuku(updated);
    saveLocal('perpus_buku', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('buku').delete().eq('isbn', isbn);
    }
  };

  const updateStok = async (isbn: string, newQty: number) => {
    await updateBuku(isbn, { qty_stok: newQty });
  };

  const addKatalog = async (item: Katalog) => {
    const updated = [...katalog, item];
    setKatalog(updated);
    saveLocal('perpus_katalog', updated);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('katalog').insert(item);
    }
  };

  const deleteKatalog = async (id: string) => {
    const updated = katalog.filter((k) => k.id_katalog !== id);
    setKatalog(updated);
    saveLocal('perpus_katalog', updated);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('katalog').delete().eq('id_katalog', id);
    }
  };

  const addPenerbit = async (item: Penerbit) => {
    const updated = [...penerbit, item];
    setPenerbit(updated);
    saveLocal('perpus_penerbit', updated);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('penerbit').insert(item);
    }
  };

  const deletePenerbit = async (id: string) => {
    const updated = penerbit.filter((p) => p.id_penerbit !== id);
    setPenerbit(updated);
    saveLocal('perpus_penerbit', updated);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('penerbit').delete().eq('id_penerbit', id);
    }
  };

  const addPengarang = async (item: Pengarang) => {
    const updated = [...pengarang, item];
    setPengarang(updated);
    saveLocal('perpus_pengarang', updated);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('pengarang').insert(item);
    }
  };

  const deletePengarang = async (id: string) => {
    const updated = pengarang.filter((p) => p.id_pengarang !== id);
    setPengarang(updated);
    saveLocal('perpus_pengarang', updated);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('pengarang').delete().eq('id_pengarang', id);
    }
  };

  const updateConfig = async (newCfg: LibraryConfig) => {
    setConfig(newCfg);
    saveLocal('perpus_config', newCfg);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('config').upsert(newCfg);
    }
  };

  const pinjamBuku = async (
    idAnggota: number, 
    isbn: string, 
    qty = 1
  ): Promise<{ success: boolean; message: string }> => {
    const targetBook = buku.find((b) => b.isbn === isbn);
    if (!targetBook) return { success: false, message: 'Buku tidak ditemukan!' };
    if (targetBook.qty_stok < qty) return { success: false, message: 'Stok buku ini sedang habis!' };

    const targetAnggota = anggota.find((a) => a.id_anggota === idAnggota);
    if (!targetAnggota) return { success: false, message: 'Data anggota tidak valid!' };
    if (targetAnggota.status_verifikasi !== 'TERVERIFIKASI') {
      return { success: false, message: 'Akun Anda belum diverifikasi oleh Admin. Silakan tunggu verifikasi KTM!' };
    }

    const tglPinjam = new Date().toISOString().split('T')[0];
    const returnDateObj = new Date();
    returnDateObj.setDate(returnDateObj.getDate() + (config.maxLamaPinjam || 3));
    const tglKembali = returnDateObj.toISOString().split('T')[0];

    const newPinjam: Peminjaman = {
      id_pinjam: Date.now(),
      id_anggota: idAnggota,
      tgl_pinjam: tglPinjam,
      tgl_kembali: tglKembali,
      status: 'MENUNGGU_ACC',
      anggota: targetAnggota,
      details: [
        {
          id_pinjam: Date.now(),
          isbn,
          qty,
          buku: targetBook,
        },
      ],
    };

    const updated = [newPinjam, ...peminjaman];
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    // Kurangi stok reservasi
    await updateStok(isbn, targetBook.qty_stok - qty);

    if (isSupabaseConfigured && supabase) {
      const { data: pData } = await supabase
        .from('peminjaman')
        .insert({
          id_anggota: idAnggota,
          tgl_pinjam: tglPinjam,
          tgl_kembali: tglKembali,
          status: 'MENUNGGU_ACC',
        })
        .select()
        .single();

      if (pData) {
        await supabase.from('detail_peminjaman').insert({
          id_pinjam: pData.id_pinjam,
          isbn,
          qty,
        });
      }
    }

    return { success: true, message: 'Pengajuan peminjaman berhasil dibuat! Silakan tunggu konfirmasi Admin perpustakaan.' };
  };

  const accPinjam = async (idPinjam: number) => {
    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam ? { ...p, status: 'DIPINJAM' as const } : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('peminjaman').update({ status: 'DIPINJAM' }).eq('id_pinjam', idPinjam);
    }
  };

  const tolakPinjam = async (idPinjam: number) => {
    const target = peminjaman.find((p) => p.id_pinjam === idPinjam);
    if (target && target.details) {
      for (const d of target.details) {
        const b = buku.find((item) => item.isbn === d.isbn);
        if (b) await updateStok(d.isbn, b.qty_stok + d.qty);
      }
    }

    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam ? { ...p, status: 'DITOLAK' as const } : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('peminjaman').update({ status: 'DITOLAK' }).eq('id_pinjam', idPinjam);
    }
  };

  const ajukanKembali = async (idPinjam: number) => {
    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam ? { ...p, status: 'MENUNGGU_KEMBALI' as const } : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('peminjaman').update({ status: 'MENUNGGU_KEMBALI' }).eq('id_pinjam', idPinjam);
    }
  };

  const accKembali = async (idPinjam: number, denda: number) => {
    const target = peminjaman.find((p) => p.id_pinjam === idPinjam);
    if (target && target.details) {
      for (const d of target.details) {
        const b = buku.find((item) => item.isbn === d.isbn);
        if (b) await updateStok(d.isbn, b.qty_stok + d.qty);
      }
    }

    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam ? { ...p, status: 'DIKEMBALIKAN' as const } : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('peminjaman').update({ status: 'DIKEMBALIKAN' }).eq('id_pinjam', idPinjam);
      await supabase.from('pengembalian').insert({
        id_pinjam: idPinjam,
        tgl_kembali: new Date().toISOString().split('T')[0],
        denda,
      });
    }
  };

  const verifikasiAnggota = async (
    idAnggota: number, 
    status: 'TERVERIFIKASI' | 'DITOLAK', 
    catatan?: string
  ) => {
    const updated = anggota.map((a) =>
      a.id_anggota === idAnggota
        ? { ...a, status_verifikasi: status, catatan_verifikasi: catatan || null }
        : a
    );
    setAnggota(updated);
    saveLocal('perpus_anggota', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('anggota')
        .update({
          status_verifikasi: status,
          catatan_verifikasi: catatan || null,
        })
        .eq('id_anggota', idAnggota);
    }
  };

  const banUser = async (idAdmin: string, reason: string) => {
    const updated = adminUsers.map((u) =>
      u.id === idAdmin ? { ...u, is_banned: true, banned_reason: reason, banned_at: new Date().toISOString() } : u
    );
    setAdminUsers(updated);
    saveLocal('perpus_admin', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('admin')
        .update({
          is_banned: true,
          banned_reason: reason,
          banned_at: new Date().toISOString(),
        })
        .eq('id', idAdmin);
    }
  };

  const unbanUser = async (idAdmin: string) => {
    const updated = adminUsers.map((u) =>
      u.id === idAdmin ? { ...u, is_banned: false, banned_reason: null, banned_at: null } : u
    );
    setAdminUsers(updated);
    saveLocal('perpus_admin', updated);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('admin')
        .update({
          is_banned: false,
          banned_reason: null,
          banned_at: null,
        })
        .eq('id', idAdmin);
    }
  };

  const registerMember = async (data: {
    username: string;
    nama: string;
    email: string;
    telp: string;
    alamat: string;
    sex: 'L' | 'P';
    ktmFoto?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const exists = adminUsers.some((u) => u.username.toLowerCase() === data.username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username sudah terdaftar! Gunakan username lain.' };
    }

    const newId = 'usr_' + Date.now();
    const newAdminUser: AdminUser = {
      id: newId,
      username: data.username,
      type: 'MBR',
      is_banned: false,
    };

    const newAnggota: Anggota = {
      id_anggota: Date.now(),
      id_admin: newId,
      nama: data.nama,
      sex: data.sex,
      telp: data.telp,
      alamat: data.alamat,
      email: data.email,
      tgl_entry: new Date().toISOString().split('T')[0],
      descripsi: 'Anggota Baru Perpustakaan',
      foto: '/profile-default.svg',
      ktm_foto: data.ktmFoto || '/ktm_uploads/ktm_1788332142_ktm23.jpg',
      status_verifikasi: 'PENDING',
    };

    const nextAdmins = [...adminUsers, newAdminUser];
    const nextAnggota = [...anggota, newAnggota];

    setAdminUsers(nextAdmins);
    setAnggota(nextAnggota);
    saveLocal('perpus_admin', nextAdmins);
    saveLocal('perpus_anggota', nextAnggota);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('admin').insert({
        id: newId,
        username: data.username,
        password: 'password123',
        type: 'MBR',
      });
      await supabase.from('anggota').insert({
        id_admin: newId,
        nama: data.nama,
        sex: data.sex,
        telp: data.telp,
        alamat: data.alamat,
        email: data.email,
        descripsi: 'Anggota Baru Perpustakaan',
        foto: newAnggota.foto,
        ktm_foto: newAnggota.ktm_foto,
        status_verifikasi: 'PENDING',
      });
    }

    return { success: true, message: 'Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi KTM oleh Admin.' };
  };

  return (
    <DataContext.Provider
      value={{
        buku,
        katalog,
        penerbit,
        pengarang,
        peminjaman,
        anggota,
        adminUsers,
        config,
        isLoading,
        isUsingSupabase: isSupabaseConfigured,
        addBuku,
        updateBuku,
        deleteBuku,
        updateStok,
        addKatalog,
        deleteKatalog,
        addPenerbit,
        deletePenerbit,
        addPengarang,
        deletePengarang,
        updateConfig,
        pinjamBuku,
        accPinjam,
        tolakPinjam,
        ajukanKembali,
        accKembali,
        verifikasiAnggota,
        banUser,
        unbanUser,
        registerMember,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
