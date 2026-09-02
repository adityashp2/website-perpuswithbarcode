<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    echo "<script>window.location.href='index.php?pg=notadmin';</script>";
    exit();
}

$admin_param     = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$sql = "SELECT b.isbn, b.judul, b.tahun, b.qty_stok, b.foto, pn.nama_penerbit, pg.nama_pengarang, kg.nama as nama_katalog 
        FROM buku b 
        LEFT JOIN penerbit pn ON pn.id_penerbit=b.id_penerbit 
        LEFT JOIN pengarang pg ON pg.id_pengarang=b.id_pengarang 
        LEFT JOIN katalog kg ON kg.id_katalog=b.id_katalog 
        ORDER BY b.judul ASC";

$query     = db_query($sql);
$buku_list = db_fetch_all($query);
$total     = count($buku_list);
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Manajemen Data Buku</h1>
        <p>Total <?= $total ?> judul buku tersimpan dalam basis data perpustakaan.</p>
    </div>
    <div class="page-actions">
        <a href="cetakBarcode.php?admin=<?= urlencode($admin_param) ?>" class="btn btn-secondary" target="_blank">
            <i class='bx bx-barcode'></i> Cetak Label Barcode
        </a>
        <a href="index.php?pg=formBuku<?= $admin_query_str ?>" class="btn btn-primary">
            <i class='bx bx-plus-circle'></i> Tambah Buku Baru
        </a>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                   <th width="90">Cover</th>
                   <th width="120">ISBN / Barcode</th>
                   <th>Judul Buku</th>
                   <th>Pengarang</th>
                   <th>Penerbit</th>
                   <th>Tahun</th>
                   <th>Kategori</th>
                   <th width="80" style="text-align: center;">Stok</th>
                   <th width="180" style="text-align: center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($buku_list)): ?>
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class='bx bx-book-open' style="font-size: 36px; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                            Belum ada data buku. Klik tombol "Tambah Buku Baru" untuk menambahkan.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($buku_list as $b): ?>
                        <tr>
                            <td>
                                <?php if (!empty($b['foto']) && file_exists(__DIR__ . '/' . $b['foto'])): ?>
                                    <img src="<?= htmlspecialchars($b['foto']) ?>" alt="Cover buku <?= htmlspecialchars($b['judul']) ?>" style="width: 62px; height: 78px; object-fit: cover; border-radius: 10px; border: 1px solid var(--card-border); background: #f8fafc;" onerror="this.onerror=null;this.src='images/default-book-cover.svg';">
                                <?php else: ?>
                                    <img src="images/default-book-cover.svg" alt="Cover buku default" style="width: 62px; height: 78px; object-fit: cover; border-radius: 10px; border: 1px solid var(--card-border); background: #f8fafc;">
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-start;">
                                    <span style="font-family: monospace; font-weight: 700; font-size:12px; color:var(--primary);"><?= htmlspecialchars($b['isbn']) ?></span>
                                    <svg class="barcode-svg"
                                         data-isbn="<?= htmlspecialchars($b['isbn']) ?>"
                                         style="max-width:120px; height:32px;"></svg>
                                </div>
                            </td>
                            <td><strong style="color: #0f172a; font-size: 14px;"><?= htmlspecialchars($b['judul']) ?></strong></td>
                            <td><?= htmlspecialchars($b['nama_pengarang'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($b['nama_penerbit'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($b['tahun'] ?? '-') ?></td>
                            <td><span class="badge badge-info"><?= htmlspecialchars($b['nama_katalog'] ?? 'Umum') ?></span></td>
                            <td style="text-align: center;">
                                <span class="badge <?= $b['qty_stok'] > 0 ? 'badge-success' : 'badge-danger' ?>">
                                    <?= $b['qty_stok'] ?>
                                </span>
                            </td>
                            <td style="text-align: center;">
                                <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                                    <a href="cetakBarcode.php?isbn=<?= urlencode($b['isbn']) ?>&admin=<?= urlencode($admin_param) ?>" class="btn btn-secondary btn-sm" title="Cetak Label Barcode Buku Ini" target="_blank">
                                        <i class='bx bx-barcode'></i>
                                    </a>
                                    <a href="index.php?pg=formBuku<?= $admin_query_str ?>&idBuku=<?= urlencode($b['isbn']) ?>" class="btn btn-secondary btn-sm" title="Edit Buku">
                                        <i class='bx bx-edit'></i> Edit
                                    </a>
                                    <a href="index.php?pg=deleteBuku<?= $admin_query_str ?>&idBuku=<?= urlencode($b['isbn']) ?>" class="btn btn-danger btn-sm" title="Hapus Buku" onclick="return confirm('Hapus buku \'<?= htmlspecialchars(addslashes($b['judul'])) ?>\'?')">
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

<!-- JsBarcode CDN -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
document.querySelectorAll('.barcode-svg').forEach(function(svg) {
    var isbn = svg.getAttribute('data-isbn');
    try {
        JsBarcode(svg, isbn, {
            format: 'CODE128',
            width: 1.2,
            height: 28,
            displayValue: false,
            margin: 0,
            background: 'transparent',
            lineColor: '#334155'
        });
    } catch(e) { /* skip invalid */ }
});
</script>
