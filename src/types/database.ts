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

export type TipeAnggota = 'Siswa' | 'Guru' | 'Umum';
export type StatusKeanggotaan = 'active' | 'blocked' | 'expired';

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
  // PRD PustakaScan Fields
  nomor_anggota?: string; // e.g. AG-20260184
  tipe_anggota?: TipeAnggota;
  status_keanggotaan?: StatusKeanggotaan;
  masa_berlaku?: string;
  kuota_max?: number;
  denda_tertunggak?: number;
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
  // PRD Fields:
  barcode_eksemplar?: string; // e.g. PS-2600001
  ddc?: string;
  lokasi_rak?: string;
  kondisi?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  is_reference?: boolean;
  sinopsis?: string;
  // Joined relation fields for convenience:
  penerbit?: Penerbit;
  pengarang?: Pengarang;
  katalog?: Katalog;
}

export interface LibraryConfig {
  id: number;
  maxLamaPinjam: number;
  dendaPerHari: number;
  namaPerpustakaan: string;
  namaAplikasi?: string;
  alamatPerpustakaan?: string;
  namaInstansi?: string;
  logoInstansi?: string;
  jamLayanan?: string;
  // Landing Page Customization
  heroTag?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  // Member Card Customization
  kartuJudul?: string;
  kartuCatatan?: string;
  kartuColorTheme?: string;
  ambangDendaBlokir?: number; // e.g. Rp10.000
  plafonDenda?: number; // max fine
  voidWindowMinutes?: number; // e.g. 5 minutes
  thermalSlipWidthMm?: 58 | 80;
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
  // PRD Circulation Fields
  nomor_transaksi?: string; // e.g. TRX-20260207-0031
  input_method?: 'scan' | 'manual';
  tgl_dikembalikan_aktual?: string | null;
  denda_terhitung?: number;
  denda_dibayar?: number;
  status_denda?: 'LUNAS' | 'BELUM_LUNAS' | 'DIBEBASKAN' | 'TIDAK_ADA';
  kondisi_kembali?: 'Baik' | 'Rusak' | 'Hilang';
  renewal_count?: number;
}

export interface DetailPeminjaman {
  id_pinjam: number;
  isbn: string;
  qty: number;
  barcode_eksemplar?: string;
  buku?: Buku;
}

export interface Pengembalian {
  id_kembali: number;
  id_pinjam: number;
  tgl_kembali: string;
  denda: number;
  peminjaman?: Peminjaman;
}
