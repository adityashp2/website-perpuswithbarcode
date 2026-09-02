<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$idPengarang = $_GET['idPengarang'] ?? '';
$is_edit = false;
$dtPengarang = [
    'id_pengarang' => '',
    'nama_pengarang' => '',
    'email' => '',
    'telp' => '',
    'alamat' => ''
];

if (!empty($idPengarang)) {
    $idPengarang_esc = db_escape($idPengarang);
    $q = db_query("SELECT * FROM pengarang WHERE id_pengarang='$idPengarang_esc' LIMIT 1");
    if (db_num_rows($q) > 0) {
        $dtPengarang = db_fetch_one($q);
        $is_edit = true;
    }
}
?>

<div class="page-header">
    <div class="page-header-info">
        <h1><?= $is_edit ? 'Edit Data Pengarang' : 'Tambah Pengarang Baru' ?></h1>
        <p><?= $is_edit ? 'Perbarui informasi rincian pengarang' : 'Tambahkan data penulis/pengarang buku ke dalam sistem' ?></p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=pengarang<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-arrow-back'></i> Kembali ke Daftar Pengarang
        </a>
    </div>
</div>

<div class="card" style="max-width: 600px;">
    <form method="POST" action="savePengarang.php">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">

        <div class="form-group">
            <label class="form-label">Kode Pengarang <span class="required">*</span></label>
            <input type="text" name="id_pengarang" class="form-control" maxlength="8" value="<?= htmlspecialchars($dtPengarang['id_pengarang']) ?>" <?= $is_edit ? 'readonly style="background:#f1f5f9;"' : 'required' ?> placeholder="Contoh: PG01, AND">
            <div class="form-hint">Maksimal 8 karakter (unik)</div>
        </div>

        <div class="form-group">
            <label class="form-label">Nama Pengarang / Penulis <span class="required">*</span></label>
            <input type="text" name="nama_pengarang" class="form-control" value="<?= htmlspecialchars($dtPengarang['nama_pengarang']) ?>" placeholder="Nama lengkap pengarang" required>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($dtPengarang['email']) ?>" placeholder="pengarang@domain.com">
            </div>

            <div class="form-group">
                <label class="form-label">Telepon / Kontak</label>
                <input type="text" name="telp" class="form-control" value="<?= htmlspecialchars($dtPengarang['telp']) ?>" placeholder="08xxxxxxxxxx">
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Alamat</label>
            <textarea name="alamat" class="form-control" rows="3" placeholder="Alamat atau domisili pengarang"><?= htmlspecialchars($dtPengarang['alamat']) ?></textarea>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 160px;">
                <i class='bx bx-save'></i> <?= $is_edit ? 'Simpan Perubahan' : 'Tambah Pengarang' ?>
            </button>
            <a href="index.php?pg=pengarang<?= $admin_query_str ?>" class="btn btn-secondary" style="flex: 1; min-width: 100px;">Batal</a>
        </div>
    </form>
</div>
