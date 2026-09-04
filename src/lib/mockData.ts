import { AdminUser, Anggota, Buku, Katalog, Penerbit, Pengarang, LibraryConfig, Peminjaman } from '@/types/database';

export const initialConfig: LibraryConfig = {
  id: 1,
  maxLamaPinjam: 3,
  dendaPerHari: 500,
};

export const initialKatalog: Katalog[] = [
  { id_katalog: 'KG0', nama: 'Komputer & Pemrograman' },
  { id_katalog: 'KG1', nama: 'Sains & Teknologi' },
  { id_katalog: 'KG2', nama: 'Ekonomi & Bisnis' },
  { id_katalog: 'KG3', nama: 'Pertanian Terapan' },
  { id_katalog: 'KG4', nama: 'Sosial & Humaniora' },
];

export const initialPenerbit: Penerbit[] = [
  {
    id_penerbit: 'PN01',
    nama_penerbit: 'Informatika Bandung',
    email: 'info@informatika.com',
    telp: '022-7208123',
    alamat: 'Jl. Buah Batu No. 45 Bandung',
  },
  {
    id_penerbit: 'PN02',
    nama_penerbit: 'Andi Offset Yogyakarta',
    email: 'redaksi@andipublisher.com',
    telp: '0274-561881',
    alamat: 'Jl. Beo 38-40 Yogyakarta',
  },
  {
    id_penerbit: 'PN03',
    nama_penerbit: 'Polinela Press',
    email: 'press@polinela.ac.id',
    telp: '0721-703995',
    alamat: 'Gedung Perpustakaan Lt. 2 Polinela',
  },
];

export const initialPengarang: Pengarang[] = [
  {
    id_pengarang: 'PG01',
    nama_pengarang: 'Budi Raharjo',
    email: 'budi@raharjo.id',
    telp: '08123456789',
    alamat: 'Bandung',
  },
  {
    id_pengarang: 'PG02',
    nama_pengarang: 'Abdul Kadir',
    email: 'abdul.kadir@gmail.com',
    telp: '08129876543',
    alamat: 'Yogyakarta',
  },
  {
    id_pengarang: 'PG03',
    nama_pengarang: 'Tim Dosen Polinela',
    email: 'dosen@polinela.ac.id',
    telp: '08210000111',
    alamat: 'Bandar Lampung',
  },
];

export const initialBuku: Buku[] = [
  {
    isbn: '978-623-01-0812-7',
    judul: 'Belajar Pemrograman Web Modern & Database Supabase',
    tahun: 2024,
    id_penerbit: 'PN01',
    id_pengarang: 'PG01',
    id_katalog: 'KG0',
    qty_stok: 12,
    foto: '/buku/1788321818_Gemini_Generated_Image_q4cmfbq4cmfbq4cm1.jpg',
    maks_pinjam_per_anggota: 2,
    katalog: { id_katalog: 'KG0', nama: 'Komputer & Pemrograman' },
    penerbit: { id_penerbit: 'PN01', nama_penerbit: 'Informatika Bandung' },
    pengarang: { id_pengarang: 'PG01', nama_pengarang: 'Budi Raharjo' },
  },
  {
    isbn: '978-979-29-5321-1',
    judul: 'Algoritma dan Struktur Data Terapan',
    tahun: 2023,
    id_penerbit: 'PN02',
    id_pengarang: 'PG02',
    id_katalog: 'KG0',
    qty_stok: 8,
    foto: '/buku/1788322287_istockphoto-1726263781-612x612.jpg',
    maks_pinjam_per_anggota: 1,
    katalog: { id_katalog: 'KG0', nama: 'Komputer & Pemrograman' },
    penerbit: { id_penerbit: 'PN02', nama_penerbit: 'Andi Offset Yogyakarta' },
    pengarang: { id_pengarang: 'PG02', nama_pengarang: 'Abdul Kadir' },
  },
  {
    isbn: '978-602-04-9988-0',
    judul: 'Sistem Informasi Manajemen Terpadu Perpustakaan Kampus',
    tahun: 2024,
    id_penerbit: 'PN03',
    id_pengarang: 'PG03',
    id_katalog: 'KG1',
    qty_stok: 15,
    foto: '/buku/1788324109_logo.jpg',
    maks_pinjam_per_anggota: 2,
    katalog: { id_katalog: 'KG1', nama: 'Sains & Teknologi' },
    penerbit: { id_penerbit: 'PN03', nama_penerbit: 'Polinela Press' },
    pengarang: { id_pengarang: 'PG03', nama_pengarang: 'Tim Dosen Polinela' },
  },
  {
    isbn: '978-623-22-1209-4',
    judul: 'Inovasi Pertanian Presisi Era Digital 5.0',
    tahun: 2024,
    id_penerbit: 'PN03',
    id_pengarang: 'PG03',
    id_katalog: 'KG3',
    qty_stok: 10,
    foto: '/buku/1788322296_mieayam.jpg',
    maks_pinjam_per_anggota: 2,
    katalog: { id_katalog: 'KG3', nama: 'Pertanian Terapan' },
    penerbit: { id_penerbit: 'PN03', nama_penerbit: 'Polinela Press' },
    pengarang: { id_pengarang: 'PG03', nama_pengarang: 'Tim Dosen Polinela' },
  },
];

export const initialAdminUsers: AdminUser[] = [
  {
    id: '21232f297a57a5a743894a0e4a801fc3',
    username: 'admin',
    type: 'ADM',
    is_banned: false,
  },
  {
    id: 'user_member_demo_1',
    username: 'mahasiswa',
    type: 'MBR',
    is_banned: false,
  },
];

export const initialAnggota: Anggota[] = [
  {
    id_anggota: 1,
    id_admin: '21232f297a57a5a743894a0e4a801fc3',
    nama: 'Administrator Polinela',
    sex: 'L',
    telp: '081270000000',
    alamat: 'UPT Perpustakaan Politeknik Negeri Lampung',
    email: 'admin@polinela.ac.id',
    tgl_entry: '2024-01-01',
    descripsi: 'Kepala Bagian IT Perpustakaan Polinela',
    foto: '/profile-default.svg',
    status_verifikasi: 'TERVERIFIKASI',
  },
  {
    id_anggota: 2,
    id_admin: 'user_member_demo_1',
    nama: 'Muhammad Aditya Saputra',
    sex: 'L',
    telp: '085788990011',
    alamat: 'Bandar Lampung, Rajabasa',
    email: 'aditya.mhs@polinela.ac.id',
    tgl_entry: '2024-03-10',
    descripsi: 'Mahasiswa Manajemen Informatika Polinela',
    foto: '/profile-default.svg',
    ktm_foto: '/ktm_uploads/ktm_1788332142_ktm23.jpg',
    status_verifikasi: 'TERVERIFIKASI',
  },
];

export const initialPeminjaman: Peminjaman[] = [
  {
    id_pinjam: 101,
    id_anggota: 2,
    tgl_pinjam: '2026-09-01',
    tgl_kembali: '2026-09-04',
    status: 'DIPINJAM',
    anggota: initialAnggota[1],
    details: [
      {
        id_pinjam: 101,
        isbn: '978-623-01-0812-7',
        qty: 1,
        buku: initialBuku[0],
      },
    ],
  },
];
