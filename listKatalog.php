<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$katalog_list = db_fetch_all(db_query("SELECT k.*, COUNT(b.isbn) as total_buku 
    FROM katalog k 
    LEFT JOIN buku b ON b.id_katalog = k.id_katalog 
    GROUP BY k.id_katalog 
    ORDER BY k.id_katalog ASC"));
$total = count($katalog_list);
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Katalog Kategori Buku</h1>
        <p>Kelola klasifikasi dan pengelompokan tema buku perpustakaan.</p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=formKatalog<?= $admin_query_str ?>" class="btn btn-primary">
            <i class='bx bx-plus-circle'></i> Tambah Kategori
        </a>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="120">Kode Kategori</th>
                    <th>Nama Kategori</th>
                    <th width="150" style="text-align: center;">Jumlah Judul Buku</th>
                    <th width="140" style="text-align: center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($katalog_list)): ?>
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class='bx bx-category' style="font-size: 36px; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                            Belum ada kategori buku yang tersimpan.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($katalog_list as $k): ?>
                        <tr>
                            <td><span class="badge badge-neutral" style="font-family: monospace; font-size: 12px;"><?= htmlspecialchars($k['id_katalog']) ?></span></td>
                            <td><strong style="color: #0f172a; font-size: 14px;"><?= htmlspecialchars($k['nama']) ?></strong></td>
                            <td style="text-align: center;">
                                <span class="badge badge-info"><?= $k['total_buku'] ?> Judul</span>
                            </td>
                            <td style="text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center;">
                                    <a href="index.php?pg=formKatalog<?= $admin_query_str ?>&idKatalog=<?= urlencode($k['id_katalog']) ?>" class="btn btn-secondary btn-sm" title="Edit">
                                        <i class='bx bx-edit'></i> Edit
                                    </a>
                                    <a href="index.php?pg=deleteKatalog<?= $admin_query_str ?>&idKatalog=<?= urlencode($k['id_katalog']) ?>" class="btn btn-danger btn-sm" title="Hapus" onclick="return confirm('Apakah Anda yakin ingin menghapus kategori \'<?= htmlspecialchars(addslashes($k['nama'])) ?>\'?')">
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
