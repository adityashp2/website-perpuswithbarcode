# PRD — **PustakaScan**
### Website Perpustakaan Profesional dengan Mode Sirkulasi ala Kasir Indomaret/Alfamart

| | |
|---|---|
| **Versi dokumen** | 1.0 (Final Draft) |
| **Status** | Ready for Review → Build |
| **Product Owner** | _(isi)_ |
| **Tech Lead** | _(isi)_ |
| **Stakeholder** | Kepala Perpustakaan, Kepala Sekolah/Institusi, IT Support |
| **Terakhir diperbarui** | _(isi tanggal)_ |

---

## Daftar Isi

0. [Build vs Buy](#0-build-vs-buy--baca-dulu-sebelum-lanjut)
1. [Latar Belakang & Tujuan](#1-latar-belakang--tujuan)
2. [Persona & Role](#2-persona--role)
3. [Alur Inti — Mode Kasir](#3-alur-inti--mode-kasir)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Spesifikasi Hardware & Barcode](#6-spesifikasi-hardware--barcode)
7. [Arsitektur & Tech Stack](#7-arsitektur--tech-stack)
8. [Data Model](#8-data-model-lengkap)
9. [UI/UX — Layar Mode Kasir](#9-uiux--layar-mode-kasir)
10. [Risiko & Mitigasi](#10-risiko--mitigasi)
11. [Roadmap & Estimasi](#11-roadmap--estimasi)
12. [Business Rules Engine](#12-business-rules-engine)
13. [State Machine](#13-state-machine)
14. [Spesifikasi API](#14-spesifikasi-api-internal)
15. [Strategi Offline & Sinkronisasi](#15-strategi-offline--sinkronisasi)
16. [Implementasi Scanner (Keyboard Wedge)](#16-implementasi-scanner-keyboard-wedge)
17. [Spesifikasi Cetak Label & Slip](#17-spesifikasi-cetak-label--slip)
18. [Keamanan, Privasi & Audit](#18-keamanan-privasi--audit)
19. [Migrasi Data & Go-Live](#19-migrasi-data--go-live)
20. [Strategi QA & Test Plan](#20-strategi-qa--test-plan)
21. [Analytics & Instrumentasi](#21-analytics--instrumentasi)
22. [Out of Scope](#22-out-of-scope-v1)
23. [Open Questions](#23-open-questions)
24. [Glosarium](#24-glosarium)
25. [Lampiran](#25-lampiran)

---

## 0. Build vs Buy — baca dulu sebelum lanjut

Sebelum bangun dari nol, jujur: kalau butuh cepat dan koleksi < 10.000 buku, **Libib** atau **ResourceMate** sudah punya cataloging + barcode scanning + circulation jadi, dan Libib cloud-based dengan scan langsung dari browser. Alternatif open source: **Koha** (SLiMS untuk konteks Indonesia) — gratis, matang, sudah dipakai ribuan perpustakaan.

**Bangun sendiri masuk akal kalau:**
- Butuh branding/kontrol penuh atas UX (khususnya mode kasir yang tidak ada di produk existing).
- Integrasi ke sistem internal (SIAKAD, keuangan, SSO institusi).
- Alur bisnis tidak standar (mis. denda dipotong dari deposit, multi-cabang perpustakaan).
- Data tidak boleh keluar dari server institusi.

**Jangan bangun sendiri kalau:** tidak ada budget maintenance ≥ 2 tahun, atau tidak ada 1 orang yang ditunjuk sebagai pemilik sistem setelah go-live.

PRD ini ditulis dengan asumsi **build sendiri**.

---

## 1. Latar Belakang & Tujuan

**Masalah:** Proses pinjam-kembali perpustakaan masih manual (tulis di buku besar / Excel), antrean lambat, salah catat, stok buku tidak akurat, denda tidak tertagih, dan tidak ada data untuk pengambilan keputusan pengadaan koleksi.

**Tujuan:** Bikin alur sirkulasi secepat kasir minimarket — petugas tinggal *scan → scan → enter*, sistem urus sisanya.

**Non-goal:** Ini bukan sistem akuntansi, bukan LMS, bukan repository digital (e-book/PDF fulltext) di v1.

### Success metrics

| Metrik | Baseline (manual) | Target v1 | Cara ukur |
|---|---|---|---|
| Waktu transaksi pinjam (1 anggota, 3 buku) | ~90 detik | ≤ 15 detik | Timestamp `loan.created_at` − `session.member_scanned_at` |
| Akurasi stok opname | ~85% | ≥ 99% | (item ditemukan / item terdaftar) × 100 |
| Antrean rata-rata saat jam sibuk | 8 menit | ≤ 2 menit | Observasi manual minggu 1 & minggu 8 |
| Adopsi mode scan vs manual | 0% | ≥ 90% transaksi | Kolom `loans.input_method` (scan / manual) |
| Denda tertagih | tidak terdata | ≥ 70% dari denda terhitung | `SUM(fines.paid) / SUM(fines.amount)` |
| Error rate transaksi (dibatalkan/dikoreksi) | — | ≤ 2% | Audit log `action = 'loan.void'` |

**Definisi sukses proyek:** setelah 8 minggu go-live, ≥ 90% transaksi lewat mode scan **dan** petugas tidak lagi memegang buku besar.

---

## 2. Persona & Role

| Role | Kebutuhan utama | Hak akses (ringkas) |
|---|---|---|
| **Petugas Sirkulasi** | Scan cepat, layar besar, minim klik | Mode kasir, cari anggota/buku, terima pembayaran denda |
| **Pustakawan/Kataloger** | Input buku baru via scan ISBN, cetak label | Katalogisasi, eksemplar, label, opname |
| **Kepala Perpustakaan** | Laporan, konfigurasi aturan pinjam | Semua di atas + laporan + bebaskan denda + setting |
| **Admin Sistem** | User management, backup, konfigurasi | Full access + user management + audit log |
| **Anggota** | Cek katalog, status pinjam, riwayat | OPAC publik + login anggota (P1) |

### Matriks RBAC (P0)

| Modul | Petugas | Kataloger | Kepala | Admin |
|---|:--:|:--:|:--:|:--:|
| Mode Kasir (pinjam/kembali) | ✅ | ✅ | ✅ | ✅ |
| Terima pembayaran denda | ✅ | ❌ | ✅ | ✅ |
| Bebaskan/hapus denda | ❌ | ❌ | ✅ | ✅ |
| Katalogisasi & eksemplar | ❌ | ✅ | ✅ | ✅ |
| Cetak label & kartu | ✅ | ✅ | ✅ | ✅ |
| CRUD anggota | ✅* | ✅ | ✅ | ✅ |
| Hapus anggota | ❌ | ❌ | ✅ | ✅ |
| Stock opname | ❌ | ✅ | ✅ | ✅ |
| Laporan | ❌ | ❌ | ✅ | ✅ |
| Setting aturan pinjam | ❌ | ❌ | ✅ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ |
| Audit log | ❌ | ❌ | read | ✅ |

`*` Petugas hanya boleh create + edit kontak, tidak boleh ubah tipe/status keanggotaan.

---

## 3. Alur Inti — "Mode Kasir"

Ini bagian paling penting. Tiru persis ritme Indomaret:

```
1. Petugas buka Mode Kasir (fokus otomatis ke input scan)
2. Scan KARTU ANGGOTA  → panel identitas muncul (nama, foto, sisa kuota, ada denda?)
3. Scan BARCODE BUKU   → item masuk keranjang, bunyi "beep", counter naik
   (scan buku ke-2, ke-3... tanpa klik apa pun)
4. Tekan Enter / klik "SELESAI" → sistem proses
5. Cetak slip bukti pinjam (atau kirim ke WA/email)
6. Reset form, siap anggota berikutnya
```

### 3.1 Aturan krusial

- **Scan berulang = tambah, bukan replace.** Buffer scan harus reset per 500 ms (lihat §16).
- **Error harus keras.** Buku tidak bisa dipinjam → layar merah + bunyi beda (bukan cuma toast kecil).
- **Tanpa mouse.** Seluruh alur harus bisa diselesaikan pakai scanner + keyboard saja.
- **Satu input, dua makna.** Sistem membedakan kartu anggota vs barcode buku dari **prefix/panjang string**, bukan dari mode yang dipilih petugas (lihat §6.3).
- **Tidak ada dialog konfirmasi** di jalur sukses. Konfirmasi hanya muncul saat ada uang (bayar denda) atau tindakan destruktif.

### 3.2 Alur alternatif & edge case

| Skenario | Perilaku sistem |
|---|---|
| Scan buku sebelum scan anggota (mode Pinjam) | Layar kuning: "Scan kartu anggota dulu". Buku **tidak** masuk keranjang. |
| Scan kartu anggota ke-2 saat keranjang terisi | Prompt: "Ganti anggota? Keranjang (3 item) akan dibuang." `Y`/`Esc`. |
| Scan buku yang sama 2× | Beep panjang + baris merah "Sudah di keranjang". Counter tidak naik. |
| Scan barcode tidak dikenali | Beep panjang + "Barcode tidak terdaftar: `<kode>`" + tombol `F3` cari manual. |
| Anggota punya denda ≥ ambang batas | Panel identitas merah, tombol SELESAI **disabled** sampai denda dibayar/dibebaskan. |
| Anggota kadaluarsa | Tolak transaksi pinjam. Transaksi **kembali** tetap diizinkan. |
| Buku berstatus `reference` / `lost` / `damaged` | Tolak masuk keranjang, tampilkan alasan spesifik. |
| Buku sedang dipinjam anggota lain lalu di-scan di mode Pinjam | Tolak + info "Sedang dipinjam sampai `<tanggal>`". Tawarkan `F4` untuk proses sebagai pengembalian. |
| Mode Kembali: scan buku yang tidak sedang dipinjam | Beep panjang + "Buku ini tidak tercatat sedang dipinjam". |
| Mode Kembali: buku milik anggota lain | Tetap diterima (buku boleh dikembalikan siapa saja), denda dibebankan ke peminjam asli. |
| Koneksi putus di tengah transaksi | Transaksi masuk queue lokal, slip tetap tercetak dengan tanda "OFFLINE — akan tersinkron". |
| Petugas salah proses, ingin batal | `Ctrl+Z` dalam ≤ 5 menit → void transaksi, wajib isi alasan, tercatat di audit log. |

### 3.3 Keyboard shortcut (wajib)

| Tombol | Aksi |
|---|---|
| `F1` | Mode Pinjam |
| `F2` | Mode Kembali |
| `F3` | Cari manual (judul/nama anggota) |
| `F4` | Perpanjang (renew) |
| `F5` | Bayar denda |
| `Enter` | Selesaikan transaksi |
| `Delete` | Hapus item terakhir dari keranjang |
| `Esc` | Reset form (konfirmasi jika keranjang terisi) |
| `Ctrl+Z` | Void transaksi terakhir |
| `Ctrl+P` | Cetak ulang slip terakhir |

---

## 4. Functional Requirements

Prioritas: **P0** = wajib MVP, **P1** = fase 2, **P2** = nice to have.

### F1 — Autentikasi & Role (P0)

Login username/password, session-based, RBAC sesuai matriks §2.

**Detail:**
- Password policy: min 8 karakter, wajib angka + huruf. Hash argon2id (fallback bcrypt cost 12).
- Session timeout 30 menit idle; **kecuali** di halaman Mode Kasir (aktivitas scan dihitung sebagai aktivitas).
- Rate limit login: 5 percobaan gagal / 15 menit / IP → lockout 15 menit.
- Mode "shift lock": petugas bisa kunci layar cepat (`Ctrl+L`) tanpa logout, buka dengan PIN 6 digit.

**AC:**
- Petugas tidak bisa akses halaman laporan keuangan (HTTP 403, bukan halaman kosong).
- Session timeout 30 menit idle → redirect ke login, keranjang aktif tersimpan sebagai draft.
- Percobaan login ke-6 dalam 15 menit ditolak walau password benar.

---

### F2 — Katalogisasi via Scan ISBN (P0)

Scan ISBN-13 di belakang buku → sistem **auto-fetch metadata** dari Open Library / Google Books API (judul, penulis, penerbit, tahun, cover) → petugas tinggal verifikasi & simpan.

**Detail:**
- Urutan sumber: cache lokal → Open Library → Google Books → form manual.
- Validasi checksum ISBN-10/ISBN-13 di sisi klien sebelum request API.
- Hasil fetch disimpan ke tabel `isbn_cache` (TTL 90 hari) agar tidak boros kuota API.
- Cover diunduh ke storage sendiri, bukan hotlink (sumber eksternal bisa mati).
- Field bibliografi: ISBN, judul, sub-judul, penulis (multi), penerbit, tahun, edisi, bahasa, jumlah halaman, klasifikasi DDC, subjek/tag (multi), sinopsis, cover.
- Field **wajib minimum** (fast-track buku lokal tanpa ISBN): judul, penulis, tahun, klasifikasi, jumlah eksemplar.

**AC:**
- ISBN valid → form terisi otomatis dalam ≤ 3 detik.
- ISBN tidak ditemukan → fallback ke form manual, tidak boleh crash, tidak boleh loading selamanya (timeout 5 detik).
- ISBN duplikat → sistem tanya: "Tambah eksemplar baru?" bukan bikin record ganda.
- API eksternal down → banner peringatan, katalogisasi manual tetap jalan.

> **Konsep wajib dipahami:** barcode menempel di **EKSEMPLAR (copy fisik)**, bukan di judul. 5 buku identik = 5 barcode unik, 1 record bibliografi.

---

### F3 — Manajemen Eksemplar & Cetak Label (P0)

- Generate barcode unik per eksemplar, format **Code 128** (default) atau EAN-13.
- Pola nomor eksemplar dapat dikonfigurasi, default: `PS-{YY}{5 digit sekuensial}` → `PS-2600001`.
- Print batch label ke kertas stiker A4 (grid 3×8), ukuran siap tempel di cover dalam.
- Cetak kartu anggota dengan barcode/nomor anggota.
- Atribut eksemplar: barcode, bibliografi, lokasi rak, kondisi (Baik/Rusak Ringan/Rusak Berat), status, tanggal masuk, sumber perolehan (Beli/Hibah/Sumbangan), harga perolehan.
- Reprint label individual untuk barcode yang rusak — **barcode lama tetap valid**, jangan generate ulang nomor.

**AC:**
- Print 50 label sekaligus dalam 1 kali klik, hasil cetak terukur (skala mm, bukan px).
- Barcode hasil cetak terbaca oleh scanner pada jarak 5–20 cm, sekali coba.
- Menghapus bibliografi yang masih punya eksemplar aktif → ditolak.

---

### F4 — Keanggotaan (P0)

CRUD anggota. Field: nomor anggota (jadi barcode kartu), nama, NIK/NIS/NIM, kontak (HP/email), tipe (Siswa/Guru/Umum), tanggal daftar, tanggal kadaluarsa, status (Aktif/Blokir/Kadaluarsa), foto.

**Detail:**
- Nomor anggota auto-generate dengan pola konfigurabel, default `{YYYY}-{4 digit}` → `2026-0184`.
- Import massal via CSV/Excel dengan preview + validasi duplikat sebelum commit.
- Perpanjangan keanggotaan massal per angkatan/kelas.
- Blokir otomatis opsional: denda > ambang batas atau keterlambatan > X hari.
- Foto anggota: upload atau ambil dari webcam, auto-resize ke 400×400 px.

**AC:**
- Kartu kadaluarsa → transaksi pinjam ditolak dengan pesan jelas menyebut tanggal kadaluarsa.
- Nomor anggota duplikat → ditolak di level database (unique index), bukan hanya di form.
- Anggota yang masih punya pinjaman aktif tidak bisa dihapus, hanya bisa di-nonaktifkan.

---

### F5 — Sirkulasi Mode Kasir (P0) ⭐

**Pinjam:**
- Validasi berlapis saat scan anggota: status aktif? denda belum lunas? kuota pinjam tersisa? ada buku telat yang belum dikembalikan?
- Validasi saat scan buku: tersedia? bukan referensi/hanya-baca? sudah dipinjam anggota ini? sedang direservasi orang lain?
- Aturan per tipe anggota: kuota, durasi, max perpanjangan (lihat §12).
- Hitung due date dengan melewati hari libur (kalender libur dikonfigurasi di setting).

**Kembali:**
- Scan barcode buku → sistem hitung otomatis: on-time / telat berapa hari / denda berapa.
- Tampilkan denda + tombol "Bayar" atau "Bebaskan Denda" (khusus kepala perpus, tercatat di audit log).
- Tandai kondisi saat kembali: Baik / Rusak / Hilang → memicu denda kerusakan.
- Tentukan otomatis buku masuk ke antrean reservasi berikutnya (bukan kembali ke rak).

**Perpanjang (renew):**
- Ditolak jika: sudah mencapai max perpanjangan, sedang telat, atau ada reservasi antre.
- Due date baru dihitung dari **tanggal perpanjangan**, bukan dari due date lama.

**AC:**
- Scan 3 buku berturut-turut tanpa klik → 3 item masuk keranjang.
- Scan buku yang sama 2× dalam 1 transaksi → ditolak dengan suara peringatan.
- Kembali buku telat 5 hari, denda Rp500/hari → sistem tampilkan Rp2.500 otomatis.
- Transaksi 3 buku tersimpan atomik: kalau buku ke-3 gagal, buku 1 & 2 **tidak** ikut tersimpan.
- Mode kasir tetap responsif saat database berisi 100.000 eksemplar & 10.000 anggota.

---

### F6 — Denda & Pembayaran (P0)

Perhitungan otomatis: `denda = hari_telat × tarif_per_hari`, plus opsi denda kerusakan/hilang (nominal manual + catatan).

**Detail:**
- Hari telat dihitung dalam hari kalender, kecuali setting "kecualikan hari libur" diaktifkan.
- Ada grace period konfigurabel (default 0 hari).
- Ada plafon denda maksimal per pinjaman (default: harga perolehan buku).
- Denda hilang = harga perolehan × faktor pengganti (default 1.0) + biaya administrasi.
- Pembayaran: tunai, transfer (manual konfirmasi), atau potong deposit. Pembayaran **sebagian** diperbolehkan.
- Riwayat pembayaran tersimpan, bisa dicetak kuitansi bernomor urut.
- Pembebasan denda wajib alasan (dropdown + catatan), tercatat lengkap di audit log.

**AC:**
- Kuitansi punya nomor unik berurutan, tidak pernah berulang walau ada void.
- Void pembayaran hanya bisa oleh Kepala/Admin di hari yang sama, wajib alasan.
- Total denda per anggota di panel kasir selalu sama dengan `SUM(fines WHERE paid_at IS NULL)`.

---

### F7 — Reservasi / Booking (P1)

Anggota booking buku yang sedang dipinjam via OPAC. Saat buku dikembalikan → sistem notifikasi "buku tersedia, ambil dalam 2×24 jam".

**Detail:**
- Antrean FIFO per bibliografi, bukan per eksemplar.
- Reservasi hangus otomatis setelah masa ambil habis → lanjut ke antrean berikutnya.
- Max reservasi aktif per anggota: konfigurabel (default 2).
- Notifikasi via WhatsApp/email + tampil di dashboard anggota.

**AC:** Buku dikembalikan → eksemplar berstatus `on_hold`, tidak bisa dipinjam anggota lain selama masa ambil.

---

### F8 — Stock Opname / Batch Scan (P1)

Sesi opname: petugas keliling rak sambil scan semua buku. Sistem tandai: **ditemukan**, **hilang**, **salah rak**, **tidak terdaftar**.

**Detail:**
- Sesi opname bisa di-pause dan dilanjutkan lintas hari.
- Bisa dibatasi per rentang lokasi rak (opname parsial).
- Scan bekerja penuh offline (data eksemplar di-cache lokal saat sesi dimulai).
- Akhir sesi: rekonsiliasi — petugas bisa tandai item hilang jadi status `lost`, atau abaikan.

**AC:** Scan 1.000 buku dalam satu sesi tanpa lag (≤ 150 ms per scan). Hasil ekspor ke Excel.

---

### F9 — Laporan & Dashboard (P1)

Statistik harian/bulanan: jumlah pinjam, kembali, telat, buku terpopuler, anggota teraktif, denda terkumpul, buku tidak pernah dipinjam (dead stock), rasio eksemplar per judul.

**Detail:**
- Filter periode, tipe anggota, klasifikasi DDC, lokasi rak.
- Laporan wajib: Rekap Sirkulasi Bulanan, Rekap Denda, Daftar Keterlambatan Aktif, Statistik Koleksi, Dead Stock.
- Ekspor PDF (siap tanda tangan kepala) dan Excel (mentah untuk diolah).
- Dashboard beranda: 6 kartu angka + grafik tren 30 hari + daftar telat hari ini.

**AC:** Laporan bulanan untuk 2.000 transaksi selesai render ≤ 3 detik.

---

### F10 — OPAC (Katalog Publik) (P0)

Pencarian publik (judul/penulis/ISBN/subjek), tampilkan ketersediaan real-time, detail buku, dan status "sedang dipinjam, kembali ± tanggal X".

**Detail:**
- Pencarian full-text dengan toleransi typo ringan; filter: klasifikasi, tahun, bahasa, ketersediaan.
- Halaman detail: cover, metadata, sinopsis, daftar eksemplar + status + lokasi rak.
- Tanpa login untuk pencarian. Login anggota (P1) untuk: status pinjaman saya, riwayat, reservasi, cek denda.
- Mobile-first — ini satu-satunya modul yang diakses dari HP.
- SEO: server-side rendering, metadata OpenGraph per buku.

**AC:**
- Hasil pencarian tampil ≤ 1 detik untuk 50.000 judul.
- Status ketersediaan tidak boleh basi > 60 detik.
- OPAC tetap online walau modul sirkulasi sedang maintenance (read-only dari replika/cache).

---

### F11 — Notifikasi (P1)

| Pemicu | Kanal | Waktu |
|---|---|---|
| H-2 jatuh tempo | WA/email | 08.00 |
| Hari-H jatuh tempo | WA/email | 08.00 |
| Telat H+1, H+7, H+30 | WA/email | 08.00 |
| Buku reservasi tersedia | WA/email | real-time |
| Keanggotaan akan kadaluarsa (H-30) | email | 08.00 |

**AC:** Gagal kirim tidak boleh menggagalkan transaksi; masuk retry queue max 3×.

---

### F12 — Pengaturan Sistem (P0)

Satu halaman untuk: identitas perpustakaan (nama, logo, alamat — dipakai di slip & laporan), aturan pinjam per tipe anggota, tarif denda, kalender hari libur, jam operasional, pola penomoran, konfigurasi label, integrasi API keys.

**AC:** Perubahan aturan pinjam **tidak** mengubah pinjaman yang sedang berjalan (aturan disalin ke record `loans` saat transaksi dibuat).

---

## 5. Non-Functional Requirements

| Aspek | Target |
|---|---|
| Latensi respon scan | ≤ 150 ms dari barcode terbaca ke UI update |
| Latensi simpan transaksi | ≤ 500 ms (p95) online |
| Throughput | 2.000+ transaksi scan/hari, 20 transaksi/menit saat puncak |
| Kapasitas data | 200.000 eksemplar, 20.000 anggota, 1 juta record pinjaman |
| Mode offline | Queue lokal (IndexedDB) saat internet putus, auto-sync saat online |
| Uptime | ≥ 99% jam operasional |
| Responsif | Prioritas tablet 10" landscape & desktop; mobile untuk OPAC |
| Aksesibilitas | Kontras ≥ 4.5:1, font mode kasir ≥ 18 px, seluruh alur keyboard-only |
| Keamanan | HTTPS wajib, password hashing (argon2id), audit log semua transaksi, CSRF protection |
| Backup | Auto-daily, retensi 30 hari, uji restore setiap kuartal |
| Browser | Chrome/Edge/Safari 2 versi terakhir |
| Lokalisasi | Bahasa Indonesia, format tanggal `dd-mm-yyyy`, mata uang `Rp` tanpa desimal, timezone WIB |
| Observability | Error tracking (Sentry), log terstruktur, health check endpoint |

**Catatan offline itu bukan opsional.** Listrik/WiFi di perpustakaan sekolah sering mati. Kalau sistem mati total, petugas balik ke buku tulis — dan itu mematikan proyek.

**Batas offline yang jujur:** mode offline mendukung **pinjam** dan **kembali** menggunakan data cache. Yang **tidak** jalan offline: reservasi, pembayaran denda, katalogisasi via API ISBN, laporan. Ini harus dikomunikasikan ke petugas sejak training.

---

## 6. Spesifikasi Hardware & Barcode

### 6.1 Scanner

**Rekomendasi utama: USB HID Keyboard-Wedge.**
Ini yang dipakai kasir Indomaret/Alfamart. Scanner "mengetik" barcode + Enter ke input yang sedang fokus. Artinya:
- **Tidak butuh SDK sama sekali** untuk hardware ini.
- Implementasi cuma butuh global keydown listener dengan buffer + timing threshold (~50 ms antar karakter).
- Paling murah (Rp300–600rb), paling reliable, tidak butuh driver.

Ini pilihan default. Jangan over-engineer.

**Checklist pembelian scanner:**
- Mode: USB HID Keyboard Wedge (bukan USB-COM/serial).
- Suffix: dapat dikonfigurasi ke `Enter` (CR).
- Dukungan simbologi: EAN-13, Code 128, Code 39, QR (jika pakai kartu QR).
- Tipe: 1D laser cukup dan lebih murah; 2D imager kalau butuh QR atau barcode di layar HP.
- Stand/auto-sense: sangat membantu untuk alur "lempar-scan" ala kasir.

### 6.2 Perangkat lain

| Perangkat | Spesifikasi minimum | Catatan |
|---|---|---|
| Komputer kasir | Dual-core, RAM 4 GB, browser modern | Tablet 10" landscape juga cukup |
| Printer slip | Thermal 58 mm atau 80 mm (ESC/POS) | Atau printer biasa + A5 |
| Printer label | Laser/inkjet biasa | Untuk stiker A4 3×8 |
| Printer kartu | Opsional — inkjet + PVC card | Alternatif: kertas laminating |
| UPS | 600 VA | Minimal untuk PC kasir + router |
| Webcam | 720p | Untuk foto anggota |

### 6.3 Format barcode & pembedaan jenis

| Format | Dipakai untuk | Pola |
|---|---|---|
| EAN-13 | ISBN buku (sudah tercetak dari penerbit) | 13 digit, prefix `978`/`979` |
| Code 128 | Barcode internal eksemplar | `PS-` + 7 digit |
| Code 128 | Nomor anggota | `AG-` + 8 digit |
| QR Code | Opsional — kartu anggota digital | URL/payload bertanda tangan |

**Aturan disambiguasi input (penting):**
1. Diawali `AG-` → kartu anggota.
2. Diawali `PS-` → eksemplar.
3. 13 digit diawali `978`/`979` → ISBN (di mode kasir: cari eksemplar tersedia dari bibliografi ini; kalau > 1, minta petugas pilih).
4. Selain itu → cari di `copies.barcode`, lalu `members.member_no`, lalu tolak.

Prefix membuat sistem tidak pernah salah menebak — ini yang bikin "satu input, dua makna" aman.

### 6.4 Scanner kamera (fallback, P2)

Untuk petugas yang cuma punya HP/tablet.
- **QuaggaJS / ZXing** — gratis, tapi perlu perhatian ke dukungan perangkat dan kondisi cahaya, dan kurang ideal untuk produksi karena tidak ada dukungan resmi.
- **Dynamsoft Barcode Reader SDK** atau **Scandit** — komersial, andal, mendukung ISBN/EAN-13/Code 128/QR dan kamera web.

Butuh HTTPS untuk akses kamera. Jangan jadikan ini jalur utama.

---

## 7. Arsitektur & Tech Stack

**Rekomendasi:**
```
Frontend : Next.js (React) + Tailwind + shadcn/ui
Backend  : Next.js API routes / NestJS
Database : PostgreSQL + Prisma ORM
Cache    : Redis (session, queue scan)
Storage  : S3-compatible (cover buku, foto anggota)
Deploy   : Vercel / VPS + Docker
Print    : react-to-print + CSS @page untuk label
Offline  : IndexedDB (Dexie.js) + Service Worker
Barcode  : bwip-js (generate) — client-side, tanpa server render
```
Alternatif: **Laravel 11 + MySQL + Livewire/Inertia** kalau tim lebih familiar PHP. Alur kasir sepenuhnya bisa dibangun di Livewire + Alpine.js; offline queue tetap pakai IndexedDB.

**Integrasi eksternal:** Open Library API, Google Books API (metadata ISBN), WhatsApp Business API / SMTP (notifikasi).

### 7.1 Diagram komponen

```
┌───────────────────────────────────────────────────────┐
│  Browser Kasir (tablet/PC)                            │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Scan Engine│→ │ Cart State   │→ │ Sync Manager  │  │
│  │ (keydown)  │  │ (Zustand)    │  │ (IndexedDB)   │  │
│  └────────────┘  └──────────────┘  └───────┬───────┘  │
│  Service Worker · cache anggota + eksemplar│          │
└────────────────────────────────────────────┼──────────┘
                                             │ HTTPS
┌────────────────────────────────────────────▼──────────┐
│  API Layer  — auth · rules engine · idempotency        │
├────────────┬──────────────┬───────────────┬────────────┤
│ PostgreSQL │    Redis     │  S3 Storage   │ Job Queue  │
│  (utama)   │(session,cache)│(cover, foto) │(notif,sync)│
└────────────┴──────────────┴───────────────┴────────────┘
        │
        ▼ nightly
  Backup terenkripsi (off-site)
```

### 7.2 Keputusan arsitektur kunci

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Sumber kebenaran transaksi | Server | Offline hanya buffer, bukan sumber kebenaran |
| Anti-double-submit | Idempotency key per transaksi (UUID dari klien) | Sync ulang tidak bikin pinjaman ganda |
| Penomoran | Sequence DB, bukan `COUNT()+1` | Aman dari race condition |
| Aturan pinjam | Disalin ke record loan saat dibuat | Ubah setting tidak merusak histori |
| Soft delete | Semua tabel transaksional | Audit & recovery |
| Timezone | Simpan UTC, tampilkan WIB | Konsisten lintas server |

---

## 8. Data Model (lengkap)

```
users            (id, username*, password_hash, name, role, is_active,
                  last_login_at, created_at, deleted_at)
members          (id, member_no*, name, id_number, type_id →, email, phone,
                  photo_url, address, join_date, expiry_date, status,
                  deposit_balance, notes, created_at, deleted_at)
member_types     (id, name, loan_quota, loan_days, max_renewals,
                  fine_per_day, can_reserve, grace_days)
bibliographies   (id, isbn, title, subtitle, authors[], publisher, year,
                  edition, language, pages, ddc, subjects[], synopsis,
                  cover_url, created_by →, created_at, deleted_at)
copies           (id, barcode*, bibliography_id →, status, location,
                  condition, acquisition_source, acquisition_price,
                  acquired_at, is_reference, created_at, deleted_at)
loans            (id, copy_id →, member_id →, loan_date, due_date,
                  return_date, status, renewal_count, applied_rules_json,
                  input_method, processed_by →, returned_to →,
                  idempotency_key*, created_at)
fines            (id, loan_id →, member_id →, type, amount, paid_amount,
                  reason, paid_at, waived_by →, waive_reason,
                  receipt_no*, created_at)
payments         (id, member_id →, amount, method, receipt_no*,
                  received_by →, voided_at, void_reason, created_at)
reservations     (id, bibliography_id →, member_id →, queue_pos, status,
                  fulfilled_copy_id →, expires_at, created_at)
opname_sessions  (id, name, scope_location, started_by →, started_at,
                  finished_at, status)
opname_items     (id, session_id →, copy_id →, barcode_raw, result,
                  expected_location, found_at)
holidays         (id, date*, description)
settings         (key*, value_json, updated_by →, updated_at)
isbn_cache       (isbn*, payload_json, fetched_at)
audit_logs       (id, user_id →, action, entity, entity_id,
                  payload_json, ip, user_agent, created_at)
notifications    (id, member_id →, channel, template, payload_json,
                  status, attempts, sent_at, created_at)
```
`*` = unique index. Ini yang bikin scan tidak bisa double-entry.

### 8.1 Index wajib (performa mode kasir)

```sql
CREATE UNIQUE INDEX idx_copies_barcode      ON copies(barcode) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_members_no          ON members(member_no) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_loans_idempotency   ON loans(idempotency_key);
CREATE INDEX idx_loans_active               ON loans(copy_id) WHERE return_date IS NULL;
CREATE INDEX idx_loans_member_active        ON loans(member_id) WHERE return_date IS NULL;
CREATE INDEX idx_loans_due                  ON loans(due_date) WHERE return_date IS NULL;
CREATE INDEX idx_fines_unpaid               ON fines(member_id) WHERE paid_at IS NULL;
CREATE INDEX idx_biblio_search              ON bibliographies USING GIN(to_tsvector('indonesian', title || ' ' || COALESCE(synopsis,'')));
CREATE INDEX idx_copies_biblio_status       ON copies(bibliography_id, status);
```

### 8.2 Constraint kritis

```sql
-- Satu eksemplar tidak boleh punya 2 pinjaman aktif
CREATE UNIQUE INDEX idx_one_active_loan_per_copy
  ON loans(copy_id) WHERE return_date IS NULL;

-- Denda tidak boleh negatif, bayar tidak boleh melebihi tagihan
ALTER TABLE fines ADD CONSTRAINT chk_fine_amount CHECK (amount >= 0);
ALTER TABLE fines ADD CONSTRAINT chk_paid_lte    CHECK (paid_amount <= amount);

-- Due date harus setelah loan date
ALTER TABLE loans ADD CONSTRAINT chk_due_after_loan CHECK (due_date > loan_date);
```

Index unik `idx_one_active_loan_per_copy` adalah pengaman terakhir terhadap double-borrow — validasi aplikasi bisa bocor saat race condition, database tidak.

---

## 9. UI/UX — Layar Mode Kasir

Layout 3 kolom, kontras tinggi, font besar:

```
┌────────────────┬──────────────────────┬─────────────────┐
│  ANGGOTA       │   KERANJANG SCAN     │  STATUS         │
│  ──────────┐   │   1. Bumi Manusia  ✓ │  Kuota: 2/3     │
│  │  FOTO    │  │   2. Laskar Pelangi✓ │  Denda: Rp0     │
│  └──────────┘  │   3. ___________     │  ⏰ Jatuh tempo │
│  Ahmad, 2024-1 │                      │     14 Feb      │
│  Siswa • Aktif │   [ SELESAI ]        │                 │
└────────────────┴──────────────────────┴─────────────────┘
```

**Prinsip:**
- Kolom scan **selalu fokus**, ada indikator "🔴 SIAP SCAN".
- Sukses = hijau + beep pendek. Gagal = merah + beep panjang + teks besar alasannya.
- Tombol minimal. Keyboard shortcut sesuai §3.3.

### 9.1 Spesifikasi visual

| Elemen | Spesifikasi |
|---|---|
| Font body mode kasir | ≥ 18 px |
| Nama anggota | 32 px bold |
| Judul buku di keranjang | 20 px |
| Counter item | 48 px |
| Warna sukses | `#16a34a` — border 4 px + flash 300 ms |
| Warna gagal | `#dc2626` — full-screen overlay 800 ms |
| Warna peringatan | `#f59e0b` |
| Tinggi baris keranjang | ≥ 56 px (mudah dibaca dari jarak berdiri) |
| Indikator koneksi | Badge tetap di pojok: 🟢 Online / 🟡 Offline (n antre) |

### 9.2 Feedback audio

| Kejadian | Suara | Durasi |
|---|---|---|
| Item berhasil masuk | Beep tinggi | 80 ms |
| Anggota berhasil di-scan | Dua beep pendek | 2×60 ms |
| Error | Beep rendah panjang | 500 ms |
| Transaksi selesai | Nada naik 3 tingkat | 400 ms |

Audio harus bisa dimatikan (setting lokal) dan **tidak boleh** jadi satu-satunya penanda — selalu berpasangan dengan visual.

### 9.3 Daftar halaman

| # | Halaman | Prioritas |
|---|---|---|
| 1 | Login | P0 |
| 2 | Dashboard | P1 |
| 3 | **Mode Kasir — Pinjam** | P0 |
| 4 | **Mode Kasir — Kembali** | P0 |
| 5 | Cari Manual (overlay) | P0 |
| 6 | Katalog — daftar bibliografi | P0 |
| 7 | Katalog — form tambah/edit (scan ISBN) | P0 |
| 8 | Eksemplar — daftar & detail | P0 |
| 9 | Cetak Label (batch) | P0 |
| 10 | Anggota — daftar | P0 |
| 11 | Anggota — form + foto | P0 |
| 12 | Cetak Kartu Anggota | P0 |
| 13 | Denda & Pembayaran | P0 |
| 14 | OPAC — pencarian | P0 |
| 15 | OPAC — detail buku | P0 |
| 16 | Pengaturan | P0 |
| 17 | Reservasi | P1 |
| 18 | Stock Opname | P1 |
| 19 | Laporan | P1 |
| 20 | User Management | P1 |
| 21 | Audit Log | P1 |
| 22 | Dashboard Anggota (OPAC login) | P1 |

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| WiFi/listrik mati saat jam sibuk | Tinggi | Offline queue + UPS + prosedur fallback tercetak |
| Barcode buku rusak/tidak ada | Sedang | Fitur cari manual by judul di mode kasir (`F3`) |
| Petugas resisten teknologi baru | Tinggi | UI mirip kasir (familiar) + training 1 jam + pendampingan minggu pertama |
| Metadata ISBN tidak lengkap (buku lokal) | Sedang | Fast-track form manual, cuma isi 5 field wajib |
| Duplikasi data dari import lama | Tinggi | Modul migrasi + validasi duplikat sebelum go-live |
| API Open Library/Google Books down atau berubah | Rendah | Cache lokal + fallback manual + abstraksi provider |
| Scanner dibeli tipe salah (USB-COM) | Sedang | Checklist pembelian §6.2 + uji 1 unit sebelum beli banyak |
| Konflik sync offline (buku sama diproses 2 device) | Sedang | Idempotency key + unique index + laporan konflik untuk diselesaikan manual |
| Tidak ada yang maintain setelah proyek selesai | Tinggi | Dokumentasi + serah terima + 1 admin ditunjuk sebelum go-live |
| Data pribadi anggota bocor (NIK/NIS) | Tinggi | Enkripsi at-rest, minimalisasi field, kontrol akses, lihat §18 |

---

## 11. Roadmap & Estimasi

Asumsi tim: 1 fullstack dev + 1 UI/UX part-time + 1 PIC perpustakaan.

| Fase | Durasi | Deliverable |
|---|---|---|
| **Fase 0 — Discovery** | 1 minggu | Observasi alur existing, wawancara petugas, inventarisasi data lama, konfirmasi aturan pinjam & tarif denda, keputusan build vs buy final, sign-off PRD |
| **Fase 1 — Fondasi** | 2 minggu | Setup repo/CI, skema DB + migrasi, auth + RBAC (F1), layout aplikasi, halaman pengaturan (F12) |
| **Fase 2 — Katalog & Anggota** | 2 minggu | Katalogisasi + scan ISBN (F2), eksemplar + cetak label (F3), keanggotaan + kartu (F4), import CSV |
| **Fase 3 — Mode Kasir** ⭐ | 3 minggu | Scan engine (§16), pinjam, kembali, perpanjang (F5), denda & pembayaran (F6), cetak slip |
| **Fase 4 — OPAC & Offline** | 2 minggu | OPAC publik (F10), offline queue + sync (§15), hardening |
| **Fase 5 — UAT & Migrasi** | 2 minggu | Migrasi data lama, UAT dengan petugas asli, perbaikan, training, dokumentasi |
| **Fase 6 — Go-Live & Stabilisasi** | 2 minggu | Rilis produksi, pendampingan harian minggu 1, monitoring metrik |
| **Fase 7 — Fase 2 (P1)** | 4 minggu | Reservasi (F7), stock opname (F8), laporan (F9), notifikasi (F11) |
| **Fase 8 — Nice to have (P2)** | — | Scanner kamera, kartu QR digital, integrasi SIAKAD, multi-cabang |

**Total sampai go-live: ± 14 minggu (3,5 bulan).**

### 11.1 Milestone & gate

| Milestone | Kriteria lolos |
|---|---|
| M1 — Fondasi siap | Login jalan, RBAC teruji, DB ter-migrate di staging |
| M2 — Data siap | 100 buku & 50 anggota bisa diinput + dicetak labelnya |
| M3 — Kasir jalan | Demo: 1 anggota pinjam 3 buku ≤ 15 detik dengan scanner asli |
| M4 — Tahan gangguan | Cabut kabel LAN di tengah transaksi → tetap selesai & tersinkron |
| M5 — UAT lolos | 3 petugas menyelesaikan 20 transaksi tanpa bantuan dev |
| M6 — Go-live | Backup teruji restore, dokumentasi serah terima ditandatangani |

---

## 12. Business Rules Engine

Aturan pinjam **tidak boleh hardcode**. Simpan di `member_types` + `settings`, salin ke `loans.applied_rules_json` saat transaksi dibuat.

### 12.1 Default aturan per tipe anggota

| Tipe | Kuota | Durasi | Max renew | Denda/hari | Grace | Boleh reservasi |
|---|--:|--:|--:|--:|--:|:--:|
| Siswa | 3 | 7 hari | 1× | Rp500 | 0 | ✅ |
| Guru | 5 | 14 hari | 2× | Rp500 | 1 hari | ✅ |
| Umum | 2 | 7 hari | 1× | Rp1.000 | 0 | ❌ |

### 12.2 Urutan validasi saat scan anggota (mode Pinjam)

```
1. Anggota ditemukan?                    → tidak: TOLAK "Kartu tidak terdaftar"
2. status = 'active'?                    → tidak: TOLAK "Keanggotaan diblokir"
3. expiry_date >= hari ini?              → tidak: TOLAK "Kartu kadaluarsa sejak <tgl>"
4. total denda belum bayar < ambang?     → tidak: PERINGATAN KERAS, SELESAI disabled
5. jumlah pinjaman aktif < kuota?        → tidak: TOLAK "Kuota penuh (3/3)"
6. ada pinjaman telat aktif?             → ya : PERINGATAN, boleh lanjut jika setting mengizinkan
→ LOLOS: tampilkan panel identitas, sisa kuota = kuota − pinjaman_aktif
```

### 12.3 Urutan validasi saat scan buku (mode Pinjam)

```
1. Barcode ditemukan di copies?          → tidak: TOLAK "Barcode tidak terdaftar"
2. copies.status = 'available'?          → tidak: TOLAK dengan alasan status
3. is_reference = false?                 → tidak: TOLAK "Koleksi referensi, baca di tempat"
4. condition != 'damaged_heavy'?         → tidak: TOLAK "Buku rusak berat"
5. Sudah ada di keranjang?               → ya : TOLAK "Sudah di keranjang"
6. Sisa kuota > jumlah item di keranjang?→ tidak: TOLAK "Melebihi kuota"
7. Ada reservasi aktif atas nama lain?   → ya : TOLAK "Direservasi <nama>"
→ LOLOS: masukkan keranjang, due_date = hitung_jatuh_tempo(hari_ini, durasi)
```

### 12.4 Perhitungan jatuh tempo

```
hitung_jatuh_tempo(tanggal_pinjam, durasi_hari):
    d = tanggal_pinjam + durasi_hari
    selama d adalah hari libur ATAU perpustakaan tutup:
        d = d + 1 hari
    kembalikan d
```

### 12.5 Perhitungan denda

```
hitung_denda(loan, tanggal_kembali):
    hari_telat = selisih_hari(tanggal_kembali, loan.due_date)
    jika setting.kecualikan_hari_libur:
        hari_telat = hari_telat - jumlah_hari_libur(loan.due_date, tanggal_kembali)
    hari_telat = hari_telat - loan.grace_days
    jika hari_telat <= 0: kembalikan 0

    denda = hari_telat × loan.fine_per_day
    plafon = setting.plafon_denda ?? copy.acquisition_price
    kembalikan min(denda, plafon)
```

**Contoh uji:**

| Kasus | Input | Ekspektasi |
|---|---|---|
| Tepat waktu | due 14-02, kembali 14-02 | Rp0 |
| Telat 5 hari, Rp500/hari | due 14-02, kembali 19-02 | Rp2.500 |
| Telat 2 hari, grace 1 hari | due 14-02, kembali 16-02, grace 1 | Rp500 |
| Telat 200 hari, buku Rp75.000 | plafon = harga | Rp75.000 |
| Hilang | — | harga × faktor + admin |

### 12.6 Aturan perpanjangan

```
boleh_perpanjang(loan):
    renewal_count < max_renewals
    DAN hari_ini <= due_date              (tidak boleh renew kalau sudah telat)
    DAN tidak ada reservasi antre untuk bibliografi ini
    DAN anggota tidak punya denda belum bayar di atas ambang
```

---

## 13. State Machine

### 13.1 Status eksemplar (`copies.status`)

```
                 ┌────────────┐
   katalogisasi →│ available  │
                 └─────┬──────┘
         pinjam        │        kembali
              ┌────────▼────────┐
              │    on_loan      │
              └────────┬────────┘
     ada reservasi     │      tidak ada reservasi
       ┌───────────────┴───────────────┐
       ▼                               ▼
 ┌───────────┐  diambil/hangus   ┌────────────┐
 │  on_hold  │──────────────────▶│ available  │
 └───────────┘                   └────────────┘

 Status lain (dari mana saja):
   maintenance  ← perbaikan/penjilidan  → available
   lost         ← opname / laporan hilang → available (jika ditemukan)
   damaged      ← kembali kondisi rusak  → maintenance / withdrawn
   withdrawn    ← penghapusan koleksi    → terminal
   reference    ← ditandai koleksi baca di tempat (tidak pernah on_loan)
```

**Transisi terlarang:** `withdrawn → on_loan`, `reference → on_loan`, `lost → on_loan`.

### 13.2 Status pinjaman (`loans.status`)

```
active ──(kembali tepat waktu)──▶ returned
  │
  ├──(lewat due_date, job harian)──▶ overdue ──(kembali)──▶ returned_late ──▶ (denda dibuat)
  │
  ├──(perpanjang)──▶ active (renewal_count++)
  │
  ├──(dilaporkan hilang)──▶ lost ──(bayar ganti rugi)──▶ closed
  │
  └──(void oleh petugas ≤5 menit)──▶ voided
```

### 13.3 Status reservasi

```
queued ──(buku tersedia)──▶ ready ──(diambil)──▶ fulfilled
   │                           │
   │                           └──(lewat 2×24 jam)──▶ expired ──▶ (naikkan antrean berikutnya)
   └──(dibatalkan anggota)──▶ cancelled
```

---

## 14. Spesifikasi API (internal)

Base: `/api/v1`. Auth: session cookie + CSRF token. Semua response JSON.

### 14.1 Endpoint sirkulasi

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/scan/resolve?code=` | Identifikasi barcode: anggota / eksemplar / ISBN / unknown |
| `GET` | `/members/:memberNo/circulation` | Panel identitas: profil, kuota terpakai, denda, pinjaman aktif |
| `POST` | `/loans` | Buat transaksi pinjam (batch) |
| `POST` | `/returns` | Proses pengembalian (batch) |
| `POST` | `/loans/:id/renew` | Perpanjang |
| `POST` | `/loans/:id/void` | Batalkan transaksi |
| `POST` | `/payments` | Catat pembayaran denda |
| `POST` | `/fines/:id/waive` | Bebaskan denda (Kepala/Admin) |

### 14.2 Contoh — buat pinjaman

**Request**
```json
POST /api/v1/loans
{
  "idempotency_key": "9f1c2e4a-7b3d-4c8e-a1f2-5d6b7c8e9f01",
  "member_no": "AG-20260184",
  "barcodes": ["PS-2600001", "PS-2600042", "PS-2600117"],
  "input_method": "scan",
  "client_time": "2026-02-07T09:14:22+07:00"
}
```

**Response 201**
```json
{
  "transaction_id": "TRX-20260207-0031",
  "member": { "name": "Ahmad Fauzi", "member_no": "AG-20260184", "type": "Siswa" },
  "loans": [
    { "id": 8812, "barcode": "PS-2600001", "title": "Bumi Manusia",  "due_date": "2026-02-14" },
    { "id": 8813, "barcode": "PS-2600042", "title": "Laskar Pelangi","due_date": "2026-02-14" },
    { "id": 8814, "barcode": "PS-2600117", "title": "Sang Pemimpi",  "due_date": "2026-02-14" }
  ],
  "quota_after": { "used": 3, "limit": 3 },
  "receipt_url": "/api/v1/receipts/TRX-20260207-0031"
}
```

**Response 422 — gagal validasi (tidak ada yang tersimpan)**
```json
{
  "error": "validation_failed",
  "message": "Transaksi ditolak",
  "details": [
    { "barcode": "PS-2600042", "code": "COPY_ON_LOAN",
      "message": "Sedang dipinjam sampai 2026-02-20" }
  ]
}
```

### 14.3 Kode error standar

| Kode | HTTP | Pesan UI |
|---|--:|---|
| `MEMBER_NOT_FOUND` | 404 | Kartu tidak terdaftar |
| `MEMBER_BLOCKED` | 422 | Keanggotaan diblokir |
| `MEMBER_EXPIRED` | 422 | Kartu kadaluarsa sejak {tanggal} |
| `QUOTA_EXCEEDED` | 422 | Kuota penuh ({used}/{limit}) |
| `UNPAID_FINE` | 422 | Ada denda Rp{amount} belum dibayar |
| `COPY_NOT_FOUND` | 404 | Barcode tidak terdaftar |
| `COPY_ON_LOAN` | 422 | Sedang dipinjam sampai {tanggal} |
| `COPY_REFERENCE` | 422 | Koleksi referensi, baca di tempat |
| `COPY_UNAVAILABLE` | 422 | Buku berstatus {status} |
| `COPY_RESERVED` | 422 | Direservasi oleh anggota lain |
| `DUPLICATE_IN_CART` | 422 | Sudah ada di keranjang |
| `RENEW_NOT_ALLOWED` | 422 | Tidak bisa diperpanjang: {alasan} |
| `IDEMPOTENT_REPLAY` | 200 | (kembalikan hasil transaksi sebelumnya) |

Setiap kode wajib punya pesan Bahasa Indonesia yang langsung bisa ditampilkan besar-besar di layar merah.

---

## 15. Strategi Offline & Sinkronisasi

### 15.1 Yang di-cache di klien

Saat login & setiap 15 menit (atau manual "Sinkronkan sekarang"):

| Data | Volume | TTL |
|---|---|---|
| Anggota aktif (no, nama, tipe, status, kuota, denda) | ~20k row ringkas | 24 jam |
| Eksemplar (barcode, judul, status, is_reference) | ~200k row ringkas | 24 jam |
| Aturan pinjam + hari libur | kecil | 24 jam |

Ukuran realistis: ± 15–25 MB di IndexedDB. Simpan hanya field yang dipakai mode kasir, jangan seluruh tabel.

### 15.2 Alur saat offline

```
1. Deteksi offline (navigator.onLine + ping health check tiap 20 detik)
2. Badge berubah 🟡 "Offline — n transaksi antre"
3. Validasi dilakukan dari cache lokal (best-effort)
4. Transaksi disimpan ke IndexedDB queue dengan idempotency_key
5. Slip dicetak dengan tanda: "OFFLINE — menunggu sinkronisasi"
6. Saat online: kirim antrean berurutan, max 5 paralel
7. Sukses → hapus dari queue; Konflik → masuk "Kotak Konflik"
```

### 15.3 Penyelesaian konflik

| Konflik | Resolusi |
|---|---|
| Buku sudah dipinjam orang lain saat sync | Server menang. Transaksi masuk Kotak Konflik, petugas diberi tahu, buku dicari fisik |
| Anggota diblokir setelah transaksi offline | Pinjaman tetap dicatat, ditandai `flagged`, kepala perpus meninjau |
| Duplikat karena sync 2× | Idempotency key → server balas 200 dengan hasil pertama, tidak bikin record baru |
| Kembali offline untuk buku yang sudah dikembalikan | Ambil timestamp paling awal, sisanya diabaikan |

**Batas antrean:** maksimum 500 transaksi offline atau 72 jam. Lewat dari itu, tampilkan peringatan keras — ada masalah infrastruktur yang harus dibereskan, bukan ditimbun.

### 15.4 Prosedur fallback tercetak (wajib ada fisik di meja)

Kalau komputer mati total:
1. Gunakan formulir kertas Pinjam/Kembali (template disediakan sistem, dicetak 50 lembar).
2. Catat: nomor anggota, barcode buku, tanggal, paraf petugas.
3. Setelah sistem hidup: input via menu **Entri Susulan** (input_method = `manual_backfill`, tanggal bisa mundur).

---

## 16. Implementasi Scanner (Keyboard Wedge)

### 16.1 Algoritma deteksi

Scanner "mengetik" sangat cepat (< 30 ms antar karakter) dan diakhiri `Enter`. Manusia mengetik jauh lebih lambat. Ini pembedanya.

```js
const CHAR_GAP_MS = 50;   // jeda maksimum antar karakter agar dianggap scanner
const RESET_MS    = 500;  // buffer hangus kalau diam selama ini
const MIN_LENGTH  = 4;    // minimal panjang barcode valid

let buffer = "";
let lastKeyTime = 0;
let resetTimer = null;

window.addEventListener("keydown", (e) => {
  // Abaikan kalau fokus di input pencarian manual
  if (document.activeElement?.dataset.ignoreScanner) return;

  const now = performance.now();

  if (e.key === "Enter") {
    if (buffer.length >= MIN_LENGTH) {
      e.preventDefault();
      handleScan(buffer);
    }
    buffer = "";
    return;
  }

  if (e.key.length !== 1) return;            // abaikan Shift, Ctrl, F1, dll.

  // Jeda terlalu lama → anggap ketikan manusia, mulai buffer baru
  if (now - lastKeyTime > CHAR_GAP_MS) buffer = "";

  buffer += e.key;
  lastKeyTime = now;

  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => { buffer = ""; }, RESET_MS);
});
```

### 16.2 Aturan implementasi

- **Listener global**, bukan `onChange` di input. Input yang terlihat hanya cermin dari buffer.
- **Jangan pakai `<form>`** — Enter dari scanner akan submit dan reload.
- Fokus dikembalikan ke area scan setiap: halaman dimuat, transaksi selesai, modal ditutup, klik di mana saja di area kasir.
- Debounce pemrosesan: barcode identik dalam < 300 ms diabaikan (mencegah double-trigger hardware).
- Seluruh alur harus tetap bisa dijalankan tanpa scanner: ketik barcode manual + Enter.
- Uji dengan minimal 2 merek scanner berbeda sebelum go-live.

### 16.3 Halaman diagnostik scanner

Sediakan `/setting/scanner-test`: tampilkan raw keystroke, interval antar karakter, panjang string, simbologi terdeteksi. Ini menghemat berjam-jam saat troubleshooting di lapangan.

---

## 17. Spesifikasi Cetak Label & Slip

### 17.1 Label eksemplar (stiker A4, grid 3×8 = 24 label)

| Parameter | Nilai |
|---|---|
| Kertas | A4 (210 × 297 mm) |
| Grid | 3 kolom × 8 baris |
| Ukuran label | 64 × 34 mm |
| Margin halaman | atas/bawah 12,5 mm; kiri/kanan 7 mm |
| Jarak antar label | 0 mm (label berdempet) |
| Isi label | Nama perpustakaan (6 pt) · Barcode Code 128 (tinggi 12 mm) · Kode barcode (8 pt) · Nomor panggil DDC (10 pt bold) |
| Offset mulai | Bisa pilih mulai dari label ke-N (hemat sisa kertas) |

```css
@page { size: A4; margin: 12.5mm 7mm; }
.label {
  width: 64mm; height: 34mm;
  float: left; overflow: hidden;
  page-break-inside: avoid;
}
@media print { .no-print { display: none !important; } }
```

**Aturan:** semua dimensi cetak pakai `mm`, tidak pernah `px`. Sediakan halaman kalibrasi (cetak kotak 50×50 mm, petugas ukur dengan penggaris).

### 17.2 Kartu anggota

| Parameter | Nilai |
|---|---|
| Ukuran | 85,6 × 54 mm (standar KTP/ID-1) |
| Isi depan | Logo + nama perpustakaan · Foto 22×28 mm · Nama · Nomor anggota · Tipe · Berlaku s/d |
| Isi belakang | Barcode Code 128 nomor anggota · 3 baris aturan singkat |
| Layout cetak | 10 kartu per A4 (2 kolom × 5 baris) |

### 17.3 Slip transaksi

**Thermal 58 mm** (lebar cetak 48 mm) atau **80 mm** (72 mm).

```
      PERPUSTAKAAN XYZ
   Jl. Contoh No. 1, Lampung
--------------------------------
BUKTI PEMINJAMAN
No  : TRX-20260207-0031
Tgl : 07-02-2026 09:14
Ptgs: budi
--------------------------------
Anggota : Ahmad Fauzi
No.Ang  : AG-20260184  (Siswa)
--------------------------------
1. Bumi Manusia
   PS-2600001
2. Laskar Pelangi
   PS-2600042
3. Sang Pemimpi
   PS-2600117
--------------------------------
Total buku      : 3
JATUH TEMPO     : 14-02-2026
Denda telat     : Rp500/hari/buku
--------------------------------
Simpan slip ini sebagai bukti.
Cek status: opac.perpus-xyz.sch.id
        Terima kasih
```

Slip pengembalian menambahkan blok: buku yang dikembalikan, hari telat, denda per buku, total denda, status bayar. Kuitansi pembayaran dicetak terpisah dengan nomor kuitansi.

---

## 18. Keamanan, Privasi & Audit

### 18.1 Keamanan aplikasi

| Kontrol | Implementasi |
|---|---|
| Transport | HTTPS wajib, HSTS aktif |
| Password | argon2id, policy min 8 karakter |
| Session | HttpOnly + Secure + SameSite=Lax cookie, rotasi saat login |
| CSRF | Token per session untuk semua mutasi |
| SQL Injection | ORM/prepared statement, tanpa string concat |
| XSS | Escape default framework, sanitasi input sinopsis/catatan |
| Upload | Whitelist MIME (jpg/png/webp), max 2 MB, re-encode gambar |
| Rate limit | Login, pencarian OPAC, endpoint scan |
| Dependency | `npm audit` / `composer audit` di CI, patch bulanan |
| Backup | Terenkripsi, disimpan off-site, uji restore per kuartal |

### 18.2 Privasi data anggota (UU PDP)

- **Minimalisasi:** NIK hanya dikumpulkan jika benar-benar dibutuhkan; untuk siswa cukup NIS.
- **Enkripsi at-rest** untuk kolom `id_number`.
- **Masking di UI:** tampilkan `3204••••••••0012`, nilai penuh hanya untuk Admin dan tercatat di audit log.
- **Retensi:** riwayat pinjaman detail disimpan 3 tahun, setelah itu diagregasi (statistik tetap, identitas dilepas).
- **Hak subjek data:** anggota bisa minta ekspor & penghapusan data pribadi (data transaksional dianonimkan, tidak dihapus).
- **Riwayat baca adalah data sensitif.** Petugas biasa tidak boleh melihat riwayat lengkap anggota lain di luar keperluan sirkulasi aktif.

### 18.3 Audit log — aksi yang wajib dicatat

`login`, `login_failed`, `logout`, `loan.create`, `loan.void`, `loan.renew`, `return.create`, `fine.create`, `fine.waive`, `payment.create`, `payment.void`, `member.create`, `member.update`, `member.delete`, `member.view_sensitive`, `copy.status_change`, `copy.delete`, `settings.update`, `user.create`, `user.role_change`, `export.generate`, `opname.finalize`.

Setiap entri: `user_id`, `action`, `entity`, `entity_id`, `payload` (before/after), `ip`, `user_agent`, `created_at`. Audit log **append-only** — tidak ada endpoint update/delete.

---

## 19. Migrasi Data & Go-Live

### 19.1 Tahapan migrasi

```
1. Ekstrak  → ambil data lama (Excel/SLiMS/buku besar) ke CSV standar
2. Bersihkan→ normalisasi nama penulis, penerbit, tahun; buang baris kosong
3. Petakan  → kolom lama → kolom baru, tulis di sheet mapping
4. Validasi → cek duplikat ISBN/nomor anggota, format tanggal, field wajib
5. Dry run  → import ke staging, hasilkan laporan: sukses / gagal / perlu review
6. Review   → PIC perpustakaan periksa 10% sampel acak
7. Import   → ke produksi, dalam transaksi, dengan rollback point
8. Rekonsil → bandingkan jumlah record lama vs baru, tanda tangani berita acara
```

### 19.2 Menangani koleksi lama tanpa barcode

- Cetak barcode baru untuk seluruh koleksi lama. Ini pekerjaan fisik terbesar — alokasikan waktu khusus.
- Estimasi: 1 orang bisa menempel ± 200 label/jam. 5.000 buku ≈ 25 jam kerja.
- Lakukan per rak, ditandai selesai, supaya bisa dicicil tanpa menutup layanan.
- Selama masa transisi: eksemplar tanpa barcode tetap bisa dilayani via pencarian manual `F3`.

### 19.3 Checklist go-live

- [ ] Backup otomatis berjalan dan **sudah diuji restore**
- [ ] HTTPS aktif, sertifikat auto-renew
- [ ] Data lama termigrasi dan direkonsiliasi (berita acara ditandatangani)
- [ ] Minimal 80% koleksi sudah berlabel barcode
- [ ] Semua anggota aktif punya kartu barcode
- [ ] Aturan pinjam & tarif denda dikonfigurasi dan dikonfirmasi kepala perpus
- [ ] Hari libur satu tahun ke depan diinput
- [ ] Scanner & printer teruji di komputer produksi
- [ ] UPS terpasang
- [ ] Training 1 jam selesai untuk semua petugas
- [ ] Formulir fallback tercetak 50 lembar tersedia di meja
- [ ] Panduan singkat 1 halaman ditempel di dekat komputer kasir
- [ ] Kontak support & jam respons disepakati
- [ ] Akun Admin diserahkan ke PIC institusi, akun dev dinonaktifkan/dibatasi

### 19.4 Rencana rollback

Jika terjadi kegagalan kritis dalam 7 hari pertama: kembali ke prosedur manual dengan formulir fisik, pulihkan database dari snapshot pra-migrasi, perbaiki, ulangi go-live. Keputusan rollback ada di Kepala Perpustakaan, bukan developer.

---

## 20. Strategi QA & Test Plan

### 20.1 Cakupan pengujian

| Level | Fokus | Target |
|---|---|---|
| Unit | Rules engine (kuota, denda, jatuh tempo, renew) | Coverage ≥ 90% untuk modul ini |
| Integrasi | Endpoint sirkulasi, transaksi atomik, idempotency | Semua kode error §14.3 punya test |
| E2E | Alur kasir lengkap keyboard-only | 10 skenario utama |
| Performa | 1.000 scan opname, OPAC 50k judul, laporan 2.000 transaksi | Sesuai target §5 |
| Manual | Cetak label/slip (ukuran fisik), scanner fisik, mode offline | Checklist tertulis |

### 20.2 Skenario UAT wajib (dijalankan petugas asli, tanpa bantuan dev)

1. Pinjam 3 buku untuk 1 anggota tanpa menyentuh mouse — catat waktunya.
2. Pinjam ke anggota berkuota penuh — pastikan pesan penolakan jelas.
3. Kembalikan buku telat 5 hari — verifikasi nominal denda.
4. Bayar denda sebagian, lalu lunasi — cek kuitansi.
5. Bebaskan denda sebagai Kepala — cek muncul di audit log.
6. Scan barcode rusak → cari manual `F3` → selesaikan transaksi.
7. Cabut kabel jaringan di tengah transaksi → selesaikan → colok lagi → verifikasi tersinkron sekali saja.
8. Perpanjang buku yang sudah telat → harus ditolak.
9. Katalogisasi buku baru via scan ISBN + cetak 5 label + tempel + scan hasilnya.
10. Void transaksi salah dalam 5 menit → verifikasi stok kembali benar.

**Kriteria lolos:** 3 petugas menyelesaikan 20 transaksi dengan ≤ 1 pertanyaan ke dev, dan rata-rata waktu pinjam ≤ 15 detik.

### 20.3 Definition of Done (per fitur)

- [ ] AC di PRD terpenuhi semua
- [ ] Unit + integration test hijau di CI
- [ ] Alur bisa diselesaikan keyboard-only (untuk fitur kasir)
- [ ] Semua error punya pesan Bahasa Indonesia yang manusiawi
- [ ] Aksi tercatat di audit log (untuk mutasi data)
- [ ] Tampil benar di tablet 10" landscape
- [ ] Didemokan ke PIC perpustakaan dan disetujui

---

## 21. Analytics & Instrumentasi

Event yang dikirim ke tabel/tool analitik untuk mengukur success metrics §1:

| Event | Properti |
|---|---|
| `checkout_session_start` | timestamp, user_id, mode |
| `member_scanned` | durasi sejak session start, hasil (ok/error), kode error |
| `item_scanned` | durasi sejak item sebelumnya, hasil, input_method |
| `transaction_completed` | jumlah item, durasi total, mode, online/offline |
| `transaction_failed` | kode error, tahap |
| `manual_search_used` | alasan (barcode rusak / tidak ada / lainnya) |
| `offline_queue_flushed` | jumlah transaksi, jumlah konflik |
| `scan_latency` | ms dari keydown terakhir ke UI update |

**Dashboard internal minimum:** rata-rata durasi transaksi (7 hari), rasio scan vs manual, top 10 kode error, panjang antrean offline, p95 scan latency.

---

## 22. Out of Scope (v1)

Eksplisit **tidak** dibangun di v1, supaya tidak jadi scope creep:

- Repository digital / e-book reader / fulltext PDF
- Integrasi SIAKAD atau SSO institusi
- Multi-cabang / multi-perpustakaan dalam satu instance
- Pembayaran online (payment gateway)
- Aplikasi mobile native
- Katalog Z39.50 / OAI-PMH / MARC21 penuh
- Manajemen pengadaan (akuisisi & vendor)
- Peminjaman antar perpustakaan (ILL)
- Ruang baca / booking ruangan
- Absensi pengunjung

Beberapa di antaranya layak jadi v2 — tapi keputusannya diambil setelah v1 stabil ≥ 3 bulan.

---

## 23. Open Questions

| # | Pertanyaan | Penanggung jawab | Batas waktu |
|---|---|---|---|
| 1 | Berapa jumlah persis koleksi & anggota saat ini? | PIC Perpustakaan | Fase 0 |
| 2 | Tarif denda resmi & apakah ada dasar SK-nya? | Kepala Perpustakaan | Fase 0 |
| 3 | Ada ambang denda yang memblokir peminjaman? Berapa? | Kepala Perpustakaan | Fase 0 |
| 4 | Data lama dalam format apa (Excel/SLiMS/manual)? | PIC Perpustakaan | Fase 0 |
| 5 | Hosting: VPS institusi atau cloud eksternal? Ada kebijakan data? | IT Institusi | Fase 0 |
| 6 | Budget hardware (scanner, printer, UPS) sudah dialokasikan? | Manajemen | Fase 0 |
| 7 | Berapa komputer kasir yang akan dipakai bersamaan? | PIC Perpustakaan | Fase 1 |
| 8 | Pakai WhatsApp Business API (berbayar) atau email saja? | Manajemen | Fase 4 |
| 9 | Siapa yang jadi Admin Sistem setelah serah terima? | Manajemen | Sebelum go-live |
| 10 | Skema klasifikasi: DDC penuh atau sederhana? | Pustakawan | Fase 2 |
| 11 | Apakah anggota boleh login ke OPAC di v1 atau tunda ke P1? | Product Owner | Fase 1 |

---

## 24. Glosarium

| Istilah | Arti |
|---|---|
| **Bibliografi** | Record judul/karya. Satu judul = satu bibliografi. |
| **Eksemplar (copy)** | Buku fisik. Satu bibliografi bisa punya banyak eksemplar, masing-masing barcode unik. |
| **Sirkulasi** | Proses pinjam, kembali, perpanjang. |
| **OPAC** | *Online Public Access Catalog* — katalog yang bisa diakses publik. |
| **Stock opname** | Pencocokan koleksi fisik dengan data sistem. |
| **Keyboard wedge** | Mode scanner yang "mengetik" hasil scan seolah keyboard. |
| **Nomor panggil** | Kode lokasi buku di rak, biasanya berbasis DDC. |
| **DDC** | *Dewey Decimal Classification*. |
| **Grace period** | Masa tenggang sebelum denda mulai dihitung. |
| **Idempotency key** | Kunci unik agar request yang terkirim dua kali tidak membuat dua record. |
| **Reservasi (hold)** | Antrean anggota atas buku yang sedang dipinjam. |
| **Void** | Pembatalan transaksi yang sudah tersimpan, dengan jejak audit. |

---

## 25. Lampiran

### 25.1 Template CSV import anggota

```csv
member_no,name,id_number,type,email,phone,join_date,expiry_date,status
AG-20260001,Ahmad Fauzi,0051234567,Siswa,ahmad@example.sch.id,081234567890,2026-01-15,2029-01-15,active
AG-20260002,Siti Nurhaliza,0051234568,Siswa,,081234567891,2026-01-15,2029-01-15,active
```

Aturan: `member_no` kosong → di-generate sistem. `type` harus cocok dengan `member_types.name`. Tanggal format `YYYY-MM-DD`. Baris gagal validasi dilaporkan lengkap dengan nomor baris, **tidak** menggagalkan seluruh import.

### 25.2 Template CSV import koleksi

```csv
isbn,title,authors,publisher,year,ddc,copies,location,acquisition_source,acquisition_price
9789799731234,Bumi Manusia,Pramoedya Ananta Toer,Hasta Mitra,1980,899.221,3,R-A1,Beli,95000
,Sejarah Lampung,Tim Penyusun,Dinas Pendidikan,2018,959.81,2,R-C4,Hibah,0
```

Kolom `copies` = jumlah eksemplar yang akan dibuatkan barcode otomatis.

### 25.3 Panduan 1 halaman untuk petugas (ditempel di meja kasir)

```
╔══════════════════════════════════════════════╗
║           PUSTAKASCAN — PANDUAN CEPAT        ║
╠══════════════════════════════════════════════╣
║ PINJAM   : F1 → scan kartu → scan buku →Enter║
║ KEMBALI  : F2 → scan buku → Enter            ║
║ CARI     : F3   PERPANJANG: F4  DENDA: F5    ║
║ ULANGI   : Esc  BATAL TRX : Ctrl+Z           ║
║ CETAK ULANG SLIP          : Ctrl+P           ║
╠══════════════════════════════════════════════╣
║ 🟢 Online  = normal                          ║
║ 🟡 Offline = tetap lanjut, nanti tersinkron  ║
║ 🔴 Layar merah = BACA pesannya, jangan       ║
║    diulang-ulang scan                        ║
╠══════════════════════════════════════════════╣
║ Komputer mati? → pakai FORMULIR KERTAS,      ║
║ input susulan setelah menyala.               ║
║ Bantuan: ____________  (jam ____ - ____)     ║
╚══════════════════════════════════════════════╝
```

### 25.4 Struktur `settings` (contoh)

```json
{
  "library": { "name": "Perpustakaan XYZ", "address": "...", "logo_url": "..." },
  "circulation": {
    "block_on_unpaid_fine": true,
    "unpaid_fine_threshold": 10000,
    "block_on_overdue": true,
    "exclude_holidays_from_due": true,
    "exclude_holidays_from_fine": false,
    "void_window_minutes": 5
  },
  "fines": {
    "cap_mode": "acquisition_price",
    "lost_multiplier": 1.0,
    "lost_admin_fee": 10000,
    "allow_partial_payment": true
  },
  "numbering": {
    "member": "AG-{YYYY}{NNNN}",
    "copy": "PS-{YY}{NNNNN}",
    "transaction": "TRX-{YYYYMMDD}-{NNNN}",
    "receipt": "KW-{YYYY}-{NNNNNN}"
  },
  "reservation": { "pickup_hours": 48, "max_active_per_member": 2 },
  "notification": { "channels": ["email"], "due_reminder_days": [2, 0], "overdue_days": [1, 7, 30] },
  "hardware": { "receipt_width_mm": 58, "label_offset_start": 1, "sound_enabled": true }
}
```

---

**Akhir dokumen.**
Perubahan setelah sign-off harus lewat change request tertulis dengan dampak ke jadwal dicantumkan.
