import { AdminUser, Anggota, Buku, Katalog, Penerbit, Pengarang, LibraryConfig, Peminjaman } from '@/types/database';

export const initialConfig: LibraryConfig = {
  id: 1,
  maxLamaPinjam: 7,
  dendaPerHari: 500,
  namaPerpustakaan: 'Perpustakaan Terpadu Polinela',
  namaInstansi: 'Politeknik Negeri Lampung',
  logoInstansi: '/buku/1788324109_logo.jpg',
  alamatPerpustakaan: 'Jl. Soekarno-Hatta No. 10, Rajabasa, Bandar Lampung',
  jamLayanan: 'Senin – Jumat (08.00 – 16.00 WIB)',
  heroTag: 'PUSTAKASCAN • POLINELA',
  heroTitle: 'Sirkulasi buku secepat kasir minimarket.',
  heroSubtitle: 'Petugas memindai barcode buku dan kartu anggota dalam 5 detik. Tanpa antrean panjang, lengkap dengan cetak slip thermal 58mm dan deteksi otomatis denda keterlambatan.',
  heroImage: '/buku/1788324109_logo.jpg',
  kartuJudul: 'KARTU TANDA ANGGOTA PERPUSTAKAAN',
  kartuCatatan: 'Kartu ini sah sebagai identitas peminjaman buku resmi perpustakaan digital.',
  kartuColorTheme: 'gradient-blue',
  ambangDendaBlokir: 50000,
  plafonDenda: 100000,
  voidWindowMinutes: 5,
  thermalSlipWidthMm: 58,
};

export const initialKatalog: Katalog[] = [
  { id_katalog: 'KG0', nama: '000 — Komputer & Pemrograman' },
  { id_katalog: 'KG1', nama: '600 — Teknologi & Sains Terapan' },
  { id_katalog: 'KG2', nama: '300 — Ekonomi, Bisnis & Sosial' },
  { id_katalog: 'KG3', nama: '630 — Pertanian Presisi & Agro' },
  { id_katalog: 'KG4', nama: '800 — Sastra & Fiksi' },
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
    nama_penerbit: 'Pustaka Gramedia',
    email: 'kontak@gramedia.com',
    telp: '021-53650110',
    alamat: 'Jl. Palmerah Barat 29-37 Jakarta',
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
    nama_pengarang: 'Pramoedya Ananta Toer',
    email: 'info@hasta.id',
    telp: '08129876543',
    alamat: 'Jakarta',
  },
  {
    id_pengarang: 'PG03',
    nama_pengarang: 'Andrea Hirata',
    email: 'andrea@bentang.id',
    telp: '08210000111',
    alamat: 'Belitung',
  },
];

import { BOOKS_100 } from './mockBooks100';

export const initialBuku: Buku[] = BOOKS_100;

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
  {
    id: 'user_member_demo_2',
    username: 'siti',
    type: 'MBR',
    is_banned: false,
  },
];

export const initialAnggota: Anggota[] = [
  {
    id_anggota: 1,
    id_admin: '21232f297a57a5a743894a0e4a801fc3',
    nomor_anggota: 'AG-20260001',
    nama: 'Administrator Utama',
    sex: 'L',
    telp: '081270000000',
    alamat: 'Ruang Layanan Sirkulasi PustakaScan',
    email: 'admin@pustakascan.id',
    tgl_entry: '2024-01-01',
    descripsi: 'Petugas & Kepala Sirkulasi PustakaScan',
    foto: '/profile-default.svg',
    status_verifikasi: 'TERVERIFIKASI',
    tipe_anggota: 'Guru',
    status_keanggotaan: 'active',
    masa_berlaku: '2028-12-31',
    kuota_max: 5,
    denda_tertunggak: 0,
  },
  {
    id_anggota: 2,
    id_admin: 'user_member_demo_1',
    nomor_anggota: 'AG-20260184',
    nama: 'Muhammad Aditya Saputra',
    sex: 'L',
    telp: '085788990011',
    alamat: 'Bandar Lampung, Rajabasa',
    email: 'aditya.mhs@pustakascan.id',
    tgl_entry: '2024-03-10',
    descripsi: 'Anggota Aktif — Siswa',
    foto: '/profile-default.svg',
    ktm_foto: '/ktm_uploads/ktm_1788332142_ktm23.jpg',
    status_verifikasi: 'TERVERIFIKASI',
    tipe_anggota: 'Siswa',
    status_keanggotaan: 'active',
    masa_berlaku: '2027-12-31',
    kuota_max: 3,
    denda_tertunggak: 0,
  },
  {
    id_anggota: 3,
    id_admin: 'user_member_demo_2',
    nomor_anggota: 'AG-20260205',
    nama: 'Siti Rahmawati',
    sex: 'P',
    telp: '085711223344',
    alamat: 'Way Halim Permai, Bandar Lampung',
    email: 'siti.rahma@pustakascan.id',
    tgl_entry: '2024-04-12',
    descripsi: 'Anggota Aktif — Siswa',
    foto: '/profile-default.svg',
    status_verifikasi: 'TERVERIFIKASI',
    tipe_anggota: 'Siswa',
    status_keanggotaan: 'active',
    masa_berlaku: '2027-12-31',
    kuota_max: 3,
    denda_tertunggak: 2500, // Ada denda tertunggak sesuai skenario PRD
  },
  {
    id_anggota: 4,
    id_admin: 'user_member_demo_3',
    nomor_anggota: 'AG-20260099',
    nama: 'Hendra Wijaya',
    sex: 'L',
    telp: '081299887766',
    alamat: 'Kedaton, Bandar Lampung',
    email: 'hendra.w@gmail.com',
    tgl_entry: '2024-02-15',
    descripsi: 'Anggota Umum Terdaftar',
    foto: '/profile-default.svg',
    status_verifikasi: 'TERVERIFIKASI',
    tipe_anggota: 'Umum',
    status_keanggotaan: 'active',
    masa_berlaku: '2026-10-15',
    kuota_max: 2,
    denda_tertunggak: 0,
  },
  {
    id_anggota: 5,
    id_admin: 'user_member_demo_4',
    nomor_anggota: 'AG-20260055',
    nama: 'Rian Firmansyah',
    sex: 'L',
    telp: '081377889900',
    alamat: 'Sukabumi, Bandar Lampung',
    email: 'rian.f@pustakascan.id',
    tgl_entry: '2024-01-20',
    descripsi: 'Anggota Siswa — Terblokir Otomatis (Denda > Rp50.000)',
    foto: '/profile-default.svg',
    status_verifikasi: 'TERVERIFIKASI',
    tipe_anggota: 'Siswa',
    status_keanggotaan: 'blocked',
    masa_berlaku: '2027-12-31',
    kuota_max: 3,
    denda_tertunggak: 52500, // Denda > Rp 50.000 memicu Auto-Block Sistem
  },
];

export const initialPeminjaman: Peminjaman[] = [
  {
    id_pinjam: 101,
    nomor_transaksi: 'TRX-20260901-0001',
    id_anggota: 3, // Siti Rahmawati (TELAT: Jatuh tempo 8 Sept 2026)
    tgl_pinjam: '2026-09-01',
    tgl_kembali: '2026-09-08',
    status: 'DIPINJAM',
    input_method: 'scan',
    anggota: initialAnggota[2],
    details: [
      {
        id_pinjam: 101,
        isbn: '978-623-01-0812-7',
        barcode_eksemplar: 'PS-2600099-01',
        qty: 1,
        buku: initialBuku[98] || initialBuku[0],
      },
    ],
  },
  {
    id_pinjam: 102,
    nomor_transaksi: 'TRX-20260902-0045',
    id_anggota: 2, // Muhammad Aditya Saputra (TERLAMBAT: Jatuh tempo 9 Sept 2026)
    tgl_pinjam: '2026-09-02',
    tgl_kembali: '2026-09-09',
    status: 'DIPINJAM',
    input_method: 'scan',
    anggota: initialAnggota[1],
    details: [
      {
        id_pinjam: 102,
        isbn: '978-623-01-0101-2',
        barcode_eksemplar: 'PS-2600002-02',
        qty: 1,
        buku: initialBuku[1],
      },
    ],
  },
  {
    id_pinjam: 103,
    nomor_transaksi: 'TRX-20260914-0082',
    id_anggota: 2, // Muhammad Aditya Saputra (TEPAT WAKTU: Jatuh tempo 21 Sept 2026)
    tgl_pinjam: '2026-09-14',
    tgl_kembali: '2026-09-21',
    status: 'DIPINJAM',
    input_method: 'scan',
    anggota: initialAnggota[1],
    details: [
      {
        id_pinjam: 103,
        isbn: '978-602-04-9988-0',
        barcode_eksemplar: 'PS-2600001-01',
        qty: 1,
        buku: initialBuku[0],
      },
    ],
  },
  {
    id_pinjam: 104,
    nomor_transaksi: 'TRX-20260510-0019',
    id_anggota: 5, // Rian Firmansyah (TERLAMBAT PARAH: Jatuh tempo 17 Mei 2026, denda akumulasi > 50.000)
    tgl_pinjam: '2026-05-10',
    tgl_kembali: '2026-05-17',
    status: 'DIPINJAM',
    input_method: 'scan',
    anggota: initialAnggota[4],
    details: [
      {
        id_pinjam: 104,
        isbn: '978-602-04-9989-7',
        barcode_eksemplar: 'PS-2600005-03',
        qty: 1,
        buku: initialBuku[4] || initialBuku[0],
      },
    ],
  },
  {
    id_pinjam: 105,
    nomor_transaksi: 'TRX-20260915-0102',
    id_anggota: 4, // Hendra Wijaya (TEPAT WAKTU: Jatuh tempo 22 Sept 2026)
    tgl_pinjam: '2026-09-15',
    tgl_kembali: '2026-09-22',
    status: 'DIPINJAM',
    input_method: 'scan',
    anggota: initialAnggota[3],
    details: [
      {
        id_pinjam: 105,
        isbn: '978-623-01-0103-6',
        barcode_eksemplar: 'PS-2600004-01',
        qty: 1,
        buku: initialBuku[3] || initialBuku[0],
      },
    ],
  },
];
