<?php
require_once __DIR__ . '/koneksi.php';
?>
<div class="page-header">
    <div class="page-header-info">
        <h1>Profil Perpustakaan Politeknik Negeri Lampung</h1>
        <p>Mengenal lebih dekat visi, misi, fasilitas, dan layanan Unit Pelaksana Teknis (UPT) Perpustakaan Polinela.</p>
    </div>
</div>

<div class="card" style="margin-bottom: 24px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center;" class="profile-card">
        <div>
            <h2 style="font-family: var(--font-heading); font-size: 22px; margin-bottom: 14px; color: var(--primary);">
                Pusat Sumber Belajar & Riset Terapan Polinela
            </h2>
            <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 14px;">
                Perpustakaan Politeknik Negeri Lampung (UPT Perpustakaan Polinela) merupakan unit penunjang akademik yang bertugas menyediakan sumber literatur ilmiah, buku teks vokasi, jurnal ilmiah, tugas akhir/skripsi, serta referensi teknologi terapan bagi seluruh mahasiswa, dosen, dan sivitas akademika Polinela.
            </p>
            <p style="color: var(--text-muted); line-height: 1.8;">
                Melalui sistem perpustakaan digital ini, pemustaka dapat menelusuri katalog koleksi secara cepat, memantau ketersediaan eksemplar, serta menikmati layanan sirkulasi peminjaman dan pengembalian yang terintegrasi secara daring.
            </p>
        </div>
        <div style="background: var(--sidebar-bg); border-radius: var(--radius-lg); padding: 32px; color: #fff;">
            <h3 style="font-family: var(--font-heading); font-size: 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <i class='bx bx-target-lock' style="color: var(--secondary);"></i> Visi &amp; Misi
            </h3>
            <div style="margin-bottom: 16px;">
                <strong style="color: #d8c69a; display: block; margin-bottom: 4px;">VISI:</strong>
                <p style="font-size: 13.5px; opacity: 0.9;">
                    Menjadi pusat layanan informasi dan perpustakaan digital terkemuka yang mendukung pendidikan vokasi unggul dan berdaya saing global.
                </p>
            </div>
            <div>
                <strong style="color: #d8c69a; display: block; margin-bottom: 4px;">MISI:</strong>
                <ul style="padding-left: 18px; font-size: 13px; opacity: 0.9; line-height: 1.7;">
                    <li>Menyediakan koleksi bahan pustaka vokasi dan terapan yang mutakhir dan relevan.</li>
                    <li>Mengembangkan layanan sirkulasi perpustakaan modern berbasis teknologi informasi.</li>
                    <li>Mendukung kegiatan riset, inovasi terapan, dan pengabdian masyarakat sivitas akademika Polinela.</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <div class="card-title">
            <i class='bx bx-map-pin' style="color: var(--primary);"></i>
            <span>Informasi & Kontak Layanan</span>
        </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
        <div style="padding: 16px; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">
                <i class='bx bx-time'></i> Jam Layanan Pemustaka
            </div>
            <div style="font-weight: 600; color: #0f172a;">Senin - Jumat</div>
            <div style="font-size: 13px; color: var(--text-muted);">08.00 - 16.00 WIB</div>
        </div>
        <div style="padding: 16px; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">
                <i class='bx bx-map'></i> Alamat Kampus
            </div>
            <div style="font-weight: 600; color: #0f172a;">Gedung UPT Perpustakaan Polinela</div>
            <div style="font-size: 13px; color: var(--text-muted);">Jl. Soekarno Hatta No. 10, Rajabasa, Bandar Lampung</div>
        </div>
        <div style="padding: 16px; background: #f8fafc; border-radius: var(--radius-md); border: 1px solid var(--card-border);">
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">
                <i class='bx bx-envelope'></i> Email & Telepon
            </div>
            <div style="font-weight: 600; color: #0f172a;">perpustakaan@polinela.ac.id</div>
            <div style="font-size: 13px; color: var(--text-muted);">Telp: (0721) 703995</div>
        </div>
    </div>
</div>