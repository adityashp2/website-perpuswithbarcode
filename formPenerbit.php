<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$idPenerbit = $_GET['idPenerbit'] ?? '';
$is_edit = false;
$dtPenerbit = [
    'id_penerbit' => '',
    'nama_penerbit' => '',
    'email' => '',
    'telp' => '',
    'alamat' => ''
];

if (!empty($idPenerbit)) {
    $idPenerbit_esc = db_escape($idPenerbit);
    $q = db_query("SELECT * FROM penerbit WHERE id_penerbit='$idPenerbit_esc' LIMIT 1");
    if (db_num_rows($q) > 0) {
        $dtPenerbit = db_fetch_one($q);
        $is_edit = true;
    }
}
?>

<div class="page-header">
    <div class="page-header-info">
        <h1><?= $is_edit ? 'Edit Data Penerbit' : 'Tambah Penerbit Baru' ?></h1>
        <p><?= $is_edit ? 'Perbarui data informasi penerbit' : 'Tambahkan penerbit buku baru ke dalam direktori perpustakaan' ?></p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=penerbit<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-arrow-back'></i> Kembali ke Daftar Penerbit
        </a>
    </div>
</div>

<div class="card" style="max-width: 600px;">
    <form method="POST" action="savePenerbit.php">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">

        <div class="form-group">
            <label class="form-label">Kode Penerbit <span class="required">*</span></label>
            <input type="text" name="id_penerbit" class="form-control" maxlength="8" value="<?= htmlspecialchars($dtPenerbit['id_penerbit']) ?>" <?= $is_edit ? 'readonly style="background:#f1f5f9;"' : 'required' ?> placeholder="Contoh: PN01, GRA">
            <div class="form-hint">Maksimal 8 karakter (unik)</div>
        </div>

        <div class="form-group">
            <label class="form-label">Nama Penerbit <span class="required">*</span></label>
            <input type="text" name="nama_penerbit" class="form-control" value="<?= htmlspecialchars($dtPenerbit['nama_penerbit']) ?>" placeholder="Nama lengkap perusahaan penerbit" required>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($dtPenerbit['email']) ?>" placeholder="kontak@penerbit.com">
            </div>

            <div class="form-group">
                <label class="form-label">Telepon</label>
                <input type="text" name="telp" class="form-control" value="<?= htmlspecialchars($dtPenerbit['telp']) ?>" placeholder="021xxxxxxx">
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Alamat</label>
            <textarea name="alamat" class="form-control" rows="3" placeholder="Alamat kantor penerbit"><?= htmlspecialchars($dtPenerbit['alamat']) ?></textarea>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 160px;">
                <i class='bx bx-save'></i> <?= $is_edit ? 'Simpan Perubahan' : 'Tambah Penerbit' ?>
            </button>
            <a href="index.php?pg=penerbit<?= $admin_query_str ?>" class="btn btn-secondary" style="flex: 1; min-width: 100px;">Batal</a>
        </div>
    </form>
</div>
