<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$select_config = db_query("SELECT * FROM config LIMIT 1");
$dt_config = db_fetch_one($select_config);

if (!$dt_config) {
    db_query("INSERT INTO config (maxLamaPinjam, dendaPerHari) VALUES (3, 500)");
    $dt_config = ['id' => 1, 'maxLamaPinjam' => 3, 'dendaPerHari' => 500];
}
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Konfigurasi Aturan & Denda Perpustakaan</h1>
        <p>Atur batas maksimal durasi peminjaman dan besaran tarif denda keterlambatan.</p>
    </div>
</div>

<div class="card" style="max-width: 600px;">
    <form method="POST" action="updateConfig.php">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
        <input type="hidden" name="id" value="<?= htmlspecialchars($dt_config['id']) ?>">

        <div class="form-group">
            <label class="form-label">Batas Maksimal Lama Peminjaman <span class="required">*</span></label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" name="maxLamaPinjam" class="form-control" min="1" max="90" value="<?= htmlspecialchars($dt_config['maxLamaPinjam']) ?>" required style="max-width: 140px;">
                <span style="font-weight: 600; color: var(--text-muted);">Hari</span>
            </div>
            <div class="form-hint">Standar waktu peminjaman buku sebelum dikenakan denda keterlambatan</div>
        </div>

        <div class="form-group">
            <label class="form-label">Besaran Denda Keterlambatan Per Hari <span class="required">*</span></label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: var(--text-muted);">Rp</span>
                <input type="number" name="dendaPerHari" class="form-control" min="0" step="100" value="<?= htmlspecialchars($dt_config['dendaPerHari']) ?>" required style="max-width: 200px;">
                <span style="font-weight: 600; color: var(--text-muted);">/ hari keterlambatan</span>
            </div>
            <div class="form-hint">Dihitung otomatis saat anggota mengembalikan buku yang melewati batas tanggal kembali</div>
        </div>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border);">
            <button type="submit" class="btn btn-primary">
                <i class='bx bx-save'></i> Simpan Pengaturan
            </button>
        </div>
    </form>
</div>
