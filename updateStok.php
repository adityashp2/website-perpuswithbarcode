<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$isbn = trim($_POST['isbn'] ?? '');
$stok = (int)($_POST['stok'] ?? 0);

if (!empty($isbn)) {
    $isbn_esc = db_escape($isbn);
    $query = db_query("UPDATE buku SET qty_stok='$stok' WHERE isbn='$isbn_esc'");
    if ($query) {
        set_flash('success', 'Stok buku berhasil diperbarui menjadi <strong>' . $stok . '</strong> eksemplar.');
    } else {
        set_flash('error', 'Gagal memperbarui stok.');
    }
} else {
    set_flash('error', 'Data ISBN tidak valid.');
}

header("Location: index.php?pg=stokBuku&admin=" . urlencode($admin));
exit();
