# Panduan Lengkap Deploy Web Perpustakaan ke Supabase & Vercel (Gratis 100%)

Aplikasi Web Perpustakaan Polinela telah dimigrasikan dari PHP Native ke **Next.js (App Router) + Tailwind CSS + Supabase**. Stack modern ini 100% didukung, gratis, dan sangat cepat di-deploy di **Vercel** dan **Supabase**.

---

## Langkah 1: Setup Supabase Database & Storage (Gratis)

1. Buka [https://supabase.com](https://supabase.com) dan login (bisa menggunakan akun GitHub).
2. Klik **New Project**, beri nama (misal: `perpustakaan-polinela`), dan pilih Region terdekat (Singapore).
3. Setelah database siap, buka menu **SQL Editor** di sidebar kiri Supabase.
4. Buka file [`supabase-schema.sql`](file:///c:/laragon/www/web-perpustakaan/supabase-schema.sql) di project ini, **Copy seluruh isinya**, lalu **Paste ke SQL Editor** Supabase dan klik **Run**.
   - *Seluruh tabel (admin, anggota, buku, katalog, penerbit, pengarang, peminjaman, config) dan data default akan otomatis terbuat!*
5. Buka menu **Project Settings** (ikon gear di kiri bawah) -> **API**.
6. Salin dua nilai berikut:
   - **Project URL** (contoh: `https://xyzcompany.supabase.co`)
   - **anon / public key** (kunci panjang berawalan `eyJ...`)

---

## Langkah 2: Setup di Komputer Lokal

1. Buka file `.env.local` pada project ini:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
3. Buka browser di [http://localhost:3000](http://localhost:3000).
   - Aplikasi akan otomatis mendeteksi Supabase dan status navbar akan berubah menjadi **"Supabase Connected"** (warna hijau berkedip).

---

## Langkah 3: Deploy ke Vercel (Gratis 1-Klik)

1. Pastikan project sudah di-commit ke Git & GitHub Anda:
   ```bash
   git add .
   git commit -m "Migrasi Web Perpustakaan ke Next.js & Supabase"
   git push origin main
   ```
2. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub.
3. Klik **Add New...** -> **Project**.
4. Pilih repository `website-perpuswithbarcode` (atau nama repo Anda) lalu klik **Import**.
5. Pada bagian **Environment Variables**, tambahkan 2 variabel:
   - `NEXT_PUBLIC_SUPABASE_URL` = (URL Supabase Anda)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Anon Key Supabase Anda)
6. Klik **Deploy**!
7. Dalam 1–2 menit, web perpustakaan Anda akan aktif dengan domain gratis `https://nama-project.vercel.app`!

---

## Akun Default untuk Login:
- **Akun Admin / Petugas**:
  - Username: `admin`
  - Password: `password123`
- **Akun Mahasiswa**:
  - Username: `mahasiswa`
  - Password: `password123`
*(Tersedia juga tombol **Demo 1-Klik** di halaman login untuk pengujian cepat)*

---

## Catatan File Lama:
Seluruh file PHP asli Anda (`accSirkulasi.php`, `koneksi.php`, dll) tersimpan aman 100% tanpa dihapus di dalam folder [`legacy_php/`](file:///c:/laragon/www/web-perpustakaan/legacy_php). Anda tetap bisa membukanya sewaktu-waktu di Laragon jika diperlukan.
