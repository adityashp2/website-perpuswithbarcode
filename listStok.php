<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$buku_list = db_fetch_all(db_query("SELECT b.isbn, b.judul, b.qty_stok, kg.nama as nama_katalog 
    FROM buku b 
    LEFT JOIN katalog kg ON kg.id_katalog=b.id_katalog 
    ORDER BY b.qty_stok ASC, b.judul ASC"));
$total = count($buku_list);
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Manajemen & Pembaruan Stok Buku</h1>
        <p>Pantau jumlah fisik eksemplar buku dan lakukan penyesuaian kuantitas stok.</p>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="140">ISBN</th>
                    <th>Judul Buku</th>
                    <th>Kategori</th>
                    <th width="120" style="text-align: center;">Jumlah Stok</th>
                    <th width="140" style="text-align: center;">Status</th>
                    <th width="140" style="text-align: center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($buku_list)): ?>
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class='bx bx-layer' style="font-size: 36px; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                            Belum ada data buku tersimpan.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($buku_list as $b): ?>
                        <tr>
                            <td><span style="font-family: monospace; font-weight: 600;"><?= htmlspecialchars($b['isbn']) ?></span></td>
                            <td><strong style="color: #0f172a; font-size: 14px;"><?= htmlspecialchars($b['judul']) ?></strong></td>
                            <td><span class="badge badge-neutral"><?= htmlspecialchars($b['nama_katalog'] ?? 'Umum') ?></span></td>
                            <td style="text-align: center; font-weight: 700; font-size: 15px;">
                                <?= $b['qty_stok'] ?> eks
                            </td>
                            <td style="text-align: center;">
                                <?php if ($b['qty_stok'] > 5): ?>
                                    <span class="badge badge-success">Aman</span>
                                <?php elseif ($b['qty_stok'] > 0): ?>
                                    <span class="badge badge-warning">Menipis</span>
                                <?php else: ?>
                                    <span class="badge badge-danger">Habis</span>
                                <?php endif; ?>
                            </td>
                            <td style="text-align: center;">
                                <a href="index.php?pg=formUpdateStok<?= $admin_query_str ?>&idBuku=<?= urlencode($b['isbn']) ?>" class="btn btn-primary btn-sm">
                                    <i class='bx bx-edit-alt'></i> Update Stok
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
