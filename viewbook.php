<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
$admin_param = $user ? $user['admin_id'] : '';
$admin_query_str = $admin_param ? "&admin=" . urlencode($admin_param) : "";

$katalog_filter = $_GET['katalog'] ?? '';

$sql = "SELECT b.isbn, b.judul, b.tahun, b.qty_stok, b.foto, pn.nama_penerbit, pg.nama_pengarang, kg.nama as nama_katalog 
        FROM buku b 
        LEFT JOIN penerbit pn ON pn.id_penerbit=b.id_penerbit 
        LEFT JOIN pengarang pg ON pg.id_pengarang=b.id_pengarang 
        LEFT JOIN katalog kg ON kg.id_katalog=b.id_katalog";

if (!empty($katalog_filter)) {
    $katalog_esc = db_escape($katalog_filter);
    $sql .= " WHERE b.id_katalog = '$katalog_esc'";
}

$sql .= " ORDER BY b.judul ASC";

$query = db_query($sql);
$buku_list = db_fetch_all($query);
$total_buku = count($buku_list);

// Fetch categories for filter
$katalog_list = db_fetch_all(db_query("SELECT * FROM katalog ORDER BY nama ASC"));
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Koleksi & Katalog Buku</h1>
        <p>Total <?= number_format($total_buku) ?> judul buku terdaftar di perpustakaan.</p>
    </div>
    <div class="page-actions">
        <form method="GET" action="index.php" style="display: flex; gap: 8px;">
            <input type="hidden" name="pg" value="viewbook">
            <?php if ($admin_param): ?>
                <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
            <?php endif; ?>
            <select name="katalog" class="form-control" style="width: auto; padding: 8px 14px; font-size: 13px;" onchange="this.form.submit()">
                <option value="">Semua Kategori</option>
                <?php foreach ($katalog_list as $kat): ?>
                    <option value="<?= htmlspecialchars($kat['id_katalog']) ?>" <?= $katalog_filter === $kat['id_katalog'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($kat['nama']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </form>
        <?php if ($user && $user['type'] === 'ADM'): ?>
            <a href="index.php?pg=formBuku<?= $admin_query_str ?>" class="btn btn-primary btn-sm">
                <i class='bx bx-plus'></i> Tambah Buku
            </a>
        <?php endif; ?>
    </div>
</div>

<div class="card">
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="80">Cover</th>
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
                        <td colspan="<?= $user ? '9' : '8' ?>" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            <i class='bx bx-book-open' style="font-size: 36px; display: block; margin-bottom: 8px; color: var(--text-light);"></i>
                            Tidak ada data buku ditemukan.
                        </td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($buku_list as $buku): ?>
                        <tr>
                            <td>
                                <?php if (!empty($buku['foto']) && file_exists(__DIR__ . '/' . $buku['foto'])): ?>
                                    <img src="<?= htmlspecialchars($buku['foto']) ?>" alt="Cover buku <?= htmlspecialchars($buku['judul']) ?>" style="width: 52px; height: 70px; object-fit: cover; border-radius: 10px; border: 1px solid var(--card-border); background: #f8fafc;" onerror="this.onerror=null;this.src='images/default-book-cover.svg';">
                                <?php else: ?>
                                    <img src="images/default-book-cover.svg" alt="Cover buku default" style="width: 52px; height: 70px; object-fit: cover; border-radius: 10px; border: 1px solid var(--card-border); background: #f8fafc;">
                                <?php endif; ?>
                            </td>
                            <td><span style="font-family: monospace; font-weight: 600; color: #475569;"><?= htmlspecialchars($buku['isbn']) ?></span></td>
                            <td>
                                <strong style="color: #0f172a; font-size: 14px;"><?= htmlspecialchars($buku['judul']) ?></strong>
                            </td>
                            <td><?= htmlspecialchars($buku['nama_pengarang'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($buku['nama_penerbit'] ?? '-') ?></td>
                            <td><?= htmlspecialchars($buku['tahun'] ?? '-') ?></td>
                            <td>
                                <span class="badge badge-info"><?= htmlspecialchars($buku['nama_katalog'] ?? 'Umum') ?></span>
                            </td>
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
                                        <a href="index.php?pg=peminjaman<?= $admin_query_str ?>&isbn=<?= urlencode($buku['isbn']) ?>" class="btn btn-primary btn-sm" title="Pinjam Buku">
                                            <i class='bx bx-cart-add'></i> Pinjam
                                        </a>
                                    <?php elseif ($user['type'] === 'ADM'): ?>
                                        <a href="index.php?pg=formBuku<?= $admin_query_str ?>&idBuku=<?= urlencode($buku['isbn']) ?>" class="btn btn-secondary btn-sm" title="Edit Data">
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
