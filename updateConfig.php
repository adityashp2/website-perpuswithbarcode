<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$id = (int)($_POST['id'] ?? 1);
$maxLamaPinjam = (int)($_POST['maxLamaPinjam'] ?? 3);
$dendaPerHari = (float)($_POST['dendaPerHari'] ?? 500);

$query = db_query("UPDATE config SET maxLamaPinjam='$maxLamaPinjam', dendaPerHari='$dendaPerHari' WHERE id='$id'");

if ($query) {
    set_flash('success', 'Pengaturan batas lama pinjam & besaran denda berhasil diperbarui.');
} else {
    set_flash('error', 'Gagal memperbarui konfigurasi.');
}

header("Location: index.php?pg=config&admin=" . urlencode($admin));
exit();
