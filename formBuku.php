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
$is_edit = false;
$dtBuku = [
    'isbn' => '',
    'judul' => '',
    'tahun' => date('Y'),
    'id_penerbit' => '',
    'id_pengarang' => '',
    'id_katalog' => '',
    'qty_stok' => 0
];

if (!empty($idBuku)) {
    $idBuku_esc = db_escape($idBuku);
    $q_buku = db_query("SELECT * FROM buku WHERE isbn='$idBuku_esc' LIMIT 1");
    if (db_num_rows($q_buku) > 0) {
        $dtBuku = db_fetch_one($q_buku);
        $is_edit = true;
    }
}

$penerbit_list = db_fetch_all(db_query("SELECT * FROM penerbit ORDER BY nama_penerbit ASC"));
$pengarang_list = db_fetch_all(db_query("SELECT * FROM pengarang ORDER BY nama_pengarang ASC"));
$katalog_list = db_fetch_all(db_query("SELECT * FROM katalog ORDER BY nama ASC"));
?>

<div class="page-header">
    <div class="page-header-info">
        <h1><?= $is_edit ? 'Edit Data Buku' : 'Tambah Buku Baru' ?></h1>
        <p><?= $is_edit ? 'Perbarui informasi rincian buku' : 'Isi formulir lengkap untuk menambahkan buku baru ke katalog' ?></p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=buku<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-arrow-back'></i> Kembali ke Daftar Buku
        </a>
    </div>
</div>

<div class="card" style="max-width: 700px;">
    <form method="POST" action="saveBuku.php" enctype="multipart/form-data">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
        <input type="hidden" name="is_edit" value="<?= $is_edit ? '1' : '0' ?>">

        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding: 18px; border: 1px solid var(--card-border); border-radius: var(--radius-md); background: var(--bg-main);">
            <div id="bookPhotoPreview" style="width: 90px; height: 120px; border-radius: 14px; background: #f1f5f9; border: 2px dashed var(--card-border); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                <?php if (!empty($dtBuku['foto'])): ?>
                    <img src="<?= htmlspecialchars($dtBuku['foto']) ?>" alt="Cover buku" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='images/default-book-cover.svg';">
                <?php else: ?>
                    <img src="images/default-book-cover.svg" alt="Cover buku default" style="width:100%; height:100%; object-fit:cover;">
                <?php endif; ?>
            </div>
            <div style="flex: 1;">
                <label class="form-label">Foto Sampul Buku</label>
                <input type="file" name="foto_buku" id="fotoBukuInput" class="form-control" accept="image/*" onchange="previewBookPhoto(this)">
                <div class="form-hint">Format: JPG, PNG, WEBP. Ukuran maksimal 2 MB.</div>
            </div>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">ISBN / Kode Buku <span class="required">*</span></label>
                <input type="text" name="isbn" class="form-control" maxlength="25" value="<?= htmlspecialchars($dtBuku['isbn']) ?>" <?= $is_edit ? 'readonly style="background:#f1f5f9;"' : 'required' ?> placeholder="Otomatis dibuat sesuai kategori jika dikosongkan">
                <div class="form-hint"><?= $is_edit ? 'Nomor identifikasi unik buku' : 'Kode akan dibuat otomatis berdasarkan kategori buku jika Anda kosongkan field ini.' ?></div>
            </div>

            <div class="form-group">
                <label class="form-label">Tahun Terbit <span class="required">*</span></label>
                <input type="number" name="tahun" class="form-control" min="1900" max="2099" value="<?= htmlspecialchars($dtBuku['tahun']) ?>" required>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Judul Buku <span class="required">*</span></label>
            <input type="text" name="judul" class="form-control" value="<?= htmlspecialchars($dtBuku['judul']) ?>" placeholder="Masukkan judul buku lengkap" required>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Pengarang / Penulis <span class="required">*</span></label>
                <select name="pengarang" class="form-control" required>
                    <option value="">-- Pilih Pengarang --</option>
                    <?php foreach ($pengarang_list as $pg): ?>
                        <option value="<?= htmlspecialchars($pg['id_pengarang']) ?>" <?= $dtBuku['id_pengarang'] === $pg['id_pengarang'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($pg['nama_pengarang']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Penerbit <span class="required">*</span></label>
                <select name="penerbit" class="form-control" required>
                    <option value="">-- Pilih Penerbit --</option>
                    <?php foreach ($penerbit_list as $pn): ?>
                        <option value="<?= htmlspecialchars($pn['id_penerbit']) ?>" <?= $dtBuku['id_penerbit'] === $pn['id_penerbit'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($pn['nama_penerbit']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label class="form-label">Kategori / Katalog <span class="required">*</span></label>
                <select name="katalog" class="form-control" required>
                    <option value="">-- Pilih Kategori --</option>
                    <?php foreach ($katalog_list as $kt): ?>
                        <option value="<?= htmlspecialchars($kt['id_katalog']) ?>" <?= $dtBuku['id_katalog'] === $kt['id_katalog'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($kt['nama']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <?php if (!$is_edit): ?>
                <div class="form-group">
                    <label class="form-label">Jumlah Stok Awal</label>
                    <input type="number" name="qty_stok" class="form-control" min="0" value="1" placeholder="Jumlah eksemplar">
                </div>
            <?php endif; ?>

            <div class="form-group">
                <label class="form-label">Batas Pinjam Per Anggota</label>
                <input type="number" name="maks_pinjam_per_anggota" class="form-control" min="1" max="99" value="<?= htmlspecialchars((string)($dtBuku['maks_pinjam_per_anggota'] ?? 1)) ?>" required>
                <div class="form-hint">1 akun maksimal meminjam berapa eksemplar buku yang sama.</div>
            </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 160px;">
                <i class='bx bx-save'></i> <?= $is_edit ? 'Simpan Perubahan' : 'Tambah Buku' ?>
            </button>
            <a href="index.php?pg=buku<?= $admin_query_str ?>" class="btn btn-secondary" style="flex: 1; min-width: 100px;">Batal</a>
        </div>
    </form>
</div>

<script>
const isEditMode = <?= $is_edit ? 'true' : 'false' ?>;
const isbnInput = document.querySelector('input[name="isbn"]');
const katalogSelect = document.querySelector('select[name="katalog"]');

function generateAutoBookCode() {
    if (isEditMode || !isbnInput || !katalogSelect) return;
    if ((isbnInput.value || '').trim() !== '') return;

    const katalogValue = (katalogSelect.value || '').trim();
    if (!katalogValue) return;

    const prefix = katalogValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'BK';
    const suffix = String(Date.now() % 9000 + 1000);
    isbnInput.value = prefix + '-' + suffix;
}

function previewBookPhoto(input) {
    const preview = document.getElementById('bookPhotoPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview cover buku" style="width:100%; height:100%; object-fit:cover;">';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

if (!isEditMode && katalogSelect) {
    katalogSelect.addEventListener('change', function () {
        generateAutoBookCode();
    });
}

if (!isEditMode && isbnInput) {
    isbnInput.addEventListener('focus', function () {
        if ((isbnInput.value || '').trim() === '') {
            generateAutoBookCode();
        }
    });
}
</script>
