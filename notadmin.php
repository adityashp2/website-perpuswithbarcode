<?php
require_once __DIR__ . '/koneksi.php';
?>
<div style="max-width: 500px; margin: 40px auto; text-align: center;">
    <div class="card" style="padding: 36px;">
        <i class='bx bx-shield-x' style="font-size: 56px; color: var(--danger); margin-bottom: 16px;"></i>
        <h2 style="font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Akses Terbatas (Khusus Administrator)</h2>
        <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 24px;">Halaman ini hanya dapat diakses oleh akun dengan hak akses Administrator.</p>
        <a href="index.php?pg=beranda" class="btn btn-secondary" style="width: 100%;">
            <i class='bx bx-home'></i> Kembali ke Beranda
        </a>
    </div>
</div>
