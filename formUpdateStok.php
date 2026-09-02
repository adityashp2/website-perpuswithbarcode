<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$idBuku = $_GET['idBuku'] ?? '';
$dtBuku = null;

if (!empty($idBuku)) {
    $idBuku_esc = db_escape($idBuku);
    $q = db_query("SELECT * FROM buku WHERE isbn='$idBuku_esc' LIMIT 1");
    if (db_num_rows($q) > 0) {
        $dtBuku = db_fetch_one($q);
    }
}

if (!$dtBuku) {
    set_flash('error', 'Buku tidak ditemukan.');
    echo "<script>window.location.href='index.php?pg=stokBuku$admin_query_str';</script>";
    exit();
}
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Perbarui Stok Eksemplar Buku</h1>
        <p>Sesuaikan jumlah fisik eksemplar buku yang tersedia untuk dipinjam.</p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=stokBuku<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-arrow-back'></i> Kembali ke Manajemen Stok
        </a>
    </div>
</div>

<div class="card" style="max-width: 550px;">
    <form method="POST" action="updateStok.php">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
        <input type="hidden" name="isbn" value="<?= htmlspecialchars($dtBuku['isbn']) ?>">

        <div class="form-group">
            <label class="form-label">ISBN / Kode Buku</label>
            <input type="text" class="form-control" value="<?= htmlspecialchars($dtBuku['isbn']) ?>" readonly style="background: #f1f5f9; font-family: monospace;">
        </div>

        <div class="form-group">
            <label class="form-label">Judul Buku</label>
            <input type="text" name="judul" class="form-control" value="<?= htmlspecialchars($dtBuku['judul']) ?>" readonly style="background: #f1f5f9;">
        </div>

        <div class="form-group">
            <label class="form-label">Jumlah Eksemplar Stok Fisik <span class="required">*</span></label>
            <div style="position: relative;">
                <input type="number" name="stok" class="form-control" min="0" value="<?= htmlspecialchars($dtBuku['qty_stok']) ?>" required autofocus>
            </div>
            <div class="form-hint">Jumlah total buku yang siap diedarkan atau dipinjam</div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 160px;">
                <i class='bx bx-save'></i> Simpan Jumlah Stok
            </button>
            <a href="index.php?pg=stokBuku<?= $admin_query_str ?>" class="btn btn-secondary" style="flex: 1; min-width: 100px;">Batal</a>
        </div>
    </form>
</div>
