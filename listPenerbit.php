<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$penerbit_list = db_fetch_all(db_query("SELECT pn.*, COUNT(b.isbn) as total_buku 
    FROM penerbit pn 
    LEFT JOIN buku b ON b.id_penerbit = pn.id_penerbit 
    GROUP BY pn.id_penerbit 
    ORDER BY pn.nama_penerbit ASC"));
$total = count($penerbit_list);
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Manajemen Penerbit Buku</h1>
        <p>Total <?= $total ?> penerbit terdaftar dalam sistem perpustakaan.</p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=formPenerbit<?= $admin_query_str ?>" class="btn btn-primary">
            <i class='bx bx-plus-circle'></i> Tambah Penerbit
        </a>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="100">Kode</th>
                    <th>Nama Penerbit</th>
                    <th>Email</th>
                    <th>Telepon</th>
                    <th>Alamat</th>
                    <th width="120" style="text-align: center;">Jumlah Buku</th>
                    <th width="140" style="text-align: center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($penerbit_list)): ?>
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class='bx bx-buildings' style="font-size: 36px; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                            Belum ada data penerbit yang tersimpan.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($penerbit_list as $pn): ?>
                        <tr>
                            <td><span class="badge badge-neutral" style="font-family: monospace;"><?= htmlspecialchars($pn['id_penerbit']) ?></span></td>
                            <td><strong style="color: #0f172a; font-size: 14px;"><?= htmlspecialchars($pn['nama_penerbit']) ?></strong></td>
                            <td><?= htmlspecialchars($pn['email'] ?: '-') ?></td>
                            <td><?= htmlspecialchars($pn['telp'] ?: '-') ?></td>
                            <td><?= htmlspecialchars($pn['alamat'] ?: '-') ?></td>
                            <td style="text-align: center;">
                                <span class="badge badge-info"><?= $pn['total_buku'] ?> Buku</span>
                            </td>
                            <td style="text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center;">
                                    <a href="index.php?pg=formPenerbit<?= $admin_query_str ?>&idPenerbit=<?= urlencode($pn['id_penerbit']) ?>" class="btn btn-secondary btn-sm" title="Edit">
                                        <i class='bx bx-edit'></i> Edit
                                    </a>
                                    <a href="index.php?pg=deletePenerbit<?= $admin_query_str ?>&idPenerbit=<?= urlencode($pn['id_penerbit']) ?>" class="btn btn-danger btn-sm" title="Hapus" onclick="return confirm('Apakah Anda yakin ingin menghapus penerbit \'<?= htmlspecialchars(addslashes($pn['nama_penerbit'])) ?>\'?')">
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
