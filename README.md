# Perpustakaan Polinela (Web E-Library with Barcode)

Sistem Informasi Perpustakaan Terpadu berbasis **Next.js 16 + Tailwind CSS + Supabase (PostgreSQL & Storage)** yang dirancang untuk UPT Perpustakaan Politeknik Negeri Lampung.

Aplikasi ini siap di-deploy secara gratis di **Vercel** dan **Supabase**.

---

## 🚀 Fitur Unggulan

- 📖 **Katalog Koleksi Buku**: Pencarian instan (Judul, ISBN, Pengarang, Penerbit), filter kategori, dan status ketersediaan stok.
- 🏷️ **Cetak Barcode Label**: Generator barcode CODE128 otomatis untuk setiap ISBN buku fisik dengan format stiker siap cetak.
- 🔄 **Sirkulasi Terpadu**: Pengajuan peminjaman mandiri oleh anggota, persetujuan admin, dan pengembalian dengan kalkulasi denda otomatis.
- 🪪 **Verifikasi Berkas KTM**: Registrasi anggota dengan unggah foto KTM, pratinjau resolusi tinggi, dan persetujuan petugas.
- ⚙️ **Master Data & Konfigurasi**: Manajemen data Pengarang, Penerbit, Kategori/Katalog, batas maksimal hari pinjam, dan tarif denda per hari.
- ⚡ **Cloud Database**: Terintegrasi langsung dengan Supabase PostgreSQL dan fallback mode offline otomatis.

---

## 🛠️ Stack Teknologi

- **Frontend / Fullstack**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL & Storage Buckets)
- **Barcode Engine**: [JsBarcode](https://github.com/lindell/JsBarcode)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hosting**: [Vercel](https://vercel.com/) (Free Serverless Tier)

---

## 📦 Menjalankan di Lokal

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Setup Environment Variables**:
   Salin `.env.example` menjadi `.env.local` dan masukkan kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Akses di browser: [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deploy ke Vercel & Supabase

Untuk panduan lengkap langkah demi langkah, silakan baca file:
👉 **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)**
👉 Skrip database: **[supabase-schema.sql](./supabase-schema.sql)**

---

## 🔑 Akun Demo Bawaan

| Role | Username | Password |
| :--- | :--- | :--- |
| **Petugas Admin** | `admin` | `password123` |
| **Mahasiswa** | `mahasiswa` | `password123` |

*(Tersedia tombol **Demo 1-Klik** di halaman login untuk pengujian cepat)*
