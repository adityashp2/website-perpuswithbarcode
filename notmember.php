<?php
require_once __DIR__ . '/koneksi.php';
?>
<div style="max-width: 500px; margin: 40px auto; text-align: center;">
    <div class="card" style="padding: 36px;">
        <i class='bx bx-user-x' style="font-size: 56px; color: var(--warning); margin-bottom: 16px;"></i>
        <h2 style="font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Akses Khusus Anggota</h2>
        <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 24px;">Fitur sirkulasi peminjaman hanya diperuntukkan bagi akun anggota perpustakaan yang telah login.</p>
        <div style="display: flex; gap: 10px;">
            <a href="index.php?pg=login" class="btn btn-primary" style="flex: 1;">
                <i class='bx bx-log-in'></i> Masuk Anggota
            </a>
            <a href="index.php?pg=beranda" class="btn btn-secondary" style="flex: 1;">
                Beranda
            </a>
        </div>
    </div>
</div>
