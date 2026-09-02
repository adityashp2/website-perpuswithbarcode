<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$idKatalog = $_GET['idKatalog'] ?? '';
$is_edit = false;
$dtKatalog = ['id_katalog' => '', 'nama' => ''];

if (!empty($idKatalog)) {
    $idKatalog_esc = db_escape($idKatalog);
    $q = db_query("SELECT * FROM katalog WHERE id_katalog='$idKatalog_esc' LIMIT 1");
    if (db_num_rows($q) > 0) {
        $dtKatalog = db_fetch_one($q);
        $is_edit = true;
    }
}
?>

<div class="page-header">
    <div class="page-header-info">
        <h1><?= $is_edit ? 'Edit Kategori Buku' : 'Tambah Kategori Baru' ?></h1>
        <p><?= $is_edit ? 'Perbarui nama klasifikasi kategori' : 'Tambahkan kategori/katalog baru untuk pengelompokan buku' ?></p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=katalog<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-arrow-back'></i> Kembali ke Daftar Kategori
        </a>
    </div>
</div>

<div class="card" style="max-width: 550px;">
    <form method="POST" action="saveKatalog.php">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">

        <div class="form-group">
            <label class="form-label">Kode Kategori <span class="required">*</span></label>
            <input type="text" name="id_katalog" class="form-control" maxlength="3" value="<?= htmlspecialchars($dtKatalog['id_katalog']) ?>" <?= $is_edit ? 'readonly style="background:#f1f5f9;"' : 'required' ?> placeholder="Contoh: KG1, TKN">
            <div class="form-hint">Maksimal 3 karakter (unik)</div>
        </div>

        <div class="form-group">
            <label class="form-label">Nama Kategori / Klasifikasi <span class="required">*</span></label>
            <input type="text" name="nama" class="form-control" value="<?= htmlspecialchars($dtKatalog['nama']) ?>" placeholder="Contoh: Teknik Komputer & Jaringan, Sastra" required>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 160px;">
                <i class='bx bx-save'></i> <?= $is_edit ? 'Simpan Perubahan' : 'Tambah Kategori' ?>
            </button>
            <a href="index.php?pg=katalog<?= $admin_query_str ?>" class="btn btn-secondary" style="flex: 1; min-width: 100px;">Batal</a>
        </div>
    </form>
</div>
