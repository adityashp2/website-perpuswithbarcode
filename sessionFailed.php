<?php
require_once __DIR__ . '/koneksi.php';
?>
<div style="max-width: 500px; margin: 40px auto; text-align: center;">
    <div class="card" style="padding: 36px;">
        <i class='bx bx-time-five' style="font-size: 56px; color: var(--warning); margin-bottom: 16px;"></i>
        <h2 style="font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Sesi Telah Berakhir</h2>
        <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 24px;">Sesi login Anda telah habis atau tidak valid. Silakan login kembali untuk melanjutkan.</p>
        <a href="index.php?pg=login" class="btn btn-primary" style="width: 100%;">
            <i class='bx bx-log-in'></i> Masuk Kembali
        </a>
    </div>
</div>
