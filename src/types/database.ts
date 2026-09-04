export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  type: 'ADM' | 'MBR';
  is_banned: boolean;
  banned_reason?: string | null;
  banned_at?: string | null;
  created_at?: string;
}

export interface Anggota {
  id_anggota: number;
  id_admin: string;
  nama: string;
  sex: 'L' | 'P';
  telp?: string | null;
  alamat?: string | null;
  email?: string | null;
  tgl_entry: string;
  descripsi?: string | null;
  foto?: string | null;
  ktm_foto?: string | null;
  status_verifikasi: 'PENDING' | 'TERVERIFIKASI' | 'DITOLAK';
  catatan_verifikasi?: string | null;
}

export interface Katalog {
  id_katalog: string;
  nama: string;
}

export interface Penerbit {
  id_penerbit: string;
  nama_penerbit: string;
  email?: string | null;
  telp?: string | null;
  alamat?: string | null;
}

export interface Pengarang {
  id_pengarang: string;
  nama_pengarang: string;
  email?: string | null;
  telp?: string | null;
  alamat?: string | null;
}

export interface Buku {
  isbn: string;
  judul: string;
  tahun: number;
  id_penerbit?: string | null;
  id_pengarang?: string | null;
  id_katalog?: string | null;
  qty_stok: number;
  foto?: string | null;
  maks_pinjam_per_anggota: number;
  // Joined relation fields for convenience:
  penerbit?: Penerbit;
  pengarang?: Pengarang;
  katalog?: Katalog;
}

export interface LibraryConfig {
  id: number;
  maxLamaPinjam: number;
  dendaPerHari: number;
}

export interface Peminjaman {
  id_pinjam: number;
  id_anggota: number;
  tgl_pinjam: string;
  tgl_kembali: string;
  status: 'MENUNGGU_ACC' | 'DIPINJAM' | 'MENUNGGU_KEMBALI' | 'DIKEMBALIKAN' | 'DITOLAK' | 'PENDING' | 'KEMBALI' | 'SELESAI';
  anggota?: Anggota;
  details?: DetailPeminjaman[];
  denda_estimasi?: number;
}

export interface DetailPeminjaman {
  id_pinjam: number;
  isbn: string;
  qty: number;
  buku?: Buku;
}

export interface Pengembalian {
  id_kembali: number;
  id_pinjam: number;
  tgl_kembali: string;
  denda: number;
  peminjaman?: Peminjaman;
}
