<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
$admin_param = $user ? $user['admin_id'] : '';
$admin_query_str = $admin_param ? "&admin=" . urlencode($admin_param) : "";

$keyword = trim($_GET['keyword'] ?? ($_POST['keyword'] ?? ''));
$keyword_esc = db_escape($keyword);

$sql = "SELECT b.isbn, b.judul, b.tahun, b.qty_stok, pn.nama_penerbit, pg.nama_pengarang, kg.nama as nama_katalog 
        FROM buku b 
        LEFT JOIN penerbit pn ON pn.id_penerbit=b.id_penerbit 
        LEFT JOIN pengarang pg ON pg.id_pengarang=b.id_pengarang 
        LEFT JOIN katalog kg ON kg.id_katalog=b.id_katalog 
        WHERE b.judul LIKE '%$keyword_esc%' 
           OR pg.nama_pengarang LIKE '%$keyword_esc%' 
           OR pn.nama_penerbit LIKE '%$keyword_esc%' 
           OR b.isbn LIKE '%$keyword_esc%' 
        ORDER BY b.judul ASC";

$query = db_query($sql);
$buku_list = db_fetch_all($query);
$jumlah = count($buku_list);
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Hasil Pencarian Buku</h1>
        <p>Menampilkan <?= $jumlah ?> buku untuk kata kunci: <strong style="color: var(--primary);">"<?= htmlspecialchars($keyword) ?>"</strong></p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=viewbook<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-arrow-back'></i> Kembali ke Semua Buku
        </a>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="120">ISBN</th>
                    <th>Judul Buku</th>
                    <th>Pengarang</th>
                    <th>Penerbit</th>
                    <th>Tahun</th>
                    <th>Kategori</th>
                    <th width="100" style="text-align: center;">Ketersediaan</th>
                    <?php if ($user): ?>
                        <th width="100" style="text-align: center;">Aksi</th>
                    <?php endif; ?>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($buku_list)): ?>
                    <tr>
                        <td colspan="<?= $user ? '8' : '7' ?>" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class='bx bx-search-alt' style="font-size: 36px; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                            Tidak ditemukan buku dengan kata kunci "<strong><?= htmlspecialchars($keyword) ?></strong>". Silakan coba kata kunci lain.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($buku_list as $buku): ?>
                        <tr>
                            <td><span style="font-family: monospace; font-weight: 600; color: #475569;"><?= htmlspecialchars($buku['isbn']) ?></span></td>
                            <td><strong style="color: #0f172a; font-size: 14px;"><?= htmlspecialchars($buku['judul']) ?></strong></td>
                            <td><?= htmlspecialchars($buku['nama_pengarang'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($buku['nama_penerbit'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($buku['tahun'] ?? '-') ?></td>
                            <td><span class="badge badge-info"><?= htmlspecialchars($buku['nama_katalog'] ?? 'Umum') ?></span></td>
                            <td style="text-align: center;">
                                <?php if ($buku['qty_stok'] > 0): ?>
                                    <span class="badge badge-success"><i class='bx bx-check'></i> <?= $buku['qty_stok'] ?> eks</span>
                                <?php else: ?>
                                    <span class="badge badge-danger">Kosong</span>
                                <?php endif; ?>
                            </td>
                            <?php if ($user): ?>
                                <td style="text-align: center;">
                                    <?php if ($user['type'] === 'ANG'): ?>
                                        <a href="index.php?pg=peminjaman<?= $admin_query_str ?>" class="btn btn-primary btn-sm">
                                            <i class='bx bx-cart-add'></i> Pinjam
                                        </a>
                                    <?php elseif ($user['type'] === 'ADM'): ?>
                                        <a href="index.php?pg=formBuku<?= $admin_query_str ?>&idBuku=<?= urlencode($buku['isbn']) ?>" class="btn btn-secondary btn-sm">
                                            <i class='bx bx-edit'></i>
                                        </a>
                                    <?php endif; ?>
                                </td>
                            <?php endif; ?>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
