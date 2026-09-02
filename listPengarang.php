<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$pengarang_list = db_fetch_all(db_query("SELECT pg.*, COUNT(b.isbn) as total_buku 
    FROM pengarang pg 
    LEFT JOIN buku b ON b.id_pengarang = pg.id_pengarang 
    GROUP BY pg.id_pengarang 
    ORDER BY pg.nama_pengarang ASC"));
$total = count($pengarang_list);
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Manajemen Pengarang & Penulis</h1>
        <p>Total <?= $total ?> pengarang terdaftar dalam sistem perpustakaan.</p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=formPengarang<?= $admin_query_str ?>" class="btn btn-primary">
            <i class='bx bx-plus-circle'></i> Tambah Pengarang
        </a>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="100">Kode</th>
                    <th>Nama Pengarang</th>
                    <th>Email</th>
                    <th>Telepon</th>
                    <th>Alamat</th>
                    <th width="120" style="text-align: center;">Jumlah Buku</th>
                    <th width="140" style="text-align: center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($pengarang_list)): ?>
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class='bx bx-pencil' style="font-size: 36px; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                            Belum ada data pengarang yang tersimpan.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($pengarang_list as $pg): ?>
                        <tr>
                            <td><span class="badge badge-neutral" style="font-family: monospace;"><?= htmlspecialchars($pg['id_pengarang']) ?></span></td>
                            <td><strong style="color: #0f172a; font-size: 14px;"><?= htmlspecialchars($pg['nama_pengarang']) ?></strong></td>
                            <td><?= htmlspecialchars($pg['email'] ?: '-') ?></td>
                            <td><?= htmlspecialchars($pg['telp'] ?: '-') ?></td>
                            <td><?= htmlspecialchars($pg['alamat'] ?: '-') ?></td>
                            <td style="text-align: center;">
                                <span class="badge badge-info"><?= $pg['total_buku'] ?> Buku</span>
                            </td>
                            <td style="text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center;">
                                    <a href="index.php?pg=formPengarang<?= $admin_query_str ?>&idPengarang=<?= urlencode($pg['id_pengarang']) ?>" class="btn btn-secondary btn-sm" title="Edit">
                                        <i class='bx bx-edit'></i> Edit
                                    </a>
                                    <a href="index.php?pg=deletePengarang<?= $admin_query_str ?>&idPengarang=<?= urlencode($pg['id_pengarang']) ?>" class="btn btn-danger btn-sm" title="Hapus" onclick="return confirm('Apakah Anda yakin ingin menghapus pengarang \'<?= htmlspecialchars(addslashes($pg['nama_pengarang'])) ?>\'?')">
                                        <i class='bx bx-trash'></i>
                                    </a>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
