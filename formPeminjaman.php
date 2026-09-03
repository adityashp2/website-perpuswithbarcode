<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ANG') {
    echo "<script>window.location.href='index.php?pg=notmember';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

// Ambil konfigurasi lama pinjam
$q_config = db_fetch_one(db_query("SELECT * FROM config LIMIT 1"));
$max_hari = $q_config['maxLamaPinjam'] ?? 3;

$tgl_pinjam = date('Y-m-d');
$tgl_kembali = date('Y-m-d', strtotime("+$max_hari days"));

// Ambil daftar buku yang memiliki stok > 0
$buku_tersedia = db_fetch_all(db_query("SELECT b.isbn, b.judul, b.qty_stok, b.maks_pinjam_per_anggota, pg.nama_pengarang 
    FROM buku b 
    LEFT JOIN pengarang pg ON pg.id_pengarang=b.id_pengarang 
    WHERE b.qty_stok > 0 
    ORDER BY b.judul ASC"));
$default_isbn = trim($_GET['isbn'] ?? '');
$single_book_mode = $default_isbn !== '';
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Formulir Peminjaman Buku</h1>
        <p>Pilih buku dan tentukan jumlah eksemplar (quantity) yang ingin Anda pinjam.</p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=pengembalian<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-history'></i> Riwayat & Pengembalian
        </a>
    </div>
</div>

<?php if (($user['status_verifikasi'] ?? '') === 'PENDING'): ?>
    <div class="alert alert-warning">
        <i class='bx bx-time-five' style="font-size: 20px;"></i>
        <div>
            <strong>KTM Anda sedang menunggu verifikasi.</strong> Petugas perpustakaan perlu memeriksa foto KTM yang Anda unggah saat pendaftaran sebelum Anda dapat mengajukan peminjaman buku.
        </div>
    </div>
<?php elseif (($user['status_verifikasi'] ?? '') === 'DITOLAK'): ?>
    <div class="alert alert-danger">
        <i class='bx bx-error-circle' style="font-size: 20px;"></i>
        <div>
            <strong>Verifikasi KTM Anda ditolak.</strong>
            <?= htmlspecialchars($user['catatan_verifikasi'] ?: 'Silakan hubungi petugas perpustakaan untuk mengunggah ulang foto KTM yang jelas.') ?>
        </div>
    </div>
<?php endif; ?>


<div class="card" style="max-width: 840px;">
    <form method="POST" action="savePeminjaman.php" id="formPinjam">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
        <input type="hidden" name="id_anggota" value="<?= htmlspecialchars($user['id_anggota']) ?>">
        <input type="hidden" name="tglPinjam" value="<?= $tgl_pinjam ?>">
        <input type="hidden" name="tglKembali" value="<?= $tgl_kembali ?>">

        <!-- Header Info Transaksi -->
        <div style="background: var(--bg-main); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--card-border); margin-bottom: 24px;">
            <div class="form-grid">
                <div>
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Peminjam (Anggota)</div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px;">
                        <?= htmlspecialchars($user['nama']) ?>
                    </div>
                    <div style="font-size: 12px; color: var(--text-muted);">No. Anggota: #<?= $user['id_anggota'] ?></div>
                </div>
                <div>
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Tanggal Pinjam</div>
                    <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px;">
                        <i class='bx bx-calendar'></i> <?= tgl_indo($tgl_pinjam) ?>
                    </div>
                </div>
                <div>
                    <div style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Wajib Kembali Sebelum</div>
                    <div style="font-size: 14px; font-weight: 700; color: var(--primary); margin-top: 4px;">
                        <i class='bx bx-time'></i> <?= tgl_indo($tgl_kembali) ?> <small>(Maks <?= $max_hari ?> hari)</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Daftar Buku yang Dipinjam -->
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
            <label class="form-label" style="margin-bottom: 0; font-size: 15px;">
                <i class='bx bx-book-bookmark' style="color: var(--primary);"></i> Daftar Buku & Jumlah Pinjam
            </label>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addBookRow()" style="<?= $single_book_mode ? 'display:none;' : '' ?>">
                <i class='bx bx-plus'></i> Tambah Judul Buku
            </button>
        </div>

        <div id="bookRowsContainer" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <!-- Row Item Buku (Initial Row) -->
            <div class="book-select-row" style="display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid var(--card-border); padding: 14px 16px; border-radius: var(--radius-md); flex-wrap: wrap;">
                <span class="row-num" style="width: 24px; font-weight: 700; color: var(--text-muted);">1.</span>
                <select name="isbn[]" class="form-control book-select" required style="flex: 2; min-width: 200px;" onchange="handleBookChange(this)">
                    <option value="" data-stok="1">-- Pilih Judul Buku yang Tersedia --</option>
                    <?php foreach ($buku_tersedia as $b): ?>
                        <?php $limit_per_akun = (int)($b['maks_pinjam_per_anggota'] ?? 1); ?>
                        <option value="<?= htmlspecialchars($b['isbn']) ?>" data-stok="<?= $b['qty_stok'] ?>" data-limit="<?= $limit_per_akun ?>" <?= ($default_isbn !== '' && $b['isbn'] === $default_isbn) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($b['judul']) ?> (Penulis: <?= htmlspecialchars($b['nama_pengarang'] ?? '-') ?> | Stok: <?= $b['qty_stok'] ?> eks | Maks/akun: <?= $limit_per_akun ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 12.5px; font-weight: 700; color: var(--text-muted);">Jumlah (Qty):</span>
                    <input type="number" name="qty[]" class="form-control qty-input" value="1" min="1" max="99" style="width: 75px; text-align: center; font-weight: 700;" required>
                    <span class="stok-info" style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap;"></span>
                </div>
                <button type="button" class="btn btn-danger btn-icon" onclick="removeBookRow(this)" title="Hapus Baris" style="visibility: hidden;">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        </div>

        <?php if (empty($buku_tersedia)): ?>
            <div class="alert alert-warning">
                <i class='bx bx-info-circle'></i> Saat ini semua stok buku sedang kosong atau belum tersedia untuk dipinjam.
            </div>
        <?php elseif (($user['status_verifikasi'] ?? '') !== 'TERVERIFIKASI'): ?>
            <div style="display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid var(--card-border); flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary" style="flex: 1; min-width: 220px; padding: 12px 24px;" disabled title="Menunggu verifikasi KTM">
                    <i class='bx bx-lock-alt'></i> Menunggu Verifikasi KTM
                </button>
            </div>
        <?php else: ?>
            <div style="display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid var(--card-border); flex-wrap: wrap;">
                <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 220px; padding: 12px 24px;">
                    <i class='bx bx-check-circle'></i> Konfirmasi & Simpan Peminjaman
                </button>
                <a href="index.php?pg=beranda<?= $admin_query_str ?>" class="btn btn-secondary" style="flex: 1; min-width: 100px; padding: 12px 20px;">Batal</a>
            </div>
        <?php endif; ?>
    </form>
</div>

<script>
const bookOptionsHtml = `<?php foreach ($buku_tersedia as $b): ?><?php $limit_per_akun = (int)($b['maks_pinjam_per_anggota'] ?? 1); ?><option value="<?= htmlspecialchars($b['isbn']) ?>" data-stok="<?= $b['qty_stok'] ?>" data-limit="<?= $limit_per_akun ?>"><?= htmlspecialchars(addslashes($b['judul'])) ?> (Penulis: <?= htmlspecialchars(addslashes($b['nama_pengarang'] ?? '-')) ?> | Stok: <?= $b['qty_stok'] ?> eks | Maks/akun: <?= $limit_per_akun ?>)</option><?php endforeach; ?>`;

function handleBookChange(selectEl) {
    const row = selectEl.closest('.book-select-row');
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const stok = parseInt(selectedOption.getAttribute('data-stok')) || 1;
    const limit = parseInt(selectedOption.getAttribute('data-limit')) || 1;
    const qtyInput = row.querySelector('.qty-input');
    const stokInfo = row.querySelector('.stok-info');
    
    qtyInput.max = Math.min(stok, limit);
    if (parseInt(qtyInput.value) > Math.min(stok, limit)) {
        qtyInput.value = Math.min(stok, limit);
    }
    if (selectEl.value) {
        stokInfo.innerText = `(Stok: ${stok} | Maks/akun: ${limit})`;
    } else {
        stokInfo.innerText = '';
    }
}

function updateRowNumbers() {
    const rows = document.querySelectorAll('.book-select-row');
    rows.forEach((row, idx) => {
        row.querySelector('.row-num').innerText = (idx + 1) + '.';
        const deleteBtn = row.querySelector('.btn-danger');
        if (rows.length > 1) {
            deleteBtn.style.visibility = 'visible';
        } else {
            deleteBtn.style.visibility = 'hidden';
        }
    });
}

function addBookRow() {
    const container = document.getElementById('bookRowsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'book-select-row';
    newRow.style.cssText = 'display: flex; gap: 12px; align-items: center; background: #fff; border: 1px solid var(--card-border); padding: 14px 16px; border-radius: var(--radius-md); flex-wrap: wrap;';
    newRow.innerHTML = `
        <span class="row-num" style="width: 24px; font-weight: 700; color: var(--text-muted);"></span>
        <select name="isbn[]" class="form-control book-select" required style="flex: 2; min-width: 200px;" onchange="handleBookChange(this)">
            <option value="" data-stok="1">-- Pilih Judul Buku yang Tersedia --</option>
            ${bookOptionsHtml}
        </select>
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12.5px; font-weight: 700; color: var(--text-muted);">Jumlah (Qty):</span>
            <input type="number" name="qty[]" class="form-control qty-input" value="1" min="1" max="99" style="width: 75px; text-align: center; font-weight: 700;" required>
            <span class="stok-info" style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap;"></span>
        </div>
        <button type="button" class="btn btn-danger btn-icon" onclick="removeBookRow(this)" title="Hapus Baris">
            <i class='bx bx-trash'></i>
        </button>
    `;
    container.appendChild(newRow);
    updateRowNumbers();
}

function removeBookRow(btn) {
    const row = btn.closest('.book-select-row');
    row.remove();
    updateRowNumbers();
}

(function () {
    const initialSelect = document.querySelector('.book-select');
    if (initialSelect) {
        handleBookChange(initialSelect);
    }

    if (<?= $single_book_mode ? 'true' : 'false' ?>) {
        const addBtn = document.querySelector('[onclick="addBookRow()"]');
        if (addBtn) {
            addBtn.style.display = 'none';
        }
    }
})();
</script>
