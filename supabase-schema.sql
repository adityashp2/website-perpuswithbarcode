-- =========================================================
-- SQL SCHEMA UNTUK SUPABASE (POSTGRESQL) - WEB PERPUSTAKAAN
-- Copy dan Paste seluruh script ini ke Supabase SQL Editor!
-- =========================================================

-- 1. Enable pgcrypto untuk hash jika dibutuhkan
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL ADMIN / AKUN PENGGUNA
CREATE TABLE IF NOT EXISTS public.admin (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'MBR', -- 'ADM' (Admin) atau 'MBR' (Member)
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    banned_reason TEXT,
    banned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL ANGGOTA
CREATE TABLE IF NOT EXISTS public.anggota (
    id_anggota SERIAL PRIMARY KEY,
    id_admin TEXT REFERENCES public.admin(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    sex CHAR(1) NOT NULL DEFAULT 'L',
    telp VARCHAR(20),
    alamat TEXT,
    email TEXT,
    tgl_entry DATE DEFAULT CURRENT_DATE,
    descripsi TEXT,
    foto TEXT,
    ktm_foto TEXT,
    status_verifikasi VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'TERVERIFIKASI', 'DITOLAK'
    catatan_verifikasi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL KATALOG
CREATE TABLE IF NOT EXISTS public.katalog (
    id_katalog VARCHAR(20) PRIMARY KEY,
    nama TEXT NOT NULL
);

-- 5. TABEL PENERBIT
CREATE TABLE IF NOT EXISTS public.penerbit (
    id_penerbit VARCHAR(20) PRIMARY KEY,
    nama_penerbit TEXT NOT NULL,
    email VARCHAR(100),
    telp VARCHAR(30),
    alamat TEXT
);

-- 6. TABEL PENGARANG
CREATE TABLE IF NOT EXISTS public.pengarang (
    id_pengarang VARCHAR(20) PRIMARY KEY,
    nama_pengarang TEXT NOT NULL,
    email VARCHAR(100),
    telp VARCHAR(30),
    alamat TEXT
);

-- 7. TABEL BUKU
CREATE TABLE IF NOT EXISTS public.buku (
    isbn VARCHAR(50) PRIMARY KEY,
    judul TEXT NOT NULL,
    tahun INTEGER,
    id_penerbit VARCHAR(20) REFERENCES public.penerbit(id_penerbit) ON UPDATE CASCADE ON DELETE SET NULL,
    id_pengarang VARCHAR(20) REFERENCES public.pengarang(id_pengarang) ON UPDATE CASCADE ON DELETE SET NULL,
    id_katalog VARCHAR(20) REFERENCES public.katalog(id_katalog) ON UPDATE CASCADE ON DELETE SET NULL,
    qty_stok INTEGER NOT NULL DEFAULT 0,
    foto TEXT,
    maks_pinjam_per_anggota INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL CONFIG PERPUSTAKAAN
CREATE TABLE IF NOT EXISTS public.config (
    id SERIAL PRIMARY KEY,
    maxLamaPinjam INTEGER DEFAULT 3,
    dendaPerHari NUMERIC DEFAULT 500
);

-- 9. TABEL PEMINJAMAN
CREATE TABLE IF NOT EXISTS public.peminjaman (
    id_pinjam SERIAL PRIMARY KEY,
    id_anggota INTEGER REFERENCES public.anggota(id_anggota) ON DELETE CASCADE,
    tgl_pinjam DATE DEFAULT CURRENT_DATE,
    tgl_kembali DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU_ACC', 
    -- Status: 'MENUNGGU_ACC', 'DIPINJAM', 'MENUNGGU_KEMBALI', 'DIKEMBALIKAN', 'DITOLAK'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL DETAIL PEMINJAMAN
CREATE TABLE IF NOT EXISTS public.detail_peminjaman (
    id_pinjam INTEGER REFERENCES public.peminjaman(id_pinjam) ON DELETE CASCADE,
    isbn VARCHAR(50) REFERENCES public.buku(isbn) ON UPDATE CASCADE ON DELETE CASCADE,
    qty INTEGER DEFAULT 1,
    PRIMARY KEY (id_pinjam, isbn)
);

-- 11. TABEL PENGEMBALIAN
CREATE TABLE IF NOT EXISTS public.pengembalian (
    id_kembali SERIAL PRIMARY KEY,
    id_pinjam INTEGER REFERENCES public.peminjaman(id_pinjam) ON DELETE CASCADE,
    tgl_kembali DATE DEFAULT CURRENT_DATE,
    denda NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- SEED DATA AWAL (DEFAULT)
-- =========================================================

-- Admin Default (Username: admin | Password: password123)
-- Hash bcrypt untuk password 'password123'
INSERT INTO public.admin (id, username, password, type, is_banned)
VALUES (
    '21232f297a57a5a743894a0e4a801fc3',
    'admin',
    '$2a$10$rCzj0j2P6iUj6dI06F6QreL0vA1tB.gR6uO1W9Ea5w4iG7uO2P4v2',
    'ADM',
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- Anggota Default untuk Admin
INSERT INTO public.anggota (id_anggota, id_admin, nama, sex, telp, alamat, email, descripsi, status_verifikasi)
VALUES (
    1,
    '21232f297a57a5a743894a0e4a801fc3',
    'Administrator Perpustakaan',
    'L',
    '081234567890',
    'UPT Perpustakaan Polinela',
    'admin@polinela.ac.id',
    'Akun Utama Administrator',
    'TERVERIFIKASI'
)
ON CONFLICT (id_anggota) DO NOTHING;

-- Config Default
INSERT INTO public.config (id, maxLamaPinjam, dendaPerHari)
VALUES (1, 3, 500)
ON CONFLICT (id) DO UPDATE SET maxLamaPinjam = 3, dendaPerHari = 500;

-- Master Katalog Default
INSERT INTO public.katalog (id_katalog, nama) VALUES
('KG0', 'Komputer & Pemrograman'),
('KG1', 'Sains & Teknologi'),
('KG2', 'Ekonomi & Bisnis'),
('KG3', 'Pertanian Terapan'),
('KG4', 'Sosial & Humaniora')
ON CONFLICT (id_katalog) DO NOTHING;

-- Master Penerbit Default
INSERT INTO public.penerbit (id_penerbit, nama_penerbit, email, telp, alamat) VALUES
('PN01', 'Informatika Bandung', 'info@informatika.com', '022-7208123', 'Jl. Buah Batu Bandung'),
('PN02', 'Andi Offset Yogyakarta', 'redaksi@andipublisher.com', '0274-561881', 'Jl. Beo 38-40 Yogyakarta'),
('PN03', 'Polinela Press', 'press@polinela.ac.id', '0721-703995', 'Bandar Lampung')
ON CONFLICT (id_penerbit) DO NOTHING;

-- Master Pengarang Default
INSERT INTO public.pengarang (id_pengarang, nama_pengarang, email, telp, alamat) VALUES
('PG01', 'Budi Raharjo', 'budi@raharjo.id', '08123456789', 'Bandung'),
('PG02', 'Abdul Kadir', 'abdul.kadir@gmail.com', '08129876543', 'Yogyakarta'),
('PG03', 'Tim Dosen Polinela', 'dosen@polinela.ac.id', '08210000111', 'Lampung')
ON CONFLICT (id_pengarang) DO NOTHING;

-- Data Buku Default
INSERT INTO public.buku (isbn, judul, tahun, id_penerbit, id_pengarang, id_katalog, qty_stok, foto, maks_pinjam_per_anggota) VALUES
('978-623-01-0812-7', 'Belajar Pemrograman Web Modern & Database', 2024, 'PN01', 'PG01', 'KG0', 12, '/images/buku/1788321818_Gemini_Generated_Image_q4cmfbq4cmfbq4cm1.jpg', 2),
('978-979-29-5321-1', 'Algoritma dan Struktur Data Terapan', 2023, 'PN02', 'PG02', 'KG0', 8, '/images/buku/1788322287_istockphoto-1726263781-612x612.jpg', 1),
('978-602-04-9988-0', 'Sistem Informasi Manajemen Terpadu', 2024, 'PN03', 'PG03', 'KG1', 15, '/images/buku/1788324109_logo.jpg', 2)
ON CONFLICT (isbn) DO NOTHING;

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Supabase secara default membutuhkan akses baca/tulis
-- =========================================================
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.katalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penerbit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengarang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengembalian ENABLE ROW LEVEL SECURITY;

-- Allow public read & write via anon/service_role untuk kemudahan aplikasi
CREATE POLICY "Public Read All Admin" ON public.admin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Anggota" ON public.anggota FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Katalog" ON public.katalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Penerbit" ON public.penerbit FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Pengarang" ON public.pengarang FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Buku" ON public.buku FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Config" ON public.config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Peminjaman" ON public.peminjaman FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Detail Peminjaman" ON public.detail_peminjaman FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read All Pengembalian" ON public.pengembalian FOR ALL USING (true) WITH CHECK (true);

-- STORAGE BUCKETS (Jalankan di Supabase Storage bila diperlukan)
-- Bucket 'library' untuk cover buku dan foto KTM
INSERT INTO storage.buckets (id, name, public) 
VALUES ('library', 'library', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Library Bucket" 
ON storage.objects FOR ALL 
USING (bucket_id = 'library') 
WITH CHECK (bucket_id = 'library');
