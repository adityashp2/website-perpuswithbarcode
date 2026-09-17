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
  DetailPeminjaman,
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

interface CirculationLoanBatchParams {
  idAnggota: number;
  books: { isbn: string; barcode?: string; qty?: number }[];
  inputMethod?: 'scan' | 'manual';
  clientTime?: string;
}

interface CirculationReturnParams {
  barcodeOrIsbn: string;
  kondisi?: 'Baik' | 'Rusak' | 'Hilang';
  waiveFine?: boolean;
  finePaid?: number;
}

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
  updateConfig: (newCfg: Partial<LibraryConfig>) => Promise<void>;
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
  // PustakaScan Mode Kasir Engine Functions
  createCirculationLoanBatch: (params: CirculationLoanBatchParams) => Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
    loan?: Peminjaman;
  }>;
  processCirculationReturn: (params: CirculationReturnParams) => Promise<{
    success: boolean;
    message: string;
    returnedLoan?: Peminjaman;
    denda?: number;
  }>;
  renewLoan: (idPinjam: number) => Promise<{
    success: boolean;
    message: string;
    newDueDate?: string;
  }>;
  payMemberFine: (idAnggota: number, amount: number) => Promise<{
    success: boolean;
    message: string;
    receiptNo: string;
    remainingFine: number;
  }>;
  waiveMemberFine: (idAnggota: number, reason: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  unblockAnggota: (idAnggota: number) => Promise<void>;
  blockAnggota: (idAnggota: number, reason?: string) => Promise<void>;
  updateAnggotaProfile: (idAnggota: number, updatedFields: Partial<Anggota>) => Promise<void>;
  findAnggotaByCode: (code: string) => Anggota | undefined;
  findBukuByCode: (code: string) => Buku | undefined;
  resetToDemoData: () => void;
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

  const throwIfSupabaseError = (error: { message: string } | null, action: string) => {
    if (error) {
      throw new Error(`${action} gagal: ${error.message}`);
    }
  };

  // Helper local storage saver
  const saveLocal = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  };

  const resetToDemoData = () => {
    try {
      localStorage.removeItem('perpus_buku');
      localStorage.removeItem('perpus_katalog');
      localStorage.removeItem('perpus_penerbit');
      localStorage.removeItem('perpus_pengarang');
      localStorage.removeItem('perpus_peminjaman');
      localStorage.removeItem('perpus_anggota');
      localStorage.removeItem('perpus_admin');
      localStorage.removeItem('perpus_config');
    } catch {
      // ignore
    }
    setBuku(initialBuku);
    setKatalog(initialKatalog);
    setPenerbit(initialPenerbit);
    setPengarang(initialPengarang);
    setPeminjaman(initialPeminjaman);
    setAnggota(initialAnggota);
    setAdminUsers(initialAdminUsers);
    setConfig(initialConfig);
  };

  const mapSupabasePeminjaman = (item: any): Peminjaman => ({
    ...item,
    details: item.detail_peminjaman || item.details || []
  });

  // Load Initial Data (Supabase or LocalStorage/Mock)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (isSupabaseConfigured && supabase) {
        try {
          const [
            { data: bData, error: bErr },
            { data: kData, error: kErr },
            { data: pData, error: pErr },
            { data: pgData, error: pgErr },
            { data: pjData, error: pjErr },
            { data: aData, error: aErr },
            { data: admData, error: admErr },
            { data: cfgData, error: cfgErr },
          ] = await Promise.all([
            supabase.from('buku').select('*, katalog(*), penerbit(*), pengarang(*)'),
            supabase.from('katalog').select('*'),
            supabase.from('penerbit').select('*'),
            supabase.from('pengarang').select('*'),
            supabase.from('peminjaman').select('*, anggota(*), detail_peminjaman(*, buku(*))').order('tgl_pinjam', { ascending: false }),
            supabase.from('anggota').select('*'),
            supabase.from('admin').select('*'),
            supabase.from('config').select('*').limit(1).maybeSingle(),
          ]);

          if (bErr || kErr || pErr || pgErr || pjErr || aErr || admErr) {
            console.warn('One or more Supabase queries failed, fallback will be used:', { bErr, kErr, pErr, pgErr, pjErr, aErr, admErr });
            throw new Error('Supabase tables missing or incomplete');
          }

          setBuku(bData || initialBuku);
          setKatalog(kData || initialKatalog);
          setPenerbit(pData || initialPenerbit);
          setPengarang(pgData || initialPengarang);
          setPeminjaman(pjData ? pjData.map(mapSupabasePeminjaman) : initialPeminjaman);
          setAnggota(aData || initialAnggota);
          const safeAdmins = (admData || initialAdminUsers).map((u: AdminUser) =>
            u.type === 'ADM' ? { ...u, is_banned: false, banned_reason: null, banned_at: null } : u
          );
          setAdminUsers(safeAdmins);
          if (cfgData) setConfig(cfgData);
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

        let parsedBuku: Buku[] = localBuku ? JSON.parse(localBuku) : initialBuku;
        if (!Array.isArray(parsedBuku) || parsedBuku.length < 50) {
          parsedBuku = initialBuku;
          localStorage.setItem('perpus_buku', JSON.stringify(initialBuku));
        }

        let parsedPeminjaman: Peminjaman[] = localPeminjaman ? JSON.parse(localPeminjaman) : initialPeminjaman;
        if (!Array.isArray(parsedPeminjaman) || parsedPeminjaman.length < 5) {
          parsedPeminjaman = initialPeminjaman;
          localStorage.setItem('perpus_peminjaman', JSON.stringify(initialPeminjaman));
        }

        let parsedAnggota: Anggota[] = localAnggota ? JSON.parse(localAnggota) : initialAnggota;
        if (!Array.isArray(parsedAnggota) || parsedAnggota.length < 5) {
          parsedAnggota = initialAnggota;
          localStorage.setItem('perpus_anggota', JSON.stringify(initialAnggota));
        }

        const rawAdmin = localAdmin ? JSON.parse(localAdmin) : initialAdminUsers;
        const parsedAdmin: AdminUser[] = (Array.isArray(rawAdmin) ? rawAdmin : initialAdminUsers).map((u: AdminUser) =>
          u.type === 'ADM' ? { ...u, is_banned: false, banned_reason: null, banned_at: null } : u
        );
        localStorage.setItem('perpus_admin', JSON.stringify(parsedAdmin));

        setBuku(parsedBuku);
        setKatalog(localKatalog ? JSON.parse(localKatalog) : initialKatalog);
        setPenerbit(localPenerbit ? JSON.parse(localPenerbit) : initialPenerbit);
        setPengarang(localPengarang ? JSON.parse(localPengarang) : initialPengarang);
        setPeminjaman(parsedPeminjaman);
        setAnggota(parsedAnggota);
        setAdminUsers(parsedAdmin);
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

  const addBuku = async (newBook: Buku) => {
    // Generate copy barcode PS-{YY}{5 digits} if not provided
    const yearCode = new Date().getFullYear().toString().slice(-2);
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const barcodeCopy = newBook.barcode_eksemplar || `PS-${yearCode}${randomSeq}`;

    const bookWithCopy: Buku = {
      ...newBook,
      barcode_eksemplar: barcodeCopy,
    };

    const updated = [bookWithCopy, ...buku];
    setBuku(updated);
    saveLocal('perpus_buku', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('buku').insert({
        isbn: bookWithCopy.isbn,
        judul: bookWithCopy.judul,
        tahun: bookWithCopy.tahun,
        id_penerbit: bookWithCopy.id_penerbit,
        id_pengarang: bookWithCopy.id_pengarang,
        id_katalog: bookWithCopy.id_katalog,
        qty_stok: bookWithCopy.qty_stok,
        foto: bookWithCopy.foto,
        maks_pinjam_per_anggota: bookWithCopy.maks_pinjam_per_anggota,
      });
      throwIfSupabaseError(error, 'Menambahkan buku');
    }
  };

  const updateBuku = async (isbn: string, updatedFields: Partial<Buku>) => {
    const updated = buku.map((b) => (b.isbn === isbn ? { ...b, ...updatedFields } : b));
    setBuku(updated);
    saveLocal('perpus_buku', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('buku').update(updatedFields).eq('isbn', isbn);
      throwIfSupabaseError(error, 'Mengubah buku');
    }
  };

  const deleteBuku = async (isbn: string) => {
    const updated = buku.filter((b) => b.isbn !== isbn);
    setBuku(updated);
    saveLocal('perpus_buku', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('buku').delete().eq('isbn', isbn);
      throwIfSupabaseError(error, 'Menghapus buku');
    }
  };

  const updateStok = async (isbn: string, newQty: number) => {
    if (!Number.isFinite(newQty) || newQty < 0) {
      throw new Error('Jumlah stok tidak valid');
    }
    await updateBuku(isbn, { qty_stok: newQty });
  };

  const adjustStock = async (isbn: string, delta: number) => {
    const target = buku.find((item) => item.isbn === isbn);
    if (!target) return;
    await updateStok(isbn, Math.max(0, target.qty_stok + delta));
  };

  const addKatalog = async (item: Katalog) => {
    const updated = [...katalog, item];
    setKatalog(updated);
    saveLocal('perpus_katalog', updated);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('katalog').insert(item);
      throwIfSupabaseError(error, 'Menambahkan katalog');
    }
  };

  const deleteKatalog = async (id: string) => {
    const updated = katalog.filter((k) => k.id_katalog !== id);
    setKatalog(updated);
    saveLocal('perpus_katalog', updated);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('katalog').delete().eq('id_katalog', id);
      throwIfSupabaseError(error, 'Menghapus katalog');
    }
  };

  const addPenerbit = async (item: Penerbit) => {
    const updated = [...penerbit, item];
    setPenerbit(updated);
    saveLocal('perpus_penerbit', updated);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('penerbit').insert(item);
      throwIfSupabaseError(error, 'Menambahkan penerbit');
    }
  };

  const deletePenerbit = async (id: string) => {
    const updated = penerbit.filter((p) => p.id_penerbit !== id);
    setPenerbit(updated);
    saveLocal('perpus_penerbit', updated);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('penerbit').delete().eq('id_penerbit', id);
      throwIfSupabaseError(error, 'Menghapus penerbit');
    }
  };

  const addPengarang = async (item: Pengarang) => {
    const updated = [...pengarang, item];
    setPengarang(updated);
    saveLocal('perpus_pengarang', updated);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('pengarang').insert(item);
      throwIfSupabaseError(error, 'Menambahkan pengarang');
    }
  };

  const deletePengarang = async (id: string) => {
    const updated = pengarang.filter((p) => p.id_pengarang !== id);
    setPengarang(updated);
    saveLocal('perpus_pengarang', updated);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('pengarang').delete().eq('id_pengarang', id);
      throwIfSupabaseError(error, 'Menghapus pengarang');
    }
  };

  const updateConfig = async (newCfg: Partial<LibraryConfig>) => {
    const merged = { ...config, ...newCfg };
    setConfig(merged);
    saveLocal('perpus_config', merged);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('config').upsert(merged);
      throwIfSupabaseError(error, 'Menyimpan konfigurasi');
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

    // Auto-block & Denda Check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const memberActiveLoans = peminjaman.filter(
      (p) => p.id_anggota === idAnggota && (p.status === 'DIPINJAM' || p.status === 'MENUNGGU_KEMBALI')
    );
    let activeOverdueFine = 0;
    for (const loan of memberActiveLoans) {
      if (loan.tgl_kembali) {
        const due = new Date(loan.tgl_kembali);
        due.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - due.getTime();
        if (diffMs > 0) {
          const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          activeOverdueFine += daysLate * (config.dendaPerHari || 500);
        }
      }
    }
    const totalDenda = (targetAnggota.denda_tertunggak || 0) + activeOverdueFine;

    // Hard block: Denda > 50.000 atau status blocked
    if (totalDenda > 50000 || targetAnggota.status_keanggotaan === 'blocked') {
      if (targetAnggota.status_keanggotaan !== 'blocked') {
        const nextMembers = anggota.map((a) =>
          a.id_anggota === idAnggota ? { ...a, status_keanggotaan: 'blocked' as const } : a
        );
        setAnggota(nextMembers);
        saveLocal('perpus_anggota', nextMembers);
      }
      return {
        success: false,
        message: `⛔ AKUN DIBLOKIR OTOMATIS OLEH SISTEM! Akumulasi denda Anda sebesar Rp${totalDenda.toLocaleString('id-ID')} melebihi batas Rp50.000. Anda wajib mendatangi Petugas Perpustakaan untuk menyelesaikan denda dan membuka blokir.`,
      };
    }

    // Soft block: Masih ada denda > 0
    if (totalDenda > 0) {
      return {
        success: false,
        message: `⚠️ PEMINJAMAN DICEKAL SEMENTARA! Anda masih memiliki denda aktif sebesar Rp${totalDenda.toLocaleString('id-ID')}. Harap selesaikan denda atau kembalikan buku terlambat terlebih dahulu sebelum meminjam lagi.`,
      };
    }

    const tglPinjam = new Date().toISOString().split('T')[0];
    const returnDateObj = new Date();
    returnDateObj.setDate(returnDateObj.getDate() + (config.maxLamaPinjam || 7));
    const tglKembali = returnDateObj.toISOString().split('T')[0];

    const transactionId = Date.now();
    const newPinjam: Peminjaman = {
      id_pinjam: transactionId,
      nomor_transaksi: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(transactionId).slice(-4)}`,
      id_anggota: idAnggota,
      tgl_pinjam: tglPinjam,
      tgl_kembali: tglKembali,
      status: 'MENUNGGU_ACC',
      anggota: targetAnggota,
      input_method: 'manual',
      details: [
        {
          id_pinjam: transactionId,
          isbn,
          barcode_eksemplar: targetBook.barcode_eksemplar || isbn,
          qty,
          buku: targetBook,
        },
      ],
    };

    const updated = [newPinjam, ...peminjaman];
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    await updateStok(isbn, targetBook.qty_stok - qty);

    if (isSupabaseConfigured && supabase) {
      const { data: pData, error: pinjamError } = await supabase
        .from('peminjaman')
        .insert({
          id_anggota: idAnggota,
          tgl_pinjam: tglPinjam,
          tgl_kembali: tglKembali,
          status: 'MENUNGGU_ACC',
        })
        .select()
        .single();

      throwIfSupabaseError(pinjamError, 'Menyimpan peminjaman');
      if (pData) {
        const { error: detailError } = await supabase.from('detail_peminjaman').insert({
          id_pinjam: pData.id_pinjam,
          isbn,
          qty,
        });
        throwIfSupabaseError(detailError, 'Menyimpan detail peminjaman');
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
      const { error } = await supabase.from('peminjaman').update({ status: 'DIPINJAM' }).eq('id_pinjam', idPinjam);
      throwIfSupabaseError(error, 'Menyetujui peminjaman');
    }
  };

  const tolakPinjam = async (idPinjam: number) => {
    const target = peminjaman.find((p) => p.id_pinjam === idPinjam);
    if (target && target.details) {
      for (const d of target.details) {
        const b = buku.find((item) => item.isbn === d.isbn);
        if (b) await adjustStock(d.isbn, d.qty);
      }
    }

    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam ? { ...p, status: 'DITOLAK' as const } : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('peminjaman').update({ status: 'DITOLAK' }).eq('id_pinjam', idPinjam);
      throwIfSupabaseError(error, 'Menolak peminjaman');
    }
  };

  const ajukanKembali = async (idPinjam: number) => {
    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam ? { ...p, status: 'MENUNGGU_KEMBALI' as const } : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('peminjaman').update({ status: 'MENUNGGU_KEMBALI' }).eq('id_pinjam', idPinjam);
      throwIfSupabaseError(error, 'Mengajukan pengembalian');
    }
  };

  const accKembali = async (idPinjam: number, denda: number) => {
    const target = peminjaman.find((p) => p.id_pinjam === idPinjam);
    if (target && target.details) {
      for (const d of target.details) {
        const b = buku.find((item) => item.isbn === d.isbn);
        if (b) await adjustStock(d.isbn, d.qty);
      }
    }

    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam
        ? {
            ...p,
            status: 'DIKEMBALIKAN' as const,
            tgl_dikembalikan_aktual: new Date().toISOString().split('T')[0],
            denda_terhitung: denda,
            denda_dibayar: denda,
            status_denda: (denda > 0 ? 'LUNAS' : 'TIDAK_ADA') as 'LUNAS' | 'TIDAK_ADA',
          }
        : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    if (isSupabaseConfigured && supabase) {
      const { error: pinjamError } = await supabase.from('peminjaman').update({ status: 'DIKEMBALIKAN' }).eq('id_pinjam', idPinjam);
      throwIfSupabaseError(pinjamError, 'Menyetujui pengembalian');
      const { error: returnError } = await supabase.from('pengembalian').insert({
        id_pinjam: idPinjam,
        tgl_kembali: new Date().toISOString().split('T')[0],
        denda,
      });
      throwIfSupabaseError(returnError, 'Menyimpan pengembalian');
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
      const { error } = await supabase
        .from('anggota')
        .update({
          status_verifikasi: status,
          catatan_verifikasi: catatan || null,
        })
        .eq('id_anggota', idAnggota);
      throwIfSupabaseError(error, 'Memverifikasi anggota');
    }
  };

  const banUser = async (idAdmin: string, reason: string) => {
    const target = adminUsers.find((u) => u.id === idAdmin);
    if (!target || target.type === 'ADM') {
      console.warn('Proteksi Keamanan: Akun Administrator tidak dapat diblokir/banned!');
      return;
    }

    const updated = adminUsers.map((u) =>
      u.id === idAdmin ? { ...u, is_banned: true, banned_reason: reason, banned_at: new Date().toISOString() } : u
    );
    setAdminUsers(updated);
    saveLocal('perpus_admin', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('admin')
        .update({
          is_banned: true,
          banned_reason: reason,
          banned_at: new Date().toISOString(),
        })
        .eq('id', idAdmin);
      throwIfSupabaseError(error, 'Memblokir user');
    }
  };

  const unbanUser = async (idAdmin: string) => {
    const updated = adminUsers.map((u) =>
      u.id === idAdmin ? { ...u, is_banned: false, banned_reason: null, banned_at: null } : u
    );
    setAdminUsers(updated);
    saveLocal('perpus_admin', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('admin')
        .update({
          is_banned: false,
          banned_reason: null,
          banned_at: null,
        })
        .eq('id', idAdmin);
      throwIfSupabaseError(error, 'Membuka blokir user');
    }
  };

  const unblockAnggota = async (idAnggota: number) => {
    const updated = anggota.map((a) =>
      a.id_anggota === idAnggota ? { ...a, status_keanggotaan: 'active' as const } : a
    );
    setAnggota(updated);
    saveLocal('perpus_anggota', updated);

    const target = anggota.find((a) => a.id_anggota === idAnggota);
    if (target?.id_admin) {
      const nextAdmins = adminUsers.map((u) =>
        u.id === target.id_admin ? { ...u, is_banned: false, banned_reason: null, banned_at: null } : u
      );
      setAdminUsers(nextAdmins);
      saveLocal('perpus_admin', nextAdmins);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('anggota').update({ status_keanggotaan: 'active' }).eq('id_anggota', idAnggota);
      if (target?.id_admin) {
        await supabase.from('admin').update({ is_banned: false, banned_reason: null, banned_at: null }).eq('id', target.id_admin);
      }
    }
  };

  const blockAnggota = async (idAnggota: number, reason?: string) => {
    const target = anggota.find((a) => a.id_anggota === idAnggota);
    if (target?.id_admin) {
      const targetUser = adminUsers.find((u) => u.id === target.id_admin);
      if (targetUser?.type === 'ADM' || target.id_anggota === 1 || target.id_admin === '21232f297a57a5a743894a0e4a801fc3') {
        console.warn('Proteksi Keamanan: Akun Administrator tidak dapat diblokir!');
        return;
      }
    }

    const updated = anggota.map((a) =>
      a.id_anggota === idAnggota ? { ...a, status_keanggotaan: 'blocked' as const } : a
    );
    setAnggota(updated);
    saveLocal('perpus_anggota', updated);

    if (target?.id_admin) {
      const nextAdmins = adminUsers.map((u) =>
        u.id === target.id_admin ? { ...u, is_banned: true, banned_reason: reason || 'Diblokir oleh sistem (Denda > Rp50.000)', banned_at: new Date().toISOString() } : u
      );
      setAdminUsers(nextAdmins);
      saveLocal('perpus_admin', nextAdmins);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('anggota').update({ status_keanggotaan: 'blocked' }).eq('id_anggota', idAnggota);
      if (target?.id_admin) {
        await supabase.from('admin').update({ is_banned: true, banned_reason: reason || 'Diblokir oleh sistem (Denda > Rp50.000)', banned_at: new Date().toISOString() }).eq('id', target.id_admin);
      }
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

    const year = new Date().getFullYear();
    const randomSeq = String(Math.floor(100 + Math.random() * 900));
    const generatedMemberNo = `AG-${year}${randomSeq}`;

    const newAnggota: Anggota = {
      id_anggota: Date.now(),
      id_admin: newId,
      nomor_anggota: generatedMemberNo,
      nama: data.nama,
      sex: data.sex,
      telp: data.telp,
      alamat: data.alamat,
      email: data.email,
      tgl_entry: new Date().toISOString().split('T')[0],
      descripsi: 'Anggota Baru PustakaScan',
      foto: '/profile-default.svg',
      ktm_foto: data.ktmFoto || '/ktm_uploads/ktm_1788332142_ktm23.jpg',
      status_verifikasi: 'PENDING',
      tipe_anggota: 'Siswa',
      status_keanggotaan: 'active',
      masa_berlaku: `${year + 3}-12-31`,
      kuota_max: 3,
      denda_tertunggak: 0,
    };

    const nextAdmins = [...adminUsers, newAdminUser];
    const nextAnggota = [...anggota, newAnggota];

    setAdminUsers(nextAdmins);
    setAnggota(nextAnggota);
    saveLocal('perpus_admin', nextAdmins);
    saveLocal('perpus_anggota', nextAnggota);

    if (isSupabaseConfigured && supabase) {
      const { error: adminError } = await supabase.from('admin').insert({
        id: newId,
        username: data.username,
        password: 'password123',
        type: 'MBR',
      });
      throwIfSupabaseError(adminError, 'Mendaftarkan akun');
      const { error: memberError } = await supabase.from('anggota').insert({
        id_admin: newId,
        nama: data.nama,
        sex: data.sex,
        telp: data.telp,
        alamat: data.alamat,
        email: data.email,
        descripsi: 'Anggota Baru PustakaScan',
        foto: newAnggota.foto,
        ktm_foto: newAnggota.ktm_foto,
        status_verifikasi: 'PENDING',
      });
      throwIfSupabaseError(memberError, 'Mendaftarkan data anggota');
    }

    return { success: true, message: 'Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi KTM oleh Admin.' };
  };

  const updateAnggotaProfile = async (idAnggota: number, updatedFields: Partial<Anggota>) => {
    const updated = anggota.map((a) => (a.id_anggota === idAnggota ? { ...a, ...updatedFields } : a));
    setAnggota(updated);
    saveLocal('perpus_anggota', updated);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('anggota').update(updatedFields).eq('id_anggota', idAnggota);
      if (error) console.warn('Supabase update anggota profile error:', error);
    }
  };

  // =========================================================================
  // PustakaScan Mode Kasir Sirkulasi (PRD §3, §12, §14)
  // =========================================================================

  const findAnggotaByCode = (code: string): Anggota | undefined => {
    const clean = code.trim().toLowerCase();
    const cleanNoDashes = clean.replace(/[^a-z0-9]/gi, '');
    if (!clean) return undefined;

    return anggota.find((a) => {
      const no = a.nomor_anggota?.toLowerCase() || '';
      const noNoDashes = no.replace(/[^a-z0-9]/gi, '');
      const matchNo = no === clean || (cleanNoDashes.length >= 4 && noNoDashes.includes(cleanNoDashes));
      const matchId = a.id_anggota.toString() === clean;
      const matchTelp = a.telp?.toLowerCase() === clean;
      const matchName = clean.length >= 3 && a.nama.toLowerCase().includes(clean);
      return matchNo || matchId || matchTelp || matchName;
    });
  };

  const findBukuByCode = (code: string): Buku | undefined => {
    const clean = code.trim().toLowerCase();
    const cleanNoDashes = clean.replace(/[^a-z0-9]/gi, '');
    if (!clean) return undefined;

    // Remove copy suffix (e.g. -01, -02, -c1, etc.) to get base book code
    const baseCodeWithoutCopy = clean.replace(/[-_.]?(0?\d+|c\d+)$/i, '');
    const baseNoDashes = baseCodeWithoutCopy.replace(/[^a-z0-9]/gi, '');

    return buku.find((b) => {
      const copy = b.barcode_eksemplar?.toLowerCase() || '';
      const copyNoDashes = copy.replace(/[^a-z0-9]/gi, '');
      const copyBase = copy.replace(/[-_.]?(0?\d+|c\d+)$/i, '');
      const copyBaseNoDashes = copyBase.replace(/[^a-z0-9]/gi, '');
      const isbn = b.isbn.toLowerCase();
      const isbnNoDashes = isbn.replace(/[^a-z0-9]/gi, '');

      const matchCopy = copy === clean;
      const matchBase = copyBase.length >= 4 && (copyBase === baseCodeWithoutCopy || copyBaseNoDashes === baseNoDashes);
      const matchCopyLoose = cleanNoDashes.length >= 4 && (copyNoDashes === cleanNoDashes || copyNoDashes.includes(cleanNoDashes) || cleanNoDashes.includes(copyBaseNoDashes));
      const matchIsbn = isbn === clean || isbnNoDashes === cleanNoDashes || isbnNoDashes === baseNoDashes;
      const matchTitle = clean.length >= 5 && b.judul.toLowerCase().includes(clean);

      return matchCopy || matchBase || matchCopyLoose || matchIsbn || matchTitle;
    });
  };

  /**
   * Mode Kasir Batch Loan Creation (PRD §14.2 & §3)
   */
  const createCirculationLoanBatch = async ({
    idAnggota,
    books,
    inputMethod = 'scan',
  }: CirculationLoanBatchParams): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
    loan?: Peminjaman;
  }> => {
    const targetAnggota = anggota.find((a) => a.id_anggota === idAnggota);
    if (!targetAnggota) {
      return { success: false, message: 'Anggota tidak ditemukan (MEMBER_NOT_FOUND).' };
    }

    // Calculate live overdue fines + denda_tertunggak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const memberActiveLoans = peminjaman.filter(
      (p) => p.id_anggota === idAnggota && (p.status === 'DIPINJAM' || p.status === 'MENUNGGU_KEMBALI')
    );
    let activeOverdueFine = 0;
    for (const loan of memberActiveLoans) {
      if (loan.tgl_kembali) {
        const due = new Date(loan.tgl_kembali);
        due.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - due.getTime();
        if (diffMs > 0) {
          const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          activeOverdueFine += daysLate * (config.dendaPerHari || 500);
        }
      }
    }
    const totalDenda = (targetAnggota.denda_tertunggak || 0) + activeOverdueFine;

    // Hard block check: Denda > Rp 50.000 atau status blocked
    if (totalDenda > 50000 || targetAnggota.status_keanggotaan === 'blocked') {
      if (targetAnggota.status_keanggotaan !== 'blocked') {
        const nextMembers = anggota.map((a) =>
          a.id_anggota === idAnggota ? { ...a, status_keanggotaan: 'blocked' as const } : a
        );
        setAnggota(nextMembers);
        saveLocal('perpus_anggota', nextMembers);
      }
      return {
        success: false,
        message: `⛔ AKUN ANGGOTA DIBLOKIR OTOMATIS OLEH SISTEM! Total akumulasi denda Rp${totalDenda.toLocaleString('id-ID')} (> Rp50.000). Anggota wajib menyelesaikan denda di meja Admin untuk membuka blokir (MEMBER_BLOCKED_FINE_50K).`,
      };
    }

    // Soft block check: Ada denda > 0
    if (totalDenda > 0) {
      return {
        success: false,
        message: `⚠️ PEMINJAMAN DICEKAL SEMENTARA! Anggota masih memiliki denda aktif sebesar Rp${totalDenda.toLocaleString('id-ID')}. Selesaikan denda sebelum meminjam buku baru (UNPAID_FINE).`,
      };
    }

    if (targetAnggota.status_keanggotaan === 'expired') {
      return { success: false, message: 'Kartu keanggotaan sudah kadaluarsa (MEMBER_EXPIRED).' };
    }

    // Active loans count
    const activeLoans = peminjaman.filter(
      (p) => p.id_anggota === idAnggota && (p.status === 'DIPINJAM' || p.status === 'MENUNGGU_ACC')
    );
    const maxQuota = targetAnggota.kuota_max || (targetAnggota.tipe_anggota === 'Guru' ? 5 : targetAnggota.tipe_anggota === 'Umum' ? 2 : 3);
    const currentUsed = activeLoans.reduce((acc, p) => acc + (p.details?.length || 1), 0);

    if (currentUsed + books.length > maxQuota) {
      return {
        success: false,
        message: `Total buku melebihi kuota anggota (${currentUsed + books.length}/${maxQuota}) (QUOTA_EXCEEDED).`,
      };
    }

    // Validate each book
    for (const item of books) {
      const bookObj = buku.find((b) => b.isbn === item.isbn || b.barcode_eksemplar === item.barcode);
      if (!bookObj) {
        return { success: false, message: `Buku ${item.barcode || item.isbn} tidak terdaftar dalam katalog.` };
      }
      if (bookObj.is_reference) {
        return { success: false, message: `Buku "${bookObj.judul}" adalah koleksi referensi (hanya baca di tempat).` };
      }
      if (bookObj.kondisi === 'Rusak Berat') {
        return { success: false, message: `Buku "${bookObj.judul}" dalam kondisi rusak berat.` };
      }
      if (bookObj.qty_stok <= 0) {
        return { success: false, message: `Stok buku "${bookObj.judul}" sedang habis.` };
      }
      // Check if book copy is already on loan
      const isAlreadyLoaned = peminjaman.some(
        (p) =>
          p.status === 'DIPINJAM' &&
          p.details?.some(
            (d) =>
              (d.barcode_eksemplar && d.barcode_eksemplar === item.barcode) ||
              (!d.barcode_eksemplar && d.isbn === item.isbn)
          )
      );
      if (isAlreadyLoaned) {
        return {
          success: false,
          message: `Eksemplar buku "${bookObj.judul}" (${item.barcode || item.isbn}) sedang dipinjam oleh anggota lain (COPY_ON_LOAN).`,
        };
      }
    }

    // Determine loan days per member type (PRD §12.1: Siswa 7 hari, Guru 14 hari, Umum 7 hari)
    const durationDays = targetAnggota.tipe_anggota === 'Guru' ? 14 : config.maxLamaPinjam || 7;
    const now = new Date();
    const tglPinjam = now.toISOString().split('T')[0];
    const dueObj = new Date(now);
    dueObj.setDate(dueObj.getDate() + durationDays);
    const tglKembali = dueObj.toISOString().split('T')[0];

    const stamp = Date.now();
    const dateFormatted = tglPinjam.replace(/-/g, '');
    const transactionId = `TRX-${dateFormatted}-${String(stamp).slice(-4)}`;

    const details: DetailPeminjaman[] = books.map((item) => {
      const bObj = buku.find((b) => b.isbn === item.isbn || b.barcode_eksemplar === item.barcode);
      return {
        id_pinjam: stamp,
        isbn: item.isbn,
        barcode_eksemplar: item.barcode || bObj?.barcode_eksemplar || item.isbn,
        qty: item.qty || 1,
        buku: bObj,
      };
    });

    const newLoan: Peminjaman = {
      id_pinjam: stamp,
      nomor_transaksi: transactionId,
      id_anggota: idAnggota,
      tgl_pinjam: tglPinjam,
      tgl_kembali: tglKembali,
      status: 'DIPINJAM', // Mode Kasir: langsung berstatus DIPINJAM secara instan
      input_method: inputMethod,
      anggota: targetAnggota,
      details,
      renewal_count: 0,
    };

    // Deduct stock
    for (const item of books) {
      await adjustStock(item.isbn, -(item.qty || 1));
    }

    const nextLoans = [newLoan, ...peminjaman];
    setPeminjaman(nextLoans);
    saveLocal('perpus_peminjaman', nextLoans);

    return {
      success: true,
      message: `Peminjaman kasir ${transactionId} berhasil diselesaikan!`,
      transactionId,
      loan: newLoan,
    };
  };

  /**
   * Mode Kasir Rapid Return (PRD §5 & §12.5)
   */
  const processCirculationReturn = async ({
    barcodeOrIsbn,
    kondisi = 'Baik',
    waiveFine = false,
    finePaid = 0,
  }: CirculationReturnParams): Promise<{
    success: boolean;
    message: string;
    returnedLoan?: Peminjaman;
    denda?: number;
  }> => {
    const clean = barcodeOrIsbn.trim();
    if (!clean) return { success: false, message: 'Barcode atau nomor buku tidak boleh kosong.' };

    // Find active loan containing this copy
    const targetLoan = peminjaman.find(
      (p) =>
        (p.status === 'DIPINJAM' || p.status === 'MENUNGGU_KEMBALI' || p.status === 'PENDING') &&
        p.details?.some((d) => {
          const matchCopy = d.barcode_eksemplar?.toLowerCase() === clean.toLowerCase();
          const matchIsbn = d.isbn.toLowerCase() === clean.toLowerCase();
          return matchCopy || matchIsbn;
        })
    );

    if (!targetLoan) {
      return {
        success: false,
        message: `Buku dengan barcode "${clean}" tidak tercatat dalam transaksi pinjaman aktif saat ini.`,
      };
    }

    // Calculate fine: selisih hari * dendaPerHari
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(targetLoan.tgl_kembali);
    dueDate.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - dueDate.getTime();
    const daysLate = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const dailyRate = config.dendaPerHari || 500;
    let fineAmount = daysLate * dailyRate;

    // Additional fine for damaged / lost book (PRD §12.5)
    if (kondisi === 'Rusak') {
      fineAmount += 15000;
    } else if (kondisi === 'Hilang') {
      fineAmount += 75000;
    }

    // Cap fine if config set
    if (config.plafonDenda && fineAmount > config.plafonDenda) {
      fineAmount = config.plafonDenda;
    }

    const finalFine = waiveFine ? 0 : fineAmount;
    const paidAmount = waiveFine ? 0 : finePaid > 0 ? finePaid : finalFine;
    const fineStatus: 'LUNAS' | 'BELUM_LUNAS' | 'DIBEBASKAN' | 'TIDAK_ADA' =
      finalFine === 0 ? 'TIDAK_ADA' : waiveFine ? 'DIBEBASKAN' : paidAmount >= finalFine ? 'LUNAS' : 'BELUM_LUNAS';

    // Restore stock for books in this loan
    if (targetLoan.details) {
      for (const d of targetLoan.details) {
        await adjustStock(d.isbn, d.qty);
      }
    }

    // Update loan status
    const updatedLoan: Peminjaman = {
      ...targetLoan,
      status: 'DIKEMBALIKAN',
      tgl_dikembalikan_aktual: new Date().toISOString().split('T')[0],
      denda_terhitung: finalFine,
      denda_dibayar: paidAmount,
      status_denda: fineStatus,
      kondisi_kembali: kondisi,
    };

    const nextLoans = peminjaman.map((p) => (p.id_pinjam === targetLoan.id_pinjam ? updatedLoan : p));
    setPeminjaman(nextLoans);
    saveLocal('perpus_peminjaman', nextLoans);

    // If there is unpaid fine, append to member record
    if (fineStatus === 'BELUM_LUNAS' && targetLoan.id_anggota) {
      const unpaid = finalFine - paidAmount;
      const nextMembers = anggota.map((a) =>
        a.id_anggota === targetLoan.id_anggota
          ? { ...a, denda_tertunggak: (a.denda_tertunggak || 0) + unpaid }
          : a
      );
      setAnggota(nextMembers);
      saveLocal('perpus_anggota', nextMembers);
    }

    return {
      success: true,
      message: `Buku berhasil dikembalikan! ${daysLate > 0 ? `(Terlambat ${daysLate} hari, denda: Rp${finalFine.toLocaleString('id-ID')})` : '(Tepat waktu)'}`,
      returnedLoan: updatedLoan,
      denda: finalFine,
    };
  };

  /**
   * Renew Loan (PRD §12.6)
   */
  const renewLoan = async (idPinjam: number): Promise<{
    success: boolean;
    message: string;
    newDueDate?: string;
  }> => {
    const target = peminjaman.find((p) => p.id_pinjam === idPinjam);
    if (!target) return { success: false, message: 'Transaksi tidak ditemukan.' };

    const renewalCount = target.renewal_count || 0;
    const maxRenewals = target.anggota?.tipe_anggota === 'Guru' ? 2 : 1;

    if (renewalCount >= maxRenewals) {
      return { success: false, message: `Batas perpanjangan maksimal (${maxRenewals}x) sudah tercapai.` };
    }

    // Check if already overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(target.tgl_kembali);
    dueDate.setHours(0, 0, 0, 0);
    if (today > dueDate) {
      return { success: false, message: 'Buku yang sudah terlambat tidak dapat diperpanjang (harap kembalikan atau selesaikan denda).' };
    }

    // Calculate new due date from today
    const extendDays = config.maxLamaPinjam || 7;
    const newDue = new Date(today);
    newDue.setDate(newDue.getDate() + extendDays);
    const newDueDateStr = newDue.toISOString().split('T')[0];

    const updated = peminjaman.map((p) =>
      p.id_pinjam === idPinjam
        ? {
            ...p,
            tgl_kembali: newDueDateStr,
            renewal_count: renewalCount + 1,
          }
        : p
    );
    setPeminjaman(updated);
    saveLocal('perpus_peminjaman', updated);

    return {
      success: true,
      message: `Peminjaman berhasil diperpanjang hingga ${newDueDateStr}.`,
      newDueDate: newDueDateStr,
    };
  };

  /**
   * Pay Fine (PRD §F6)
   */
  const payMemberFine = async (idAnggota: number, amount: number) => {
    const target = anggota.find((a) => a.id_anggota === idAnggota);
    if (!target) return { success: false, message: 'Anggota tidak ditemukan.', receiptNo: '', remainingFine: 0 };

    const currentFine = target.denda_tertunggak || 0;
    const remaining = Math.max(0, currentFine - amount);

    const nextMembers = anggota.map((a) =>
      a.id_anggota === idAnggota ? { ...a, denda_tertunggak: remaining } : a
    );
    setAnggota(nextMembers);
    saveLocal('perpus_anggota', nextMembers);

    const year = new Date().getFullYear();
    const receiptNo = `KW-${year}-${String(Date.now()).slice(-6)}`;

    return {
      success: true,
      message: `Pembayaran denda Rp${amount.toLocaleString('id-ID')} berhasil dicatat!`,
      receiptNo,
      remainingFine: remaining,
    };
  };

  /**
   * Waive Fine (PRD §F6)
   */
  const waiveMemberFine = async (idAnggota: number, reason: string) => {
    const target = anggota.find((a) => a.id_anggota === idAnggota);
    if (!target) return { success: false, message: 'Anggota tidak ditemukan.' };

    const nextMembers = anggota.map((a) =>
      a.id_anggota === idAnggota ? { ...a, denda_tertunggak: 0 } : a
    );
    setAnggota(nextMembers);
    saveLocal('perpus_anggota', nextMembers);

    return {
      success: true,
      message: `Denda anggota ${target.nama} berhasil dibebaskan (Alasan: ${reason || 'Kebijakan Kepala Perpustakaan'}).`,
    };
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
        createCirculationLoanBatch,
        processCirculationReturn,
        renewLoan,
        payMemberFine,
        waiveMemberFine,
        unblockAnggota,
        blockAnggota,
        updateAnggotaProfile,
        findAnggotaByCode,
        findBukuByCode,
        resetToDemoData,
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
